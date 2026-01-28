# Pharmalink Admin Panel - Documentation API

**Date** : 28 janvier 2026
**Backend** : Supabase (PostgreSQL + Auth + Storage + Realtime)
**Projet Supabase** : Même instance que l'app mobile

---

## Connexion Supabase

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'VOTRE_SUPABASE_URL',
  'VOTRE_SUPABASE_ANON_KEY' // ou service_role_key pour bypass RLS
)
```

> **Note** : Pour l'admin panel, utiliser `service_role_key` permet de bypass les RLS et accéder à toutes les données. À sécuriser côté serveur uniquement.

---

## Types d'utilisateurs

| Type | Description |
|------|-------------|
| `preparateur` | Préparateur en pharmacie (candidat) |
| `titulaire` | Pharmacien titulaire (employeur) |
| `etudiant` | Étudiant en pharmacie (candidat) |
| `animateur` | Animateur commercial (freelance) |
| `laboratoire` | Laboratoire pharmaceutique (employeur missions) |
| `conseiller` | Conseiller (rôle spécial) |

---

## Tables principales

### 1. `profiles` - Profils utilisateurs

```sql
profiles (
  id UUID PRIMARY KEY, -- = auth.users.id
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  nickname TEXT,
  bio TEXT,
  phone TEXT,

  -- Localisation
  current_city TEXT,
  current_region TEXT,
  current_latitude FLOAT,
  current_longitude FLOAT,
  search_radius INT, -- km

  -- Professionnel
  specializations TEXT[], -- array
  years_experience INT,
  current_employer TEXT,

  -- Préférences
  contract_types TEXT[], -- ['CDI', 'CDD', 'Interim', ...]
  availability TEXT, -- 'immediate', '1_month', '3_months', 'not_looking'
  open_to_relocation BOOLEAN,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Jointure utilisateur** :
```javascript
const { data } = await supabase
  .from('profiles')
  .select('*, users:auth.users(email, user_type, created_at)')
```

### 2. `users` (auth.users metadata)

Les métadonnées utilisateur sont dans `auth.users.raw_user_meta_data` :
- `user_type` : type d'utilisateur (voir ci-dessus)
- `onboarding_completed` : boolean

```javascript
// Récupérer avec le client admin
const { data } = await supabase.auth.admin.listUsers()
```

### 3. `user_reports` - Signalements

```sql
user_reports (
  id UUID PRIMARY KEY,

  -- Qui signale
  reporter_id UUID REFERENCES auth.users(id),

  -- Qui/quoi est signalé
  reported_user_id UUID REFERENCES auth.users(id),
  reported_content_type TEXT, -- voir CONTENT_TYPES
  reported_content_id UUID,

  -- Détails
  reason TEXT NOT NULL, -- voir REPORT_REASONS
  description TEXT,

  -- Modération
  status TEXT DEFAULT 'pending', -- voir REPORT_STATUS
  resolution TEXT, -- voir RESOLUTIONS
  resolution_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Constantes** :
```javascript
const REPORT_REASONS = {
  spam: 'Spam ou publicité',
  harassment: 'Harcèlement ou intimidation',
  inappropriate: 'Contenu inapproprié',
  fake_profile: 'Faux profil ou usurpation',
  scam: 'Arnaque ou fraude',
  other: 'Autre raison'
}

const REPORT_STATUS = {
  pending: 'En attente',
  reviewing: 'En cours d\'examen',
  resolved: 'Résolu',
  dismissed: 'Rejeté'
}

const RESOLUTIONS = {
  warning_sent: 'Avertissement envoyé',
  content_removed: 'Contenu supprimé',
  user_suspended: 'Utilisateur suspendu',
  user_banned: 'Utilisateur banni',
  no_action: 'Aucune action'
}

const CONTENT_TYPES = {
  profile: 'Profil',
  job_offer: 'Offre d\'emploi',
  internship_offer: 'Offre de stage',
  mission: 'Mission d\'animation',
  message: 'Message',
  laboratory_post: 'Publication laboratoire',
  cv: 'CV',
  urgent_alert: 'Alerte urgente',
  pharmacy_listing: 'Annonce pharmacie'
}
```

**Requêtes utiles** :
```javascript
// Liste des signalements avec profils
const { data } = await supabase
  .from('user_reports')
  .select(`
    *,
    reporter:profiles!reporter_id(first_name, last_name, photo_url),
    reported_user:profiles!reported_user_id(first_name, last_name, photo_url)
  `)
  .order('created_at', { ascending: false })

// Filtrer par statut
  .eq('status', 'pending')

// Mettre à jour un signalement
const { data } = await supabase
  .from('user_reports')
  .update({
    status: 'resolved',
    resolution: 'warning_sent',
    resolution_notes: 'Premier avertissement envoyé',
    reviewed_by: adminUserId,
    reviewed_at: new Date().toISOString()
  })
  .eq('id', reportId)
```

### 4. `user_blocks` - Blocages

```sql
user_blocks (
  id UUID PRIMARY KEY,
  blocker_id UUID REFERENCES auth.users(id),
  blocked_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ
)
```

```javascript
// Liste des blocages
const { data } = await supabase
  .from('user_blocks')
  .select(`
    *,
    blocker:profiles!blocker_id(first_name, last_name),
    blocked:profiles!blocked_id(first_name, last_name)
  `)
```

### 5. `job_offers` - Offres d'emploi

```sql
job_offers (
  id UUID PRIMARY KEY,
  pharmacy_owner_id UUID, -- créateur

  -- Infos offre
  title TEXT,
  description TEXT,
  position_type TEXT, -- 'preparateur', 'pharmacien', etc.
  contract_type TEXT, -- 'CDI', 'CDD', 'Interim'

  -- Localisation
  city TEXT,
  region TEXT,
  latitude FLOAT,
  longitude FLOAT,

  -- Salaire
  salary_min INT,
  salary_max INT,
  salary_type TEXT, -- 'monthly', 'hourly', 'annual'

  -- Pharmacie
  pharmacy_id UUID,
  pharmacy_name TEXT,
  pharmacy_siret TEXT,

  -- Statut
  status TEXT, -- 'draft', 'active', 'paused', 'closed', 'filled'
  discrete_mode BOOLEAN, -- masquer nom pharmacie

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
```

### 6. `internship_offers` - Offres de stage

```sql
internship_offers (
  id UUID PRIMARY KEY,
  pharmacy_owner_id UUID,

  title TEXT,
  description TEXT,
  type TEXT, -- '6eme_annee', '5eme_annee', 'officinal', etc.
  duration_weeks INT,

  city TEXT,
  region TEXT,

  pharmacy_id UUID,
  pharmacy_name TEXT,

  status TEXT, -- 'draft', 'active', 'paused', 'closed', 'filled'

  start_date DATE,
  created_at TIMESTAMPTZ
)
```

### 7. `animation_missions` - Missions d'animation

```sql
animation_missions (
  id UUID PRIMARY KEY,

  -- Client (labo ou pharmacie)
  client_id UUID,
  client_type TEXT, -- 'laboratory', 'pharmacy'

  -- Animateur assigné
  animator_id UUID,

  -- Détails
  title TEXT,
  description TEXT,
  mission_type TEXT, -- 'sell_in', 'sell_out', 'formation', 'merchandising'
  specialties_required TEXT[],

  -- Lieu
  pharmacy_name TEXT,
  city TEXT,
  region TEXT,
  address TEXT,

  -- Dates
  start_date DATE,
  end_date DATE,

  -- Tarif
  daily_rate_min INT,
  daily_rate_max INT,

  -- Statut
  status TEXT, -- 'draft', 'open', 'proposed', 'confirmed', 'in_progress', 'completed', 'cancelled'

  created_at TIMESTAMPTZ
)
```

### 8. `animator_profiles` - Profils animateurs

```sql
animator_profiles (
  id UUID PRIMARY KEY, -- = auth.users.id

  animation_specialties TEXT[], -- ['dermocosmétique', 'nutrition', ...]
  mobility_zones TEXT[], -- régions
  has_vehicle BOOLEAN,

  daily_rate_min INT,
  daily_rate_max INT,

  available_now BOOLEAN,

  -- Stats
  missions_completed INT,
  average_rating FLOAT,

  created_at TIMESTAMPTZ
)
```

### 9. `laboratory_profiles` - Profils laboratoires

```sql
laboratory_profiles (
  id UUID PRIMARY KEY, -- = auth.users.id

  company_name TEXT,
  brand_name TEXT,
  logo_url TEXT,

  description TEXT,
  website TEXT,

  product_categories TEXT[],

  siret TEXT,
  siret_verified BOOLEAN,

  created_at TIMESTAMPTZ
)
```

### 10. `laboratory_posts` - Publications laboratoires

```sql
laboratory_posts (
  id UUID PRIMARY KEY,
  laboratory_id UUID,

  title TEXT,
  content TEXT,
  image_url TEXT,

  post_type TEXT, -- 'news', 'product', 'event', 'job'

  status TEXT, -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,

  likes_count INT,
  comments_count INT,

  created_at TIMESTAMPTZ
)
```

### 11. `urgent_alerts` - Alertes urgentes

```sql
urgent_alerts (
  id UUID PRIMARY KEY,
  pharmacy_owner_id UUID,

  title TEXT,
  description TEXT,

  -- Localisation
  city TEXT,
  region TEXT,
  latitude FLOAT,
  longitude FLOAT,
  radius_km INT, -- rayon de diffusion

  -- Horaires
  date DATE,
  start_time TIME,
  end_time TIME,

  -- Rémunération
  hourly_rate INT,

  status TEXT, -- 'active', 'filled', 'cancelled', 'expired'

  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
```

### 12. `pharmacy_listings` - Annonces marketplace

```sql
pharmacy_listings (
  id UUID PRIMARY KEY,
  owner_id UUID,

  title TEXT,
  description TEXT,

  listing_type TEXT, -- 'sale', 'transfer', 'association', 'rental'
  price INT,
  price_type TEXT, -- 'fixed', 'negotiable', 'on_request'

  -- Localisation
  city TEXT,
  region TEXT,
  department TEXT,

  -- Caractéristiques
  surface_m2 INT,
  annual_revenue INT,
  staff_count INT,

  status TEXT, -- 'draft', 'active', 'sold', 'expired'

  images TEXT[], -- URLs

  created_at TIMESTAMPTZ
)
```

### 13. `subscriptions` - Abonnements

```sql
subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID,

  tier TEXT, -- 'free', 'starter', 'pro', 'business', 'premium'

  status TEXT, -- 'active', 'cancelled', 'expired', 'past_due'

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Stripe (à implémenter)
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,

  created_at TIMESTAMPTZ
)
```

---

## Plans d'abonnement par type d'utilisateur

### Laboratoires (`laboratoire`)

| Plan | Prix/mois | Missions | Contacts/mois | Favoris | Super Likes/mois |
|------|-----------|----------|---------------|---------|------------------|
| **free** | 0€ | 1 | 5 | 10 | 2 |
| **starter** | 49€ | 5 | 30 | 50 | 10 |
| **pro** | 149€ | 15 | 100 | 200 | 30 |
| **business** | 299€ | ∞ | ∞ | ∞ | ∞ |

**Fonctionnalités incluses :**
- `missions` : Nombre de missions d'animation actives simultanément
- `contacts` : Contacts initiés avec animateurs par mois
- `favorites` : Animateurs enregistrés en favoris
- `superLikes` : Super likes pour les animateurs par mois

```javascript
const SUBSCRIPTION_TIERS_LABORATORY = {
  free: { price: 0, missions: 1, contacts: 5, favorites: 10, superLikes: 2 },
  starter: { price: 49, missions: 5, contacts: 30, favorites: 50, superLikes: 10 },
  pro: { price: 149, missions: 15, contacts: 100, favorites: 200, superLikes: 30 },
  business: { price: 299, missions: Infinity, contacts: Infinity, favorites: Infinity, superLikes: Infinity }
}
```

---

### Titulaires de pharmacie (`titulaire`)

| Plan | Prix/mois | Offres emploi | Stages | Alertes/mois | Missions animateurs |
|------|-----------|---------------|--------|--------------|---------------------|
| **free** | 0€ | 1 | 1 | 2 | 0 |
| **pro** | 29€ | 5 | 5 | 10 | 2 |
| **business** | 59€ | ∞ | ∞ | ∞ | ∞ |

**Fonctionnalités incluses :**
- `offers` : Nombre d'offres d'emploi actives
- `internships` : Nombre d'offres de stage actives
- `alerts` : Alertes urgentes par mois
- `animatorMissions` : Missions pour animateurs commerciaux

```javascript
const SUBSCRIPTION_TIERS_TITULAIRE = {
  free: { price: 0, offers: 1, internships: 1, alerts: 2, animatorMissions: 0 },
  pro: { price: 29, offers: 5, internships: 5, alerts: 10, animatorMissions: 2 },
  business: { price: 59, offers: Infinity, internships: Infinity, alerts: Infinity, animatorMissions: Infinity }
}
```

---

### Candidats - Préparateurs & Pharmaciens (`preparateur`)

| Plan | Prix/mois | CV | Super Likes/mois |
|------|-----------|----|--------------------|
| **free** | 0€ | 1 | 3 |
| **premium** | 19€ | 3 | 15 |

**Fonctionnalités incluses :**
- `cvCount` : Nombre de CV différents (adaptés à différents postes)
- `superLikes` : Super likes pour les offres par mois

```javascript
const SUBSCRIPTION_TIERS_CANDIDAT = {
  free: { price: 0, cvCount: 1, superLikes: 3 },
  premium: { price: 19, cvCount: 3, superLikes: 15 }
}
```

---

### Animateurs commerciaux (`animateur`)

| Plan | Prix/mois | CV | Super Likes/mois |
|------|-----------|----|--------------------|
| **free** | 0€ | 1 | 3 |
| **premium** | 19€ | 3 | 15 |

**Fonctionnalités incluses :**
- `cvCount` : Nombre de CV/profils différents
- `superLikes` : Super likes pour les missions par mois

```javascript
const SUBSCRIPTION_TIERS_ANIMATEUR = {
  free: { price: 0, cvCount: 1, superLikes: 3 },
  premium: { price: 19, cvCount: 3, superLikes: 15 }
}
```

---

### Étudiants en pharmacie (`etudiant`)

| Plan | Prix/mois | CV | Super Likes/mois |
|------|-----------|----|--------------------|
| **free** | 0€ | 1 | 3 |
| **premium** | 5€ | 2 | 10 |

**Fonctionnalités incluses :**
- `cvCount` : Nombre de CV différents
- `superLikes` : Super likes pour les stages par mois

```javascript
const SUBSCRIPTION_TIERS_ETUDIANT = {
  free: { price: 0, cvCount: 1, superLikes: 3 },
  premium: { price: 5, cvCount: 2, superLikes: 10 }
}
```

---

### Récapitulatif des tiers par user_type

| user_type | Tiers disponibles |
|-----------|-------------------|
| `laboratoire` | free, starter, pro, business |
| `titulaire` | free, pro, business |
| `preparateur` | free, premium |
| `animateur` | free, premium |
| `etudiant` | free, premium |
| `conseiller` | free (pas de plans payants) |

---

### Requêtes admin pour les abonnements

```javascript
// Statistiques abonnements par tier et user_type
const { data } = await supabase
  .from('subscriptions')
  .select(`
    tier,
    profiles!inner(id),
    users:auth.users(raw_user_meta_data)
  `)
  .eq('status', 'active')

// Revenus mensuels estimés
const calculateMonthlyRevenue = (subscriptions) => {
  const prices = {
    laboratoire: { free: 0, starter: 49, pro: 149, business: 299 },
    titulaire: { free: 0, pro: 29, business: 59 },
    preparateur: { free: 0, premium: 19 },
    animateur: { free: 0, premium: 19 },
    etudiant: { free: 0, premium: 5 }
  }
  // Calculer selon user_type et tier...
}

// Utilisateurs par plan
const { data, count } = await supabase
  .from('subscriptions')
  .select('*', { count: 'exact' })
  .eq('tier', 'pro')
  .eq('status', 'active')

// Abonnements expirant bientôt
const { data } = await supabase
  .from('subscriptions')
  .select('*, profiles(*)')
  .lte('current_period_end', oneWeekFromNow)
  .eq('status', 'active')

// Mettre à jour manuellement un abonnement (upgrade/downgrade)
await supabase
  .from('subscriptions')
  .update({
    tier: 'pro',
    current_period_start: new Date().toISOString(),
    current_period_end: addMonths(new Date(), 1).toISOString()
  })
  .eq('user_id', userId)
```

---

### Vérification des limites (côté app)

```javascript
// Récupérer les limites actuelles d'un utilisateur
export const getUserLimits = async (userId, userType) => {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  const tier = subscription?.tier || 'free'
  const tierConfig = getTierConfigByUserType(userType)

  return tierConfig[tier]
}

// Vérifier si une action est autorisée
export const canPerformAction = async (userId, userType, action, currentCount) => {
  const limits = await getUserLimits(userId, userType)
  return currentCount < limits[action]
}
```

### 14. `matches` - Matchs candidat/offre

```sql
matches (
  id UUID PRIMARY KEY,

  candidate_id UUID,
  offer_id UUID,
  offer_type TEXT, -- 'job_offer', 'internship_offer'

  status TEXT, -- 'pending', 'matched', 'unmatched'

  -- Super likes
  candidate_super_liked BOOLEAN,
  employer_super_liked BOOLEAN,

  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

### 15. `messages` - Messages

```sql
messages (
  id UUID PRIMARY KEY,
  match_id UUID,
  sender_id UUID,

  content TEXT,
  attachments JSONB, -- [{url, type, name}]

  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
)
```

### 16. `cvs` - CV

```sql
cvs (
  id UUID PRIMARY KEY,
  user_id UUID,

  title TEXT,
  cv_type TEXT, -- 'structured', 'pdf'

  -- Si PDF
  file_url TEXT,

  -- Si structuré
  experiences JSONB,
  formations JSONB,
  skills TEXT[],
  languages JSONB,

  is_default BOOLEAN,
  show_on_card BOOLEAN, -- afficher sur carte de swipe

  created_at TIMESTAMPTZ
)
```

### 17. `pharmacy_details` - Détails pharmacies

```sql
pharmacy_details (
  id UUID PRIMARY KEY,
  owner_id UUID,

  name TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,

  siret TEXT,
  siret_verified BOOLEAN,
  siret_verified_at TIMESTAMPTZ,

  phone TEXT,
  email TEXT,

  created_at TIMESTAMPTZ
)
```

### 18. `notifications` - Notifications in-app

```sql
notifications (
  id UUID PRIMARY KEY,
  user_id UUID,

  type TEXT, -- 'match', 'message', 'application', 'alert', etc.
  title TEXT,
  body TEXT,
  data JSONB, -- données supplémentaires

  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
)
```

---

## Fonctions RPC Supabase

```javascript
// Vérifier si deux utilisateurs sont bloqués
const { data } = await supabase.rpc('are_users_blocked', {
  user_a: userId1,
  user_b: userId2
}) // → boolean

// Liste des IDs bloqués (dans les deux sens)
const { data } = await supabase.rpc('get_blocked_user_ids', {
  user_id: userId
}) // → UUID[]
```

---

## Vue SQL disponible

```javascript
// Stats des signalements par jour/statut/raison
const { data } = await supabase
  .from('report_stats')
  .select('*')
// → { status, reason, count, report_date }
```

---

## Actions admin typiques

### Suspendre un utilisateur

```javascript
// 1. Mettre à jour les métadonnées auth
await supabase.auth.admin.updateUserById(userId, {
  user_metadata: { suspended: true, suspended_at: new Date().toISOString() }
})

// 2. Optionnel : désactiver ses offres
await supabase
  .from('job_offers')
  .update({ status: 'paused' })
  .eq('pharmacy_owner_id', userId)
```

### Bannir un utilisateur

```javascript
// Désactiver le compte
await supabase.auth.admin.updateUserById(userId, {
  ban_duration: 'none' // ou '24h', '7d', etc. pour temporaire
})

// Pour ban permanent
await supabase.auth.admin.deleteUser(userId)
```

### Supprimer du contenu

```javascript
// Supprimer une offre
await supabase.from('job_offers').delete().eq('id', offerId)

// Supprimer un post labo
await supabase.from('laboratory_posts').delete().eq('id', postId)

// Supprimer un message
await supabase.from('messages').delete().eq('id', messageId)
```

### Statistiques dashboard

```javascript
// Nouveaux utilisateurs ce mois
const { count } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })
  .gte('created_at', startOfMonth)

// Signalements en attente
const { count: pendingReports } = await supabase
  .from('user_reports')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending')

// Offres actives
const { count: activeOffers } = await supabase
  .from('job_offers')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'active')

// Matchs cette semaine
const { count: weeklyMatches } = await supabase
  .from('matches')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'matched')
  .gte('matched_at', oneWeekAgo)
```

---

## Policies RLS à ajouter pour admin

```sql
-- Créer une fonction pour vérifier si admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy pour voir tous les signalements
CREATE POLICY "Admins can view all reports"
  ON user_reports FOR SELECT
  USING (is_admin(auth.uid()));

-- Policy pour modifier les signalements
CREATE POLICY "Admins can update reports"
  ON user_reports FOR UPDATE
  USING (is_admin(auth.uid()));

-- Policy pour voir tous les profils
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin(auth.uid()));

-- Policy pour modifier les profils
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (is_admin(auth.uid()));

-- Répéter pour les autres tables selon besoins...
```

---

## Modules admin recommandés

1. **Dashboard** - KPIs, graphiques, alertes
2. **Utilisateurs** - Liste, recherche, détail, suspension/ban
3. **Signalements** - File d'attente, traitement, historique
4. **Offres** - Modération, statistiques
5. **Missions** - Suivi animations, litiges
6. **Abonnements** - Gestion, revenus (quand Stripe intégré)
7. **Contenu** - Posts labo, alertes, marketplace
8. **Logs** - Audit trail des actions admin

---

## Storage Supabase

Buckets existants :
- `avatars` - Photos de profil
- `cvs` - Fichiers PDF des CV
- `listings` - Images annonces marketplace
- `laboratory` - Logos et images des labos
- `missions` - Documents missions

```javascript
// Supprimer un fichier
await supabase.storage.from('avatars').remove([filePath])

// Lister les fichiers d'un user
const { data } = await supabase.storage.from('cvs').list(userId)
```

---

## Notes techniques

- **Timezone** : Toutes les dates sont en UTC (TIMESTAMPTZ)
- **Soft delete** : Non implémenté, les suppressions sont définitives
- **Realtime** : Activé sur `messages`, `notifications`, `matches`
- **RLS** : Activé sur toutes les tables, utiliser service_role_key pour bypass
