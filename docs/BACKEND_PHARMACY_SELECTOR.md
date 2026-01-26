# Modifications Backend - Système de Sélection de Pharmacie

## 📅 Date
**24 janvier 2026**

## 🎯 Objectif

Permettre aux titulaires de sélectionner une pharmacie lors de la création d'offres (emploi/stage/listing) et stocker ces informations avec le mode discret.

## ✅ Checklist des modifications

### 1. Migration SQL ✅

**Fichier**: [supabase/migrations/add_pharmacy_selector_fields.sql](../supabase/migrations/add_pharmacy_selector_fields.sql)

#### À exécuter dans Supabase

```sql
-- Connexion à Supabase Dashboard > SQL Editor
-- Copier-coller le contenu du fichier add_pharmacy_selector_fields.sql
-- Exécuter la migration
```

**Colonnes ajoutées** :

| Table | Colonnes |
|-------|----------|
| `job_offers` | pharmacy_id, pharmacy_name, pharmacy_siret, pharmacy_siret_verified, discrete_mode |
| `internship_offers` | pharmacy_id, pharmacy_name, pharmacy_siret, pharmacy_siret_verified, discrete_mode |
| `pharmacy_listings` | pharmacy_id, pharmacy_siret, pharmacy_siret_verified |

**Index créés** :
- `idx_job_offers_pharmacy_id`
- `idx_job_offers_pharmacy_siret_verified`
- `idx_internship_offers_pharmacy_id`
- `idx_internship_offers_pharmacy_siret_verified`
- `idx_pharmacy_listings_pharmacy_id`
- `idx_pharmacy_listings_pharmacy_siret_verified`

**Contraintes** :
- FK `pharmacy_id` → `pharmacy_details(id)` avec `ON DELETE SET NULL`

### 2. Services mis à jour ✅

#### [services/jobOfferService.js](../services/jobOfferService.js:45)

**Fonction `create()` mise à jour** :

```javascript
async create(ownerId, offerData) {
  const { data, error } = await supabase
    .from('job_offers')
    .insert({
      // ... champs existants
      // Pharmacy selector fields (AJOUTÉ)
      pharmacy_id: offerData.pharmacy_id || null,
      pharmacy_name: offerData.pharmacy_name || null,
      pharmacy_siret: offerData.pharmacy_siret || null,
      pharmacy_siret_verified: offerData.pharmacy_siret_verified || false,
      discrete_mode: offerData.discrete_mode || false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### [services/internshipOfferService.js](../services/internshipOfferService.js:35)

**Fonction `create()` mise à jour** :

```javascript
async create(ownerId, offerData) {
  const startDate = offerData.start_date === 'asap' ? null : offerData.start_date;

  const { data, error } = await supabase
    .from('internship_offers')
    .insert({
      // ... champs existants
      // Pharmacy selector fields (AJOUTÉ)
      pharmacy_id: offerData.pharmacy_id || null,
      pharmacy_name: offerData.pharmacy_name || null,
      pharmacy_siret: offerData.pharmacy_siret || null,
      pharmacy_siret_verified: offerData.pharmacy_siret_verified || false,
      discrete_mode: offerData.discrete_mode || false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### [services/pharmacyListingService.js](../services/pharmacyListingService.js:48)

**Déjà flexible** : Le service utilise `...listingData`, donc les nouveaux champs sont automatiquement inclus.

```javascript
async create(userId, listingData) {
  const { data, error } = await supabase
    .from('pharmacy_listings')
    .insert({
      user_id: userId,
      ...listingData, // ✅ Inclut automatiquement pharmacy_id, pharmacy_siret, pharmacy_siret_verified
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 3. RLS Policies

**Aucune modification nécessaire** - Les nouvelles colonnes héritent automatiquement des policies existantes.

Les policies RLS en place sur `job_offers`, `internship_offers` et `pharmacy_listings` continuent de fonctionner normalement.

## 📊 Structure des données

### Données envoyées par le frontend

```javascript
{
  // ... autres champs de l'offre
  pharmacy_id: "uuid-de-la-pharmacie",           // FK vers pharmacy_details
  pharmacy_name: "Pharmacie Centrale",           // NULL si discrete_mode = true
  pharmacy_siret: "12345678901234",              // Toujours présent
  pharmacy_siret_verified: true,                 // Badge vérifié
  discrete_mode: false,                          // Flag mode discret
}
```

### Mode discret

Lorsque `discrete_mode = true` :
- `pharmacy_name` est stocké comme `NULL` dans la base de données
- `pharmacy_siret` et `pharmacy_siret_verified` restent présents (badge visible)
- Le frontend affiche "Pharmacie à [ville]" au lieu du nom

## 🚀 Déploiement

### Étapes à suivre

1. **Exécuter la migration SQL**
   ```bash
   # Via Supabase Dashboard > SQL Editor > New query
   # Utiliser le fichier: supabase/migrations/add_pharmacy_selector_fields_simple.sql
   # Copier-coller le contenu complet > Run
   ```

   **⚠️ Important**: Utilisez `add_pharmacy_selector_fields_simple.sql` (sans la section de vérification qui peut causer des erreurs de syntaxe).

2. **Vérifier que les colonnes ont été créées**
   ```bash
   # Via Supabase Dashboard > SQL Editor > New query
   # Utiliser le fichier: supabase/migrations/verify_pharmacy_selector_fields.sql
   # Copier-coller le contenu > Run
   # Vous devriez voir:
   # - job_offers: 5 colonnes
   # - internship_offers: 5 colonnes
   # - pharmacy_listings: 3 colonnes
   ```

3. **Vérifier les colonnes manuellement (optionnel)**
   ```sql
   -- Vérifier job_offers
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'job_offers'
     AND column_name IN ('pharmacy_id', 'pharmacy_name', 'pharmacy_siret', 'pharmacy_siret_verified', 'discrete_mode');

   -- Vérifier internship_offers
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'internship_offers'
     AND column_name IN ('pharmacy_id', 'pharmacy_name', 'pharmacy_siret', 'pharmacy_siret_verified', 'discrete_mode');

   -- Vérifier pharmacy_listings
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'pharmacy_listings'
     AND column_name IN ('pharmacy_id', 'pharmacy_siret', 'pharmacy_siret_verified');
   ```

3. **Déployer les services mis à jour**
   - Les fichiers `jobOfferService.js` et `internshipOfferService.js` ont déjà été modifiés
   - Aucune autre modification backend nécessaire

4. **Tester la création d'offres**
   - Créer une offre d'emploi avec pharmacie sélectionnée
   - Créer une offre de stage avec pharmacie sélectionnée
   - Tester le mode discret (pharmacy_name doit être NULL)

## 🔍 Vérification post-déploiement

### Requêtes de test

```sql
-- Vérifier une offre d'emploi avec pharmacie
SELECT
  id,
  title,
  pharmacy_id,
  pharmacy_name,
  pharmacy_siret_verified,
  discrete_mode,
  city
FROM job_offers
WHERE pharmacy_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier une offre de stage avec pharmacie
SELECT
  id,
  title,
  pharmacy_id,
  pharmacy_name,
  pharmacy_siret_verified,
  discrete_mode,
  city
FROM internship_offers
WHERE pharmacy_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier le mode discret
SELECT
  id,
  title,
  discrete_mode,
  pharmacy_name, -- Doit être NULL si discrete_mode = true
  pharmacy_siret_verified -- Doit être true même en mode discret
FROM job_offers
WHERE discrete_mode = true;
```

## 🐛 Résolution de problèmes

### Erreur : "column does not exist"

**Problème** : Le frontend envoie les nouveaux champs mais la migration n'a pas été exécutée.

**Solution** :
```sql
-- Vérifier si la migration a été exécutée
SELECT * FROM information_schema.columns
WHERE table_name IN ('job_offers', 'internship_offers', 'pharmacy_listings')
  AND column_name = 'pharmacy_id';

-- Si aucun résultat, exécuter la migration
```

### Erreur : "foreign key constraint"

**Problème** : Le `pharmacy_id` référence une pharmacie qui n'existe pas.

**Solution** :
```sql
-- Vérifier que la pharmacie existe
SELECT id, name FROM pharmacy_details WHERE id = 'uuid-de-la-pharmacie';
```

### pharmacy_name affiché en mode discret

**Problème** : Le nom de la pharmacie s'affiche même avec discrete_mode = true.

**Solution** : Vérifier que le frontend envoie bien `pharmacy_name: null` quand `discrete_mode = true`. Voir [jobOfferCreate.jsx:176](../app/(screens)/jobOfferCreate.jsx:176)

```javascript
pharmacy_name: discreteMode ? null : (formData.pharmacy_name || null),
```

## 📚 Références

- **Documentation frontend** : [PHARMACY_SELECTOR_SYSTEM.md](./PHARMACY_SELECTOR_SYSTEM.md)
- **Table pharmacy_details** : [SIRET_VERIFICATION_SYSTEM.md](./SIRET_VERIFICATION_SYSTEM.md)
- **RGPD** : [RGPD_SIRET_UPDATES.md](./RGPD_SIRET_UPDATES.md)

## 📧 Support

Pour toute question sur les modifications backend :
- **Migration SQL** : supabase/migrations/add_pharmacy_selector_fields.sql
- **Services** : services/jobOfferService.js, services/internshipOfferService.js
- **Documentation** : Ce fichier
