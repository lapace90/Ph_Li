# Système de Sélection de Pharmacie

## 📅 Date de création
**24 janvier 2026**

## 🎯 Vue d'ensemble

Le système de sélection de pharmacie permet aux titulaires de:
1. **Gérer plusieurs pharmacies** dans leur profil
2. **Sélectionner une pharmacie** lors de la création d'offres (emploi/stage)
3. **Pré-remplir automatiquement** les informations de localisation
4. **Activer le mode discret** pour masquer le nom tout en gardant le badge de vérification

## 🏗️ Architecture du système

### Composants principaux

#### 1. Hook de gestion des pharmacies
**Fichier**: [hooks/usePharmacyDetails.js](../hooks/usePharmacyDetails.js)

```javascript
const {
  pharmacies,           // Liste des pharmacies du titulaire
  primaryPharmacy,      // Pharmacie principale (première vérifiée)
  verifiedPharmacies,   // Pharmacies avec SIRET vérifié uniquement
  loading,              // État de chargement
  error,                // Erreurs éventuelles
  refresh,              // Recharger la liste
  addPharmacy,          // Ajouter avec vérification SIRET
  addPharmacyManual,    // Ajouter manuellement (sans SIRET)
  updatePharmacy,       // Mettre à jour une pharmacie
  deletePharmacy,       // Supprimer une pharmacie
  verifySiret,         // Vérifier un SIRET (sans créer)
} = usePharmacyDetails(ownerId);
```

**Responsabilités**:
- Charger les pharmacies d'un titulaire
- CRUD sur les pharmacies
- Vérification SIRET via API INSEE
- Gestion du cache et des états

#### 2. Composant PharmacySelectorModal
**Utilisation**: Modal réutilisable pour sélectionner une pharmacie

```javascript
<PharmacySelectorModal
  visible={showPharmacySelector}
  onClose={() => setShowPharmacySelector(false)}
  pharmacies={pharmacies}
  loading={pharmaciesLoading}
  onSelect={handlePharmacySelect}
/>
```

**Fonctionnalités**:
- Liste toutes les pharmacies du titulaire
- Affiche le badge de vérification SIRET
- Affiche le SIRET formaté
- Gestion des états (loading, vide, liste)

#### 3. Section profil
**Fichier**: [app/(tabs)/profile.jsx](../app/(tabs)/profile.jsx:1)

Affiche un aperçu compact des pharmacies (max 3) avec:
- Nombre de pharmacies vérifiées
- Lien vers la gestion complète
- Icône et badge de vérification

## 📋 Flux d'utilisation

### 1. Création d'une offre d'emploi ou de stage

```
┌─────────────────────────────────────────────────────────────┐
│  Étape 1: Type d'offre                                       │
│  - Sélection CDI/CDD/Remplacement ou Stage/Alternance       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Étape 2/3: Localisation                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Bouton] Choisir une pharmacie (3)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                    ↓ (si cliqué)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Modal: Sélectionner une pharmacie                   │   │
│  │ - Pharmacie Centrale ✓ SIRET vérifié                │   │
│  │ - Pharmacie du Centre                                │   │
│  │ - Pharmacie de la Gare ✓ SIRET vérifié              │   │
│  └─────────────────────────────────────────────────────┘   │
│                    ↓ (sélection)                            │
│  ✅ Pharmacie Centrale [Changer]                            │
│  Auto-remplissage:                                          │
│  - Ville, Code postal, Région, Département                 │
│  - Coordonnées GPS (latitude/longitude)                    │
│  - Nom, SIRET, Badge vérifié                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  Étape finale: Aperçu                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Mode discret                                [⚪ OFF]  │   │
│  │ Le nom de la pharmacie sera affiché                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                    ↓ (si activé)                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Mode discret                                [🟢 ON]   │   │
│  │ Nom masqué. Badge vérifié reste visible.            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Aperçu de l'annonce:                                       │
│  🏢 Pharmacie Centrale ✓  (mode normal)                     │
│  🏢 Pharmacie à Paris ✓   (mode discret)                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Gestion des pharmacies

Le titulaire peut gérer ses pharmacies via:
- **Profil** → Section "Mes pharmacies" → Bouton "Voir tout"
- Accès direct à [app/(screens)/pharmacyManagement.jsx](../app/(screens)/pharmacyManagement.jsx:1)

## 🔒 Mode Discret

### Objectif
Permettre aux titulaires de publier des offres **sans révéler le nom exact de leur pharmacie** tout en conservant la **crédibilité du badge SIRET vérifié**.

### Cas d'usage
- Titulaire souhaitant recruter discrètement
- Éviter que les employés actuels voient l'annonce
- Protection de la vie privée de l'établissement

### Comportement

| Mode | Nom affiché | Badge SIRET | Adresse exacte |
|------|-------------|-------------|----------------|
| **Normal** | "Pharmacie Centrale" | ✓ Visible | Ville, Région (pas l'adresse exacte) |
| **Discret** | "Pharmacie à Paris" | ✓ Visible | Ville, Région (pas l'adresse exacte) |

### Implémentation technique

```javascript
// État dans le composant
const [discreteMode, setDiscreteMode] = useState(false);

// Toggle dans l'aperçu (StepPreview)
{selectedPharmacy && (
  <View style={commonStyles.card}>
    <View style={commonStyles.rowBetween}>
      <View style={commonStyles.flex1}>
        <Text style={commonStyles.sectionTitleSmall}>Mode discret</Text>
        <Text style={commonStyles.hint}>
          {discreteMode
            ? 'Nom de la pharmacie masqué. Le badge vérifié reste visible.'
            : 'Le nom de la pharmacie sera affiché sur l\'annonce.'}
        </Text>
      </View>
      <Switch
        value={discreteMode}
        onValueChange={setDiscreteMode}
        trackColor={{ false: theme.colors.gray, true: theme.colors.primary + '50' }}
        thumbColor={discreteMode ? theme.colors.primary : '#f4f3f4'}
      />
    </View>
  </View>
)}

// Affichage dans l'aperçu
{selectedPharmacy && (
  <View style={commonStyles.rowGapSmall}>
    <Icon name="building" size={16} color={theme.colors.textLight} />
    <Text style={commonStyles.hint}>
      {discreteMode ? `Pharmacie à ${formData.city}` : selectedPharmacy.name}
    </Text>
    {selectedPharmacy.siret_verified && <SiretBadge verified={true} size="small" />}
  </View>
)}

// Sauvegarde
await createOffer({
  ...formData,
  pharmacy_id: selectedPharmacy?.id || null,
  pharmacy_name: discreteMode ? null : (formData.pharmacy_name || null), // ⬅️ null si discret
  pharmacy_siret: formData.pharmacy_siret || null,
  pharmacy_siret_verified: formData.pharmacy_siret_verified || false,
  discrete_mode: discreteMode, // ⬅️ flag enregistré
  status,
});
```

## 📁 Fichiers concernés

### Écrans d'offres

#### [app/(screens)/jobOfferCreate.jsx](../app/(screens)/jobOfferCreate.jsx:1)
**Offres d'emploi (CDI/CDD/Remplacement)**

Modifications:
- ✅ Import de `usePharmacyDetails`, `Modal`, `ActivityIndicator`, `Switch`, `SiretBadge`
- ✅ État pour pharmacie sélectionnée et mode discret
- ✅ `handlePharmacySelect` pré-remplit les données
- ✅ `handlePublish` inclut pharmacy_id, pharmacy_name (conditionnel), pharmacy_siret, pharmacy_siret_verified, discrete_mode
- ✅ `StepLocation` : bouton sélecteur avec preview de la pharmacie choisie
- ✅ `StepPreview` : toggle mode discret + aperçu avec badge
- ✅ `PharmacySelectorModal` : composant réutilisable
- ✅ Styles pour selector, modal, badges

#### [app/(screens)/internshipOfferCreate.jsx](../app/(screens)/internshipOfferCreate.jsx:1)
**Offres de stage/alternance**

Modifications identiques à jobOfferCreate.jsx:
- ✅ Import de `usePharmacyDetails`, `Modal`, `ActivityIndicator`, `Switch`, `SiretBadge`
- ✅ État pour pharmacie sélectionnée et mode discret
- ✅ `handlePharmacySelect` pré-remplit les données
- ✅ `handlePublish` inclut pharmacy_id, pharmacy_name (conditionnel), pharmacy_siret, pharmacy_siret_verified, discrete_mode
- ✅ `StepLocation` : bouton sélecteur avec preview de la pharmacie choisie
- ✅ `StepPreview` : toggle mode discret + aperçu avec badge
- ✅ `PharmacySelectorModal` : composant réutilisable
- ✅ Styles pour selector, modal, badges

#### [app/(screens)/listingCreate.jsx](../app/(screens)/listingCreate.jsx:1)
**Petites annonces**

❌ **Non implémenté pour le moment**
- Pourrait bénéficier du même système si nécessaire à l'avenir

### Profil

#### [app/(tabs)/profile.jsx](../app/(tabs)/profile.jsx:1)
**Onglet Profil**

Modifications:
- ✅ Import de `usePharmacyDetails`
- ✅ Chargement des pharmacies pour les titulaires
- ✅ Section "Mes pharmacies" avec cartes compactes (max 3 affichées)
- ✅ Badge de vérification SIRET
- ✅ Compteur de pharmacies vérifiées
- ✅ Lien "Voir tout" vers pharmacyManagement

## 🎨 Design Pattern

### PharmacySelectorModal - Composant réutilisable

```javascript
const PharmacySelectorModal = ({ visible, onClose, pharmacies = [], loading, onSelect }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Sélectionner une pharmacie</Text>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Icon name="x" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={[commonStyles.centered, { padding: hp(4) }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[commonStyles.hint, { marginTop: hp(2) }]}>Chargement...</Text>
          </View>
        ) : pharmacies.length === 0 ? (
          <View style={[commonStyles.centered, { padding: hp(4) }]}>
            <Icon name="building" size={48} color={theme.colors.textLight} />
            <Text style={[commonStyles.hint, { marginTop: hp(2), textAlign: 'center' }]}>
              Aucune pharmacie enregistrée
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {pharmacies.map((pharmacy) => (
              <Pressable
                key={pharmacy.id}
                style={styles.pharmacyOption}
                onPress={() => onSelect(pharmacy)}
              >
                <View style={styles.pharmacyOptionIcon}>
                  <Icon name="building" size={20} color={theme.colors.primary} />
                </View>
                <View style={commonStyles.flex1}>
                  <View style={commonStyles.rowGapSmall}>
                    <Text style={styles.pharmacyOptionName}>{pharmacy.name}</Text>
                    {pharmacy.siret_verified && (
                      <View style={styles.verifiedBadge}>
                        <Icon name="checkCircle" size={12} color={theme.colors.success} />
                      </View>
                    )}
                  </View>
                  <Text style={commonStyles.hint} numberOfLines={1}>
                    {pharmacy.address}, {pharmacy.city}
                  </Text>
                  {pharmacy.siret && (
                    <Text style={[commonStyles.hint, { fontSize: hp(1.2), marginTop: hp(0.2) }]}>
                      SIRET: {pharmacy.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}
                    </Text>
                  )}
                </View>
                <Icon name="chevronRight" size={20} color={theme.colors.textLight} />
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.modalFooter}>
          <Button title="Annuler" onPress={onClose} buttonStyle={styles.cancelButton} />
        </View>
      </View>
    </View>
  </Modal>
);
```

**Avantages**:
- Réutilisable dans tous les écrans
- Gestion des états (loading, vide, liste)
- Design cohérent
- Animation slide-up

## 🗄️ Structure de données

### Table pharmacy_details

```sql
CREATE TABLE pharmacy_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_name TEXT,
  siret TEXT UNIQUE,
  siret_verified BOOLEAN DEFAULT false,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  department TEXT,
  region TEXT,
  latitude FLOAT,
  longitude FLOAT,
  phone TEXT,
  email TEXT,
  pharmacy_type TEXT, -- 'officine', 'hopital', 'clinique'
  finess_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Données d'offre avec pharmacie

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

## 🔄 Flux de pré-remplissage

Lorsqu'une pharmacie est sélectionnée:

```javascript
const handlePharmacySelect = (pharmacy) => {
  setSelectedPharmacy(pharmacy);
  setFormData(prev => ({
    ...prev,
    // Localisation (pré-remplissage)
    city: pharmacy.city || prev.city,
    postal_code: pharmacy.postal_code || prev.postal_code,
    region: pharmacy.region || prev.region,
    department: pharmacy.department || prev.department,
    latitude: pharmacy.latitude || prev.latitude,
    longitude: pharmacy.longitude || prev.longitude,
    // Informations pharmacie (pour sauvegarde)
    pharmacy_name: pharmacy.name,
    pharmacy_siret: pharmacy.siret,
    pharmacy_siret_verified: pharmacy.siret_verified,
  }));
  setShowPharmacySelector(false);
  Alert.alert(
    'Pharmacie sélectionnée',
    'Les informations de la pharmacie ont été pré-remplies.',
    [{ text: 'OK' }]
  );
};
```

**Avantages**:
- Gain de temps pour le titulaire
- Données cohérentes (pas d'erreur de saisie)
- Badge vérifié automatiquement lié

## ✅ Checklist d'implémentation

### Fonctionnalités principales
- [x] Hook `usePharmacyDetails` pour charger les pharmacies
- [x] Composant `PharmacySelectorModal` réutilisable
- [x] Bouton sélecteur dans `StepLocation`
- [x] Pré-remplissage des champs de localisation
- [x] Toggle mode discret dans `StepPreview`
- [x] Affichage du badge SIRET vérifié
- [x] Sauvegarde avec `pharmacy_id`, `pharmacy_name` (conditionnel), `discrete_mode`
- [x] Section pharmacies dans le profil

### Écrans
- [x] jobOfferCreate.jsx (Offres d'emploi)
- [x] internshipOfferCreate.jsx (Stages/Alternances)
- [ ] listingCreate.jsx (Petites annonces) - Non requis pour l'instant
- [x] profile.jsx (Aperçu des pharmacies)

### Design & UX
- [x] Modal avec animation slide-up
- [x] États de loading et empty state
- [x] Badge de vérification visible
- [x] SIRET formaté (XXX XXX XXX XXXXX)
- [x] Bouton "Changer" pour modifier la sélection
- [x] Preview compact de la pharmacie sélectionnée
- [x] Toggle Switch pour mode discret
- [x] Hint explicatif pour le mode discret

## 🚀 Évolutions futures possibles

1. **Multi-sélection**
   - Permettre de publier une offre pour plusieurs pharmacies d'un même titulaire
   - Cas d'usage: groupe de pharmacies

2. **Pharmacie par défaut**
   - Permettre au titulaire de définir une pharmacie par défaut
   - Auto-sélection lors de la création d'offres

3. **Import depuis API**
   - Importer automatiquement les pharmacies depuis l'API Sirene
   - Synchronisation périodique des données

4. **Historique des offres par pharmacie**
   - Tableau de bord par pharmacie
   - Statistiques de recrutement par établissement

5. **Notifications géolocalisées**
   - Alertes aux candidats près d'une pharmacie spécifique
   - Rayon de recherche personnalisé

## 📚 Références

- **Documentation SIRET**: [SIRET_VERIFICATION_SYSTEM.md](./SIRET_VERIFICATION_SYSTEM.md)
- **RGPD**: [RGPD_SIRET_UPDATES.md](./RGPD_SIRET_UPDATES.md)
- **Hook usePharmacyDetails**: [hooks/usePharmacyDetails.js](../hooks/usePharmacyDetails.js)
- **API Sirene**: https://entreprise.data.gouv.fr

## 📧 Support

Pour toute question sur ce système:
- **Documentation technique**: Ce fichier
- **Composant principal**: `PharmacySelectorModal`
- **Hook de données**: `usePharmacyDetails`
- **Exemples d'usage**: jobOfferCreate.jsx, internshipOfferCreate.jsx
