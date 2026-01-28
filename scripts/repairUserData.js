/**
 * Script de réparation des données utilisateurs
 * Pharma Link
 *
 * Ce script vérifie et répare les incohérences entre:
 * - auth.users
 * - public.users
 * - profiles
 * - laboratory_profiles (pour les labos)
 * - animator_profiles (pour les animateurs)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Emails admin à exclure de la réparation automatique
const ADMIN_EMAILS = [
  'ilariapace06@gmail.com',
  // Ajouter d'autres emails admin ici
];

// Villes par défaut pour les labos de démo
const LAB_CITIES = {
  'orthomed': { city: 'Lyon', postal_code: '69001', region: 'Auvergne-Rhône-Alpes', department: 'Rhône' },
  'aromasante': { city: 'Grasse', postal_code: '06130', region: "Provence-Alpes-Côte d'Azur", department: 'Alpes-Maritimes' },
  'dermacare': { city: 'Lyon', postal_code: '69002', region: 'Auvergne-Rhône-Alpes', department: 'Rhône' },
  'biopharma': { city: 'Paris', postal_code: '75008', region: 'Île-de-France', department: 'Paris' },
  'nutrivie': { city: 'Bordeaux', postal_code: '33000', region: 'Nouvelle-Aquitaine', department: 'Gironde' },
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables manquantes dans .env !');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function repair() {
  console.log('🔧 Réparation des données utilisateurs - Pharma Link\n');

  // 1. Récupérer tous les utilisateurs auth
  console.log('📋 Récupération des utilisateurs auth...');
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Erreur récupération auth users:', authError.message);
    return;
  }
  console.log(`   ${authUsers.length} utilisateurs auth trouvés\n`);

  // 2. Récupérer les données des tables
  const [usersData, profilesData, labProfilesData, animatorProfilesData] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('profiles').select('*'),
    supabase.from('laboratory_profiles').select('*'),
    supabase.from('animator_profiles').select('*'),
  ]);

  const usersMap = new Map((usersData.data || []).map(u => [u.id, u]));
  const profilesMap = new Map((profilesData.data || []).map(p => [p.id, p]));
  const labProfilesMap = new Map((labProfilesData.data || []).map(l => [l.id, l]));
  const animatorProfilesMap = new Map((animatorProfilesData.data || []).map(a => [a.id, a]));

  console.log(`📊 État actuel:`);
  console.log(`   - users: ${usersMap.size}`);
  console.log(`   - profiles: ${profilesMap.size}`);
  console.log(`   - laboratory_profiles: ${labProfilesMap.size}`);
  console.log(`   - animator_profiles: ${animatorProfilesMap.size}\n`);

  // 3. Analyser et réparer
  const issues = {
    missingUsers: [],
    missingProfiles: [],
    missingFirstName: [],
    labMissingCity: [],
    labMissingLabProfile: [],
    animatorMissingAnimatorProfile: [],
  };

  for (const authUser of authUsers) {
    const userId = authUser.id;
    const email = authUser.email;

    // Ignorer les comptes admin
    if (ADMIN_EMAILS.includes(email)) {
      console.log(`   ⏭️  ${email} (admin, ignoré)`);
      continue;
    }

    const publicUser = usersMap.get(userId);
    const profile = profilesMap.get(userId);

    // Vérifier public.users
    if (!publicUser) {
      issues.missingUsers.push({ userId, email });
    }

    // Vérifier profiles
    if (!profile) {
      issues.missingProfiles.push({ userId, email, userType: publicUser?.user_type });
    } else if (!profile.first_name) {
      issues.missingFirstName.push({ userId, email, userType: publicUser?.user_type });
    }

    // Vérifier profils spécifiques
    if (publicUser?.user_type === 'laboratoire') {
      if (!labProfilesMap.has(userId)) {
        issues.labMissingLabProfile.push({ userId, email });
      }
      // Vérifier si le profil labo a une ville
      if (profile && !profile.current_city) {
        issues.labMissingCity.push({ userId, email });
      }
    }
    if (publicUser?.user_type === 'animateur' && !animatorProfilesMap.has(userId)) {
      issues.animatorMissingAnimatorProfile.push({ userId, email });
    }
  }

  // Afficher les problèmes
  console.log('🔍 Problèmes détectés:');
  console.log(`   - Entrées manquantes dans users: ${issues.missingUsers.length}`);
  console.log(`   - Entrées manquantes dans profiles: ${issues.missingProfiles.length}`);
  console.log(`   - Profils sans first_name: ${issues.missingFirstName.length}`);
  console.log(`   - Labos sans ville: ${issues.labMissingCity.length}`);
  console.log(`   - Labos sans laboratory_profiles: ${issues.labMissingLabProfile.length}`);
  console.log(`   - Animateurs sans animator_profiles: ${issues.animatorMissingAnimatorProfile.length}\n`);

  // 4. Réparer les problèmes
  let repaired = 0;

  // Réparer users manquants
  if (issues.missingUsers.length > 0) {
    console.log('🔧 Réparation des entrées users manquantes...');
    for (const { userId, email } of issues.missingUsers) {
      const { error } = await supabase.from('users').insert({
        id: userId,
        email: email,
        user_type: 'preparateur', // Défaut, sera corrigé si info disponible
        profile_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error && !error.message.includes('duplicate')) {
        console.log(`   ❌ ${email}: ${error.message}`);
      } else {
        console.log(`   ✓ ${email}`);
        repaired++;
      }
    }
  }

  // Réparer profiles manquants
  if (issues.missingProfiles.length > 0) {
    console.log('🔧 Réparation des entrées profiles manquantes...');
    for (const { userId, email, userType } of issues.missingProfiles) {
      // Pour les labos, utiliser un nom par défaut basé sur l'email
      let firstName = 'Utilisateur';
      let lastName = '';
      let cityData = {};

      if (userType === 'laboratoire') {
        // Extraire le nom du labo de l'email si possible
        const match = email.match(/demo\.labo\.(\w+)@/);
        if (match) {
          const labKey = match[1].toLowerCase();
          firstName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
          lastName = 'Labs';

          // Ajouter les données de ville si disponibles
          if (LAB_CITIES[labKey]) {
            cityData = {
              current_city: LAB_CITIES[labKey].city,
              current_postal_code: LAB_CITIES[labKey].postal_code,
              current_region: LAB_CITIES[labKey].region,
              current_department: LAB_CITIES[labKey].department,
            };
          }
        }
      }

      const { error } = await supabase.from('profiles').insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        ...cityData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error && !error.message.includes('duplicate')) {
        console.log(`   ❌ ${email}: ${error.message}`);
      } else {
        const cityInfo = cityData.current_city ? ` - ${cityData.current_city}` : '';
        console.log(`   ✓ ${email} (${firstName} ${lastName}${cityInfo})`);
        repaired++;
      }
    }
  }

  // Réparer first_name manquant
  if (issues.missingFirstName.length > 0) {
    console.log('🔧 Réparation des first_name manquants...');
    for (const { userId, email, userType } of issues.missingFirstName) {
      let firstName = 'Utilisateur';

      if (userType === 'laboratoire') {
        const match = email.match(/demo\.labo\.(\w+)@/);
        if (match) {
          firstName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }

        // Essayer de récupérer depuis laboratory_profiles
        const labProfile = labProfilesMap.get(userId);
        if (labProfile?.brand_name) {
          firstName = labProfile.brand_name;
        }
      } else if (userType === 'animateur') {
        const match = email.match(/demo\.animateur\.(\w+)@/);
        if (match) {
          firstName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.log(`   ❌ ${email}: ${error.message}`);
      } else {
        console.log(`   ✓ ${email} → first_name: "${firstName}"`);
        repaired++;
      }
    }
  }

  // Réparer villes manquantes pour les labos
  if (issues.labMissingCity.length > 0) {
    console.log('🔧 Ajout des villes manquantes pour les labos...');
    for (const { userId, email } of issues.labMissingCity) {
      const match = email.match(/demo\.labo\.(\w+)@/);
      if (match) {
        const labKey = match[1].toLowerCase();
        const cityData = LAB_CITIES[labKey];

        if (cityData) {
          const { error } = await supabase
            .from('profiles')
            .update({
              current_city: cityData.city,
              current_postal_code: cityData.postal_code,
              current_region: cityData.region,
              current_department: cityData.department,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (error) {
            console.log(`   ❌ ${email}: ${error.message}`);
          } else {
            console.log(`   ✓ ${email} → ${cityData.city} (${cityData.postal_code})`);
            repaired++;
          }
        } else {
          console.log(`   ⏭️  ${email}: pas de ville par défaut configurée`);
        }
      }
    }
  }

  // Réparer laboratory_profiles manquants
  if (issues.labMissingLabProfile.length > 0) {
    console.log('🔧 Création des laboratory_profiles manquants...');
    for (const { userId, email } of issues.labMissingLabProfile) {
      const match = email.match(/demo\.labo\.(\w+)@/);
      const brandName = match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Laboratoire';

      const { error } = await supabase.from('laboratory_profiles').insert({
        id: userId,
        company_name: brandName + ' SAS',
        brand_name: brandName,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error && !error.message.includes('duplicate')) {
        console.log(`   ❌ ${email}: ${error.message}`);
      } else {
        console.log(`   ✓ ${email} → ${brandName}`);
        repaired++;
      }
    }
  }

  // Réparer animator_profiles manquants
  if (issues.animatorMissingAnimatorProfile.length > 0) {
    console.log('🔧 Création des animator_profiles manquants...');
    for (const { userId, email } of issues.animatorMissingAnimatorProfile) {
      const { error } = await supabase.from('animator_profiles').insert({
        id: userId,
        animation_specialties: [],
        mobility_zones: [],
        has_vehicle: false,
        available_now: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error && !error.message.includes('duplicate')) {
        console.log(`   ❌ ${email}: ${error.message}`);
      } else {
        console.log(`   ✓ ${email}`);
        repaired++;
      }
    }
  }

  // Résumé
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 RÉSUMÉ DE LA RÉPARATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Problèmes détectés: ${
    issues.missingUsers.length +
    issues.missingProfiles.length +
    issues.missingFirstName.length +
    issues.labMissingCity.length +
    issues.labMissingLabProfile.length +
    issues.animatorMissingAnimatorProfile.length
  }`);
  console.log(`Réparations effectuées: ${repaired}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (repaired > 0) {
    console.log('✨ Réparation terminée ! Les utilisateurs devraient maintenant pouvoir se connecter sans problème.');
  } else if (issues.missingUsers.length + issues.missingProfiles.length + issues.missingFirstName.length + issues.labMissingCity.length === 0) {
    console.log('✅ Aucun problème détecté. La base de données est cohérente.');
  } else {
    console.log('⚠️ Certains problèmes n\'ont pas pu être réparés automatiquement.');
  }
}

repair().catch(console.error);
