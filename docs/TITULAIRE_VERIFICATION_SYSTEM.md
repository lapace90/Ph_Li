# Système de vérification pour les Titulaires

## 📋 Vue d'ensemble

Les titulaires (pharmaciens propriétaires) ont accès à un système double de vérification:
1. **Vérification RPPS** - Obligatoire pour publier des annonces
2. **Vérification SIRET** - Sécurise le profil sur le marketplace
3. **Gestion de pharmacies** - Groupe de pharmacies avec SIRET vérifié

## 🎯 Composants

### Écrans
1. **`rppsVerification.jsx`** - Vérification RPPS (existant)
2. **`siretVerification.jsx`** - Vérification SIRET personnel
3. **`pharmacyManagement.jsx`** - Gestion centralisée (nouveau)

### Services
- **`rppsService.js`** - Vérification RPPS via API ANS
- **`siretVerificationService.js`** - Vérification SIRET via API INSEE
- **`pharmacyDetailsService.js`** - Gestion des pharmacies

### Hooks
- **`usePharmacyDetails.js`** - Hook pour gérer les pharmacies

## 💾 Structure de données

### Table: verification_documents

Utilisée pour:
- RPPS (titulaires et préparateurs)
- SIRET personnel (titulaires, animateurs, laboratoires)

```sql
{
  user_id: uuid,
  verification_type: 'rpps' | 'siret',
  document_reference: 'XXXXXXXXXXX',
  status: 'approved' | 'rejected' | 'pending',
  verification_data: jsonb,
  rejection_reason: text,
  submitted_at: timestamp,
  verified_at: timestamp
}
```

Contrainte: `UNIQUE (user_id, verification_type)`

### Table: pharmacy_details

Pour les pharmacies multiples d'un titulaire:

```sql
{
  id: uuid,
  owner_id: uuid, -- ID du titulaire
  siret: text,
  siret_verified: boolean,
  name: text,
  legal_name: text,
  address: text,
  city: text,
  postal_code: text,
  ...
}
```

## 🔄 Flux utilisateur

### 1. Vérification RPPS (obligatoire pour publier)

```
Titulaire → Profil → "Vérification RPPS" (si non vérifié)
         → Entre numéro RPPS (11 chiffres)
         → Soumission
         ↓
API ANS  → Vérifie RPPS + nom/prénom
         ↓
verification_documents → Enregistre status='approved'
         ↓
user.rpps_verified = true
         ↓
Peut publier annonces ✓
```

### 2. Vérification SIRET personnel (marketplace)

```
Titulaire → Profil → "Vérifications & Pharmacies"
         → Section "Vérification personnelle"
         → "Vérifier mon SIRET"
         → Entre SIRET (14 chiffres)
         → Soumission
         ↓
API INSEE → Vérifie SIRET
          ↓
verification_documents → Enregistre status='approved'
          ↓
user.siret_verified = true
          ↓
Badge "Titulaire Vérifié" affiché ✓
```

### 3. Gestion de groupe de pharmacies

```
Titulaire → Profil → "Vérifications & Pharmacies"
         → Section "Mes pharmacies"
         → "Ajouter"
         → Entre SIRET de la pharmacie
         → Soumission
         ↓
API INSEE → Vérifie SIRET
         → Récupère infos (nom, adresse, etc.)
         ↓
pharmacy_details → Crée pharmacie avec siret_verified=true
         ↓
Liste de pharmacies mise à jour ✓
```

## 🎨 Interface utilisateur

### Écran: pharmacyManagement.jsx

**Section 1: Vérification personnelle**
- Si vérifié: Badge vert "SIRET Personnel Vérifié" + numéro
- Si non vérifié: Bouton "Vérifier mon SIRET" → siretVerification.jsx

**Section 2: Mes pharmacies**
- Bouton "Ajouter" pour ajouter une pharmacie
- Liste des pharmacies avec:
  - Nom
  - Adresse
  - SIRET
  - Badge "SIRET Vérifié" si vérifié

**Carte pharmacie:**
```
┌─────────────────────────────────────┐
│ [Icône]  Pharmacie Centrale  ✓     │
│          12 rue de la Paix, Paris   │
│          SIRET: 123 456 789 01234   │
│                                  >  │
└─────────────────────────────────────┘
```

### Profil titulaire (profile.jsx)

**Menu rapide:**
```
┌─────────────────────────────────────┐
│ 💼 Mes annonces                 >   │
│    Emplois, stages et pharmacies    │
├─────────────────────────────────────┤
│ 🛡️ Vérifications & Pharmacies   >   │
│    ✓ SIRET vérifié                  │
└─────────────────────────────────────┘
```

**Alertes (si non vérifié):**
```
┌─────────────────────────────────────┐
│ ⚠️  Vérification RPPS            >  │
│     Requis pour publier des annonces│
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ 🏢 Vérification SIRET            >  │
│    Sécurisez votre profil           │
└─────────────────────────────────────┘
```

## ✨ Badges affichés

### Badge RPPS
- **Où**: Profil utilisateur, cartes de recruteur
- **Condition**: `user.rpps_verified === true`
- **Texte**: "RPPS Vérifié"
- **Couleur**: Vert (success)

### Badge SIRET
- **Où**: Profil utilisateur, marketplace
- **Condition**: `user.siret_verified === true`
- **Texte**: "SIRET Vérifié"
- **Couleur**: Vert (success)

### Badge Pharmacie
- **Où**: Cartes de pharmacies dans pharmacyManagement
- **Condition**: `pharmacy.siret_verified === true`
- **Texte**: Icône checkCircle uniquement (petit badge)

## 🔐 Sécurité

### Validation RPPS
- Format: exactement 11 chiffres
- Vérification API ANS
- Correspondance nom/prénom
- Un RPPS = un compte

### Validation SIRET
- Format: exactement 14 chiffres
- Vérification API INSEE
- État administratif actif
- Un SIRET = un compte (sauf pharmacies multiples)

### Pharmacies multiples
- Plusieurs pharmacies autorisées par titulaire
- Chaque pharmacie a son propre SIRET
- Vérification automatique via API INSEE
- Badge vérifié par pharmacie

## 📊 Avantages pour les titulaires

### Avec RPPS vérifié
✅ Peut publier des offres d'emploi
✅ Peut publier des stages
✅ Peut publier des annonces de pharmacies
✅ Badge "RPPS Vérifié" sur le profil

### Avec SIRET vérifié
✅ Badge "SIRET Vérifié" sur le profil
✅ Crédibilité renforcée sur le marketplace
✅ Visible dans les recherches sécurisées
✅ Confiance des candidats

### Avec pharmacies vérifiées
✅ Groupe de pharmacies visible
✅ Chaque site authentifié
✅ Informations complètes (adresse, SIRET)
✅ Facilite le recrutement multi-sites

## 🔧 Migration depuis l'ancien système

### Ancien système (pharmacy_details)
- Champ `siret_verified` (booléen)
- Pas de traçabilité
- Pas de date de vérification

### Nouveau système (verification_documents)
- Statuts multiples (approved/rejected/pending)
- Traçabilité complète
- Date de soumission et vérification
- Raison de rejet

### Cohabitation
Les deux systèmes cohabitent:
- `pharmacy_details.siret_verified` pour les pharmacies multiples
- `verification_documents` pour le SIRET personnel du titulaire

## 🚀 TODO Futur

- [ ] Migrer `pharmacy_details.siret_verified` vers `verification_documents`
- [ ] Ajouter `verification_type = 'pharmacy_siret'` avec `pharmacy_id` dans `verification_data`
- [ ] Permettre l'édition des pharmacies
- [ ] Permettre la suppression des pharmacies
- [ ] Statistiques de pharmacies par titulaire
- [ ] Notification si SIRET devient inactif

## 📝 Exemples de code

### Vérifier le SIRET personnel

```javascript
import { siretVerificationService } from '../../services/siretVerificationService';

const result = await siretVerificationService.submitVerification(
  userId,
  '12345678901234'
);

if (result.verified) {
  // Badge affiché automatiquement via AuthContext
  console.log('SIRET vérifié:', result.data.name);
}
```

### Ajouter une pharmacie

```javascript
import { usePharmacyDetails } from '../../hooks/usePharmacyDetails';

const { addPharmacy } = usePharmacyDetails(userId);

const result = await addPharmacy('98765432109876');

if (result.success) {
  console.log('Pharmacie ajoutée:', result.pharmacy.name);
}
```

### Charger les pharmacies

```javascript
const { pharmacies, loading } = usePharmacyDetails(userId);

pharmacies.map(pharmacy => (
  <PharmacyCard
    key={pharmacy.id}
    pharmacy={pharmacy}
    verified={pharmacy.siret_verified}
  />
));
```

## 🔗 Fichiers concernés

### Créés
- `app/(screens)/pharmacyManagement.jsx`
- `docs/TITULAIRE_VERIFICATION_SYSTEM.md`

### Modifiés
- `app/(tabs)/profile.jsx` - Ajout menu et alertes
- `contexts/AuthContext.jsx` - Chargement siret_verified

### Existants (non modifiés)
- `services/rppsService.js`
- `services/siretVerificationService.js`
- `services/pharmacyDetailsService.js`
- `hooks/usePharmacyDetails.js`
- `app/(screens)/rppsVerification.jsx`
- `app/(screens)/siretVerification.jsx`
