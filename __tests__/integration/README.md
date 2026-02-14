# Tests d'intégration - Onboarding

Ces tests vérifient l'inscription et la création de profil pour tous les types d'utilisateurs de PharmaLink.

## Types d'utilisateurs testés

### Candidats (table: `profiles`)
- ✅ **Préparateur** - Professionnel en officine
- ✅ **Conseiller** - Conseiller en parapharmacie
- ✅ **Étudiant** - En formation pharmaceutique (avec `school` et `study_level`)
- ✅ **Titulaire** - Pharmacien propriétaire

### Freelance (table: `animator_profiles`)
- ✅ **Animateur** - Animation et formation en pharmacie

### Business (table: `laboratory_profiles`)
- ✅ **Laboratoire** - Entreprise pharmaceutique B2B

## Configuration requise

### 1. Variables d'environnement

Ces tests nécessitent une clé **service_role** pour accéder à l'API admin de Supabase. Créez un fichier `.env.test` à la racine du projet:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Important**: Ne commitez JAMAIS la clé `service_role` dans Git!

### 2. Base de données de test

Il est recommandé d'utiliser une base de données Supabase séparée pour les tests:

1. Créez un nouveau projet Supabase pour les tests
2. Appliquez toutes les migrations (incluant `add_school_column.sql`)
3. Configurez `.env.test` avec les credentials du projet de test

## Exécution des tests

### Tous les tests d'intégration
```bash
npm test -- __tests__/integration/
```

### Tests des candidats uniquement
```bash
npm test -- __tests__/integration/onboarding.test.js
```

### Tests des animateurs et laboratoires uniquement
```bash
npm test -- __tests__/integration/onboarding-animator-lab.test.js
```

### Mode watch
```bash
npm run test:watch -- __tests__/integration/
```

## Ce que les tests vérifient

### Pour chaque type d'utilisateur

1. ✅ **Inscription réussie**
   - Création du compte auth avec email/password
   - Validation du format email
   - Validation mot de passe (min 6 caractères)

2. ✅ **Création du profil**
   - Insertion dans la bonne table (profiles, animator_profiles, laboratory_profiles)
   - Tous les champs requis sont présents
   - Les données sont correctement sauvegardées

3. ✅ **Champs spécifiques**
   - **Étudiant**: `school` et `study_level` sont bien enregistrés
   - **Animateur**: `daily_rate`, `intervention_radius_km`, `available_days`
   - **Laboratoire**: `company_name`, `siret`, champs de contact

4. ✅ **Validation des contraintes**
   - Champs NOT NULL requis
   - Formats de données (ex: SIRET 14 chiffres)
   - Valeurs par défaut

### Cas d'erreur testés

- ❌ Profil sans prénom (first_name)
- ❌ Profil sans nom (last_name)
- ❌ Laboratoire sans nom d'entreprise (company_name)
- ❌ Laboratoire sans SIRET
- ✅ Champs optionnels null acceptés (ex: `daily_rate` pour animateur)

## Nettoyage

Les tests nettoient automatiquement les données créées:
- `beforeEach`: Supprime les utilisateurs de test avant chaque test
- `afterAll`: Supprime les utilisateurs de test après tous les tests

Si un test échoue et laisse des données orphelines, vous pouvez les nettoyer manuellement via le dashboard Supabase → Authentication → Users.

## Résolution de problèmes

### Erreur: "Could not find the 'school' column"

➡️ Appliquez la migration:
```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor du dashboard
# Exécutez le contenu de supabase/migrations/add_school_column.sql
```

### Erreur: "duplicate key value violates unique constraint 'user_pkey'"

➡️ Un utilisateur de test existe déjà. Supprimez-le:
1. Dashboard Supabase → Authentication → Users
2. Cherchez l'email de test
3. Supprimer l'utilisateur

### Erreur: "Service role key required"

➡️ Configurez `.env.test` avec la clé service_role de votre projet Supabase de test.

## Ajout de nouveaux tests

Pour ajouter des tests pour un nouveau type d'utilisateur:

1. Ajoutez le type dans `onboarding/index.jsx` (ROLES array)
2. Créez le formulaire d'onboarding approprié
3. Ajoutez les tests dans le fichier correspondant
4. Mettez à jour cette documentation

## Couverture de tests

```bash
# Générer un rapport de couverture
npm test -- --coverage __tests__/integration/
```

## CI/CD

Pour exécuter ces tests en CI/CD:

1. Créez un projet Supabase dédié aux tests
2. Ajoutez les secrets dans votre CI (GitHub Actions, GitLab CI, etc.):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Exécutez les tests dans le pipeline

Exemple GitHub Actions:
```yaml
- name: Run integration tests
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_SERVICE_KEY }}
  run: npm test -- __tests__/integration/
```
