/**
 * Tests d'intégration pour l'onboarding des animateurs et laboratoires
 * Ces types ont des formulaires et tables spécifiques
 */

import { supabase } from '../../lib/supabase';

// Helper pour nettoyer les données de test
const cleanupTestAnimator = async (email) => {
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);

    if (user) {
      // Supprimer le profil animateur
      await supabase.from('animator_profiles').delete().eq('id', user.id);
      // Supprimer l'utilisateur de auth
      await supabase.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    console.warn('Cleanup error:', error.message);
  }
};

const cleanupTestLaboratory = async (email) => {
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);

    if (user) {
      // Supprimer le profil laboratoire
      await supabase.from('laboratory_profiles').delete().eq('id', user.id);
      // Supprimer l'utilisateur de auth
      await supabase.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    console.warn('Cleanup error:', error.message);
  }
};

// Helper pour créer un utilisateur de test
const createTestUser = async (email, password, userType) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: userType,
      },
    },
  });

  if (error) throw error;
  return data.user;
};

const TEST_PASSWORD = 'Test123456!';
const TEST_CITY = {
  city: 'Lyon',
  postal_code: '69001',
  region: 'Auvergne-Rhône-Alpes',
  department: 'Rhône',
  latitude: 45.7640,
  longitude: 4.8357,
};

describe('Onboarding - Animateur', () => {
  beforeEach(async () => {
    await cleanupTestAnimator('test.animateur@example.com');
  });

  afterAll(async () => {
    await cleanupTestAnimator('test.animateur@example.com');
  });

  it('devrait créer un compte et un profil animateur complet', async () => {
    const email = 'test.animateur@example.com';

    // 1. Inscription avec user_type animateur
    const user = await createTestUser(email, TEST_PASSWORD, 'animateur');
    expect(user).toBeDefined();
    expect(user.email).toBe(email);

    // 2. Création du profil animateur
    const { data: profile, error } = await supabase
      .from('animator_profiles')
      .insert({
        id: user.id,
        first_name: 'Claire',
        last_name: 'Moreau',
        phone: '0612345678',
        bio: 'Animatrice pharmaceutique spécialisée en dermocosmétique',
        specialties: ['dermato', 'cosmetique'],
        experience_years: 7,
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
        intervention_radius_km: 100,
        daily_rate: 350,
        available_days: ['monday', 'tuesday', 'wednesday'],
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.first_name).toBe('Claire');
    expect(profile.last_name).toBe('Moreau');
    expect(profile.experience_years).toBe(7);
    expect(profile.specialties).toEqual(['dermato', 'cosmetique']);
    expect(profile.daily_rate).toBe(350);
    expect(profile.intervention_radius_km).toBe(100);
  });

  it('devrait accepter un profil animateur avec tarif journalier null', async () => {
    const email = 'test.animateur2@example.com';

    const user = await createTestUser(email, TEST_PASSWORD, 'animateur');

    const { data: profile, error } = await supabase
      .from('animator_profiles')
      .insert({
        id: user.id,
        first_name: 'Thomas',
        last_name: 'Leroy',
        phone: '0623456789',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
        daily_rate: null, // Pas encore défini
        intervention_radius_km: 50,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.daily_rate).toBeNull();

    await cleanupTestAnimator(email);
  });
});

describe('Onboarding - Laboratoire', () => {
  beforeEach(async () => {
    await cleanupTestLaboratory('test.laboratoire@example.com');
  });

  afterAll(async () => {
    await cleanupTestLaboratory('test.laboratoire@example.com');
  });

  it('devrait créer un compte et un profil laboratoire complet', async () => {
    const email = 'test.laboratoire@example.com';

    // 1. Inscription avec user_type laboratoire
    const user = await createTestUser(email, TEST_PASSWORD, 'laboratoire');
    expect(user).toBeDefined();
    expect(user.email).toBe(email);

    // 2. Création du profil laboratoire
    const { data: profile, error } = await supabase
      .from('laboratory_profiles')
      .insert({
        id: user.id,
        company_name: 'Laboratoires PharmaTech',
        siret: '12345678901234',
        contact_first_name: 'Pierre',
        contact_last_name: 'Durand',
        contact_phone: '0134567890',
        description: 'Leader dans les compléments alimentaires naturels',
        specialties: ['complements', 'phytotherapie'],
        website: 'https://pharmatech.example.com',
        city: TEST_CITY.city,
        postal_code: TEST_CITY.postal_code,
        region: TEST_CITY.region,
        department: TEST_CITY.department,
        latitude: TEST_CITY.latitude,
        longitude: TEST_CITY.longitude,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(profile).toBeDefined();
    expect(profile.company_name).toBe('Laboratoires PharmaTech');
    expect(profile.siret).toBe('12345678901234');
    expect(profile.contact_first_name).toBe('Pierre');
    expect(profile.contact_last_name).toBe('Durand');
    expect(profile.specialties).toEqual(['complements', 'phytotherapie']);
  });

  it('devrait rejeter un profil laboratoire sans nom entreprise', async () => {
    const email = 'test.laboratoire2@example.com';

    const user = await createTestUser(email, TEST_PASSWORD, 'laboratoire');

    // Essayer de créer un profil sans company_name (requis)
    const { error } = await supabase
      .from('laboratory_profiles')
      .insert({
        id: user.id,
        // company_name manquant
        siret: '12345678901234',
        contact_first_name: 'Test',
        contact_last_name: 'Test',
        contact_phone: '0123456789',
        city: TEST_CITY.city,
        postal_code: TEST_CITY.postal_code,
        region: TEST_CITY.region,
        department: TEST_CITY.department,
        latitude: TEST_CITY.latitude,
        longitude: TEST_CITY.longitude,
      })
      .select()
      .single();

    expect(error).toBeDefined();

    await cleanupTestLaboratory(email);
  });

  it('devrait rejeter un profil laboratoire sans SIRET', async () => {
    const email = 'test.laboratoire3@example.com';

    const user = await createTestUser(email, TEST_PASSWORD, 'laboratoire');

    const { error } = await supabase
      .from('laboratory_profiles')
      .insert({
        id: user.id,
        company_name: 'Test Lab',
        // siret manquant (requis)
        contact_first_name: 'Test',
        contact_last_name: 'Test',
        contact_phone: '0123456789',
        city: TEST_CITY.city,
        postal_code: TEST_CITY.postal_code,
        region: TEST_CITY.region,
        department: TEST_CITY.department,
        latitude: TEST_CITY.latitude,
        longitude: TEST_CITY.longitude,
      })
      .select()
      .single();

    expect(error).toBeDefined();

    await cleanupTestLaboratory(email);
  });
});

describe('Validation des données spécifiques', () => {
  it('animateur - devrait accepter intervention_radius_km entre 10 et 500', async () => {
    const email = 'test.animateur.radius@example.com';
    const user = await createTestUser(email, TEST_PASSWORD, 'animateur');

    // Tester rayon valide
    const { data: profile1, error: error1 } = await supabase
      .from('animator_profiles')
      .insert({
        id: user.id,
        first_name: 'Test',
        last_name: 'Rayon',
        phone: '0612345678',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
        intervention_radius_km: 150,
      })
      .select()
      .single();

    expect(error1).toBeNull();
    expect(profile1.intervention_radius_km).toBe(150);

    await cleanupTestAnimator(email);
  });

  it('laboratoire - devrait valider le format SIRET (14 chiffres)', async () => {
    const email = 'test.laboratoire.siret@example.com';
    const user = await createTestUser(email, TEST_PASSWORD, 'laboratoire');

    // SIRET valide
    const { data: profile, error } = await supabase
      .from('laboratory_profiles')
      .insert({
        id: user.id,
        company_name: 'Test SIRET Lab',
        siret: '12345678901234', // 14 chiffres
        contact_first_name: 'Test',
        contact_last_name: 'Test',
        contact_phone: '0123456789',
        city: TEST_CITY.city,
        postal_code: TEST_CITY.postal_code,
        region: TEST_CITY.region,
        department: TEST_CITY.department,
        latitude: TEST_CITY.latitude,
        longitude: TEST_CITY.longitude,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(profile.siret).toBe('12345678901234');
    expect(profile.siret.length).toBe(14);

    await cleanupTestLaboratory(email);
  });
});
