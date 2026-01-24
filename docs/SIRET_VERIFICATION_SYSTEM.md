# Système de vérification SIRET

## 📋 Vue d'ensemble

Le système de vérification SIRET permet aux animateurs et laboratoires de certifier leur statut professionnel via la table `verification_documents`, similaire au système RPPS.

## 🎯 Composants créés

### Services
1. **`siretVerificationService.js`** - Service de vérification SIRET via API INSEE
   - `submitVerification(userId, siretNumber)` - Soumet une vérification
   - `getVerificationStatus(userId)` - Récupère le statut
   - `deleteVerification(userId)` - Supprime une vérification
   - `isSiretAlreadyUsed(siretNumber, excludeUserId)` - Vérifie l'unicité

### Écrans
2. **`siretVerification.jsx`** - Page de vérification SIRET
   - Formulaire de soumission
   - Affichage du statut (approved/rejected/pending)
   - Interface similaire à rppsVerification.jsx

### Composants
3. **`SiretBadge.jsx`** - Badge "SIRET Vérifié"
   - Similaire à RppsBadge
   - Tailles: 'small' et 'normal'

## 💾 Structure de données

### Table: verification_documents

```sql
{
  user_id: uuid,
  verification_type: 'siret', -- ou 'rpps'
  document_reference: '12345678901234', -- Numéro SIRET
  status: 'approved' | 'rejected' | 'pending',
  verification_data: jsonb, -- Données INSEE
  rejection_reason: text,
  submitted_at: timestamp,
  verified_at: timestamp
}
```

Contrainte unique: `(user_id, verification_type)`

### Chargement dans AuthContext

```javascript
// Dans loadUserData()
const siretData = await supabase
  .from('verification_documents')
  .select('id, status')
  .eq('user_id', userId)
  .eq('verification_type', 'siret')
  .eq('status', 'approved')
  .maybeSingle();

const userWithVerifications = {
  ...userData,
  rpps_verified: !!rppsData,
  siret_verified: !!siretData, // ✅ Disponible dans user
};
```

## 🔗 Intégration

### 1. Profil Animateur ([editAnimatorProfile.jsx](../app/(screens)/editAnimatorProfile.jsx))

```javascript
import { siretVerificationService } from '../../services/siretVerificationService';

const [siretVerificationStatus, setSiretVerificationStatus] = useState(null);

// Charger le statut
useEffect(() => {
  loadSiretStatus();
}, []);

const loadSiretStatus = async () => {
  const status = await siretVerificationService.getVerificationStatus(session.user.id);
  setSiretVerificationStatus(status);
};

// Affichage dans le JSX
{siretVerificationStatus?.verified ? (
  <View style={styles.siretBadge}>
    <Icon name="checkCircle" size={20} color={theme.colors.success} />
    <Text>SIRET Vérifié</Text>
  </View>
) : (
  <Pressable onPress={() => router.push('/(screens)/siretVerification')}>
    <Text>Vérifier mon SIRET</Text>
  </Pressable>
)}
```

### 2. Cartes d'animateurs ([AnimatorCard.jsx](../components/animators/AnimatorCard.jsx))

```javascript
import SiretBadge from '../common/SiretBadge';

<View style={commonStyles.rowGapSmall}>
  <Text style={styles.name}>{fullName}</Text>
  <SiretBadge verified={animator.siret_verified} size="small" />
</View>
```

### 3. Profil utilisateur ([profile.jsx](../app/(tabs)/profile.jsx))

```javascript
import SiretBadge from '../../components/common/SiretBadge';

<View style={[commonStyles.row, { gap: wp(2) }]}>
  <Text style={styles.name}>{profile?.first_name} {profile?.last_name}</Text>
  {user?.rpps_verified && <RppsBadge verified={true} size="small" />}
  {user?.siret_verified && <SiretBadge verified={true} size="small" />}
</View>
```

## 🔍 Vérification API INSEE

### Production (DEMO_MODE = false)

```javascript
const response = await fetch(
  `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${cleanSiret}`
);

// Retourne:
{
  verified: true,
  message: 'SIRET vérifié avec succès',
  data: {
    siret: '12345678901234',
    name: 'NOM DE L\'ENTREPRISE',
    activity: 'Fabrication de produits pharmaceutiques',
    address: 'Adresse complète',
    active: true,
    naf_code: '2120Z',
    source: 'insee'
  }
}
```

### Mode démo (DEMO_MODE = true)

Utilise `DEMO_SIRET_DATA` pour tester sans appels API.

## ⚙️ Configuration

### Activer/désactiver le mode démo

Dans `services/siretVerificationService.js`:

```javascript
const DEMO_MODE = false; // true pour mode démo
```

## 📊 Flux utilisateur

### Animateur

1. Va sur "Mon profil animateur"
2. Section "Vérification professionnelle"
3. Clique sur "Vérifier mon SIRET"
4. Entre son numéro SIRET (14 chiffres)
5. Soumission → Appel API INSEE
6. Si succès → Badge vert "SIRET Vérifié" affiché partout
7. Si échec → Message d'erreur + option de réessayer

### Laboratoire

Même flux, avec texte adapté ("Labo Vérifié").

## 🚨 Important

### Différences avec l'ancienne implémentation

**AVANT** (incorrect):
- SIRET stocké directement dans `animator_profiles.siret_number`
- Pas de vérification centralisée
- Badge affiché dès qu'un SIRET existe (non vérifié)

**MAINTENANT** (correct):
- SIRET vérifié via `verification_documents`
- Vérification centralisée avec API INSEE
- Badge affiché uniquement si `status = 'approved'`
- Traçabilité complète (date de soumission, vérification, raison de rejet)

### Migration nécessaire

Si des SIRET existent déjà dans `animator_profiles.siret_number` ou `laboratory_profiles.siret`:
1. Ces champs peuvent rester pour référence
2. Mais le badge s'affichera uniquement après vérification via le nouveau système
3. Les utilisateurs devront soumettre leur SIRET via l'écran de vérification

## 🔐 Sécurité

- Un SIRET ne peut être utilisé que par un seul compte (vérifié par `isSiretAlreadyUsed`)
- Les numéros SIRET sont normalisés (espaces supprimés)
- Validation du format (exactement 14 chiffres)
- Vérification de l'état administratif de l'établissement

## 📝 TODO Futur (optionnel)

- [ ] Notification email lors de la vérification
- [ ] Renouvellement automatique annuel
- [ ] Webhook pour mise à jour si SIRET devient inactif
- [ ] Statistiques admin sur les vérifications
- [ ] Export RGPD incluant les données de vérification

## 🔗 Fichiers modifiés

### Créés
- `services/siretVerificationService.js`
- `app/(screens)/siretVerification.jsx`
- `components/common/SiretBadge.jsx`

### Modifiés
- `app/(screens)/editAnimatorProfile.jsx`
- `components/animators/AnimatorCard.jsx`
- `app/(tabs)/profile.jsx`
- `contexts/AuthContext.jsx`

## 📚 Références

- API Sirene: https://entreprise.data.gouv.fr/api/sirene
- Documentation RPPS (pattern similaire): `services/rppsService.js`
- Système de vérification: `verification_documents` table
