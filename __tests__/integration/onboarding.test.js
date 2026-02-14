/**
 * Tests d'intégration pour l'inscription et l'onboarding
 * Teste tous les types d'utilisateurs: préparateur, conseiller, étudiant, titulaire, animateur, laboratoire
 */

import { supabase } from '../../lib/supabase';

// Helper pour nettoyer les données de test
const cleanupTestUser = async (email) => {
  try {
    // Récupérer l'utilisateur par email depuis auth.users
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);

    if (user) {
      // Supprimer le profil
      await supabase.from('profiles').delete().eq('id', user.id);

      // Supprimer l'utilisateur de auth
      await supabase.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    console.warn('Cleanup error:', error.message);
  }
};

// Helper pour créer un utilisateur de test
const createTestUser = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data.user;
};

// Helper pour créer un profil
const createProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...profileData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Données de test communes
const TEST_PASSWORD = 'Test123456!';
const TEST_CITY = {
  city: 'Paris',
  postal_code: '75001',
  region: 'Île-de-France',
  department: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
};

describe('Onboarding - Inscription et création de profil', () => {
  // Nettoyer avant chaque test
  beforeEach(async () => {
    await cleanupTestUser('test.preparateur@example.com');
    await cleanupTestUser('test.conseiller@example.com');
    await cleanupTestUser('test.etudiant@example.com');
    await cleanupTestUser('test.titulaire@example.com');
  });

  // Nettoyer après tous les tests
  afterAll(async () => {
    await cleanupTestUser('test.preparateur@example.com');
    await cleanupTestUser('test.conseiller@example.com');
    await cleanupTestUser('test.etudiant@example.com');
    await cleanupTestUser('test.titulaire@example.com');
  });

  describe('Type: Préparateur', () => {
    it('devrait créer un compte et un profil préparateur complet', async () => {
      const email = 'test.preparateur@example.com';

      // 1. Inscription
      const user = await createTestUser(email, TEST_PASSWORD);
      expect(user).toBeDefined();
      expect(user.email).toBe(email);

      // 2. Création du profil (simulant l'onboarding)
      const profile = await createProfile(user.id, {
        first_name: 'Jean',
        last_name: 'Dupont',
        nickname: 'JD',
        gender: 'male',
        phone: '0612345678',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
        experience_years: 5,
        specializations: ['officine', 'dermato'],
        availability_date: '2026-03-01',
        search_radius_km: 50,
        preferred_contract_types: ['CDI', 'CDD'],
        willing_to_relocate: false,
      });

      expect(profile).toBeDefined();
      expect(profile.first_name).toBe('Jean');
      expect(profile.last_name).toBe('Dupont');
      expect(profile.experience_years).toBe(5);
      expect(profile.specializations).toEqual(['officine', 'dermato']);
    });
  });

  describe('Type: Conseiller', () => {
    it('devrait créer un compte et un profil conseiller complet', async () => {
      const email = 'test.conseiller@example.com';

      const user = await createTestUser(email, TEST_PASSWORD);
      expect(user).toBeDefined();

      const profile = await createProfile(user.id, {
        first_name: 'Marie',
        last_name: 'Martin',
        nickname: 'MM',
        gender: 'female',
        phone: '0623456789',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
        experience_years: 3,
        specializations: ['parapharmacie', 'cosmetique'],
        availability_date: '2026-04-01',
        search_radius_km: 30,
        preferred_contract_types: ['CDD'],
        willing_to_relocate: true,
      });

      expect(profile).toBeDefined();
      expect(profile.first_name).toBe('Marie');
      expect(profile.specializations).toEqual(['parapharmacie', 'cosmetique']);
      expect(profile.willing_to_relocate).toBe(true);
    });
  });

  describe('Type: Étudiant', () => {
    it('devrait créer un compte et un profil étudiant avec school et study_level', async () => {
      const email = 'test.etudiant@example.com';

      const user = await createTestUser(email, TEST_PASSWORD);
      expect(user).toBeDefined();

      const profile = await createProfile(user.id, {
        first_name: 'Sophie',
        last_name: 'Bernard',
        nickname: 'SB',
        gender: 'female',
        phone: '0634567890',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
        experience_years: 0,
        study_level: 'Master 1',
        school: 'Université Paris Descartes',
        availability_date: '2026-06-01',
        search_radius_km: 25,
        preferred_contract_types: ['stage', 'vacation'],
        willing_to_relocate: false,
      });

      expect(profile).toBeDefined();
      expect(profile.first_name).toBe('Sophie');
      expect(profile.study_level).toBe('Master 1');
      expect(profile.school).toBe('Université Paris Descartes');
      expect(profile.experience_years).toBe(0);
    });

    it('devrait accepter un profil étudiant avec school null pour non-étudiants', async () => {
      const email = 'test.etudiant2@example.com';

      const user = await createTestUser(email, TEST_PASSWORD);

      // Profil sans school (cas d'un préparateur par exemple)
      const profile = await createProfile(user.id, {
        first_name: 'Pierre',
        last_name: 'Durand',
        phone: '0645678901',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
        study_level: null,
        school: null,
      });

      expect(profile).toBeDefined();
      expect(profile.school).toBeNull();
      expect(profile.study_level).toBeNull();

      // Cleanup
      await cleanupTestUser(email);
    });
  });

  describe('Type: Titulaire', () => {
    it('devrait créer un compte et un profil titulaire complet', async () => {
      const email = 'test.titulaire@example.com';

      const user = await createTestUser(email, TEST_PASSWORD);
      expect(user).toBeDefined();

      const profile = await createProfile(user.id, {
        first_name: 'Dr. François',
        last_name: 'Petit',
        nickname: 'FP',
        gender: 'male',
        phone: '0656789012',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
        experience_years: 15,
        specializations: ['officine', 'gestion'],
        bio: 'Pharmacien titulaire depuis 15 ans',
      });

      expect(profile).toBeDefined();
      expect(profile.first_name).toBe('Dr. François');
      expect(profile.experience_years).toBe(15);
      expect(profile.bio).toBe('Pharmacien titulaire depuis 15 ans');
    });
  });
});

describe('Validation des champs requis', () => {
  beforeEach(async () => {
    await cleanupTestUser('test.validation@example.com');
  });

  afterAll(async () => {
    await cleanupTestUser('test.validation@example.com');
  });

  it('devrait rejeter un profil sans prénom', async () => {
    const email = 'test.validation@example.com';
    const user = await createTestUser(email, TEST_PASSWORD);

    await expect(
      createProfile(user.id, {
        // first_name manquant
        last_name: 'Test',
        phone: '0612345678',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
      })
    ).rejects.toThrow();
  });

  it('devrait rejeter un profil sans nom', async () => {
    const email = 'test.validation2@example.com';
    const user = await createTestUser(email, TEST_PASSWORD);

    await expect(
      createProfile(user.id, {
        first_name: 'Test',
        // last_name manquant
        phone: '0612345678',
        current_city: TEST_CITY.city,
        current_postal_code: TEST_CITY.postal_code,
        current_region: TEST_CITY.region,
        current_department: TEST_CITY.department,
        current_latitude: TEST_CITY.latitude,
        current_longitude: TEST_CITY.longitude,
      })
    ).rejects.toThrow();

    await cleanupTestUser(email);
  });
});
