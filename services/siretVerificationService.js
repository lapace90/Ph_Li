import { supabase } from '../lib/supabase';

// ============================================
// CONFIGURATION
// ============================================

// Mode démo pour les présentations (pas d'appel API réel)
const DEMO_MODE = false;

// Données de test pour le mode démo
const DEMO_SIRET_DATA = {
  // Animateurs
  '12345678901234': {
    name: 'DURAND Marie',
    activity: 'Animation commerciale freelance',
    active: true,
  },
  '23456789012345': {
    name: 'MARTIN Sophie',
    activity: 'Animation commerciale freelance',
    active: true,
  },
  // Laboratoires
  '98765432109876': {
    name: 'LABORATOIRE DERMO FRANCE',
    activity: 'Fabrication de produits pharmaceutiques',
    active: true,
  },
};

// ============================================
// HELPERS
// ============================================

const isValidSiretFormat = (siretNumber) => {
  const clean = siretNumber.replace(/\s/g, '');
  return /^\d{14}$/.test(clean);
};

// ============================================
// VÉRIFICATION DEMO
// ============================================

const verifySiretDemo = (siretNumber) => {
  const clean = siretNumber.replace(/\s/g, '');
  const demoData = DEMO_SIRET_DATA[clean];

  if (!demoData) {
    return {
      verified: false,
      message: 'Numéro SIRET non trouvé',
      data: null,
    };
  }

  if (!demoData.active) {
    return {
      verified: false,
      message: 'Cet établissement n\'est plus actif',
      data: null,
    };
  }

  return {
    verified: true,
    message: 'SIRET vérifié avec succès',
    data: {
      siret: clean,
      name: demoData.name,
      activity: demoData.activity,
      active: demoData.active,
      source: 'demo',
    },
  };
};

// ============================================
// VÉRIFICATION PRODUCTION (API INSEE)
// ============================================

const verifySiretProduction = async (siretNumber) => {
  const cleanSiret = siretNumber.replace(/\s/g, '');

  try {
    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la vérification du SIRET');
    }

    const result = await response.json();

    if (!result.results || result.results.length === 0) {
      return {
        verified: false,
        message: 'SIRET non trouvé dans la base SIRENE',
        data: null,
      };
    }

    // Trouver l'établissement correspondant au SIRET exact
    const company = result.results[0];
    const etablissement = company.matching_etablissements?.find(e => e.siret === cleanSiret)
      || (company.siege?.siret === cleanSiret ? company.siege : null);

    if (!etablissement) {
      return {
        verified: false,
        message: 'SIRET non trouvé dans la base SIRENE',
        data: null,
      };
    }

    // Vérifier si l'établissement est actif
    const isActive = etablissement.etat_administratif === 'A';

    if (!isActive) {
      return {
        verified: false,
        message: 'Cet établissement n\'est plus actif',
        data: null,
      };
    }

    return {
      verified: true,
      message: 'SIRET vérifié avec succès',
      data: {
        siret: cleanSiret,
        name: company.nom_complet || company.nom_raison_sociale || '',
        activity: etablissement.activite_principale || '',
        address: etablissement.adresse || '',
        postalCode: etablissement.code_postal || '',
        city: etablissement.libelle_commune || '',
        active: isActive,
        naf_code: etablissement.activite_principale,
        source: 'recherche-entreprises',
      },
    };
  } catch (error) {
    console.error('Erreur vérification SIRET:', error);
    return {
      verified: false,
      message: 'Erreur lors de la vérification du SIRET',
      data: null,
    };
  }
};

// ============================================
// SERVICE PUBLIC
// ============================================

export const siretVerificationService = {
  /**
   * Soumet une vérification SIRET
   * @param {string} userId - ID de l'utilisateur
   * @param {string} siretNumber - Numéro SIRET à vérifier
   * @returns {Promise<{verified: boolean, message: string, data: any}>}
   */
  async submitVerification(userId, siretNumber) {
    if (!isValidSiretFormat(siretNumber)) {
      return {
        verified: false,
        message: 'Le numéro SIRET doit contenir exactement 14 chiffres',
      };
    }

    const result = DEMO_MODE
      ? verifySiretDemo(siretNumber)
      : await verifySiretProduction(siretNumber);

    const { error } = await supabase
      .from('verification_documents')
      .upsert({
        user_id: userId,
        verification_type: 'siret',
        document_reference: siretNumber.replace(/\s/g, ''),
        status: result.verified ? 'approved' : 'rejected',
        verification_data: result.data,
        rejection_reason: result.verified ? null : result.message,
        submitted_at: new Date().toISOString(),
        verified_at: result.verified ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,verification_type',
      });

    if (error) {
      console.error('Erreur enregistrement:', error);
      return { verified: false, message: 'Erreur lors de l\'enregistrement' };
    }

    return result;
  },

  /**
   * Récupère le statut de vérification SIRET
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<{verified: boolean, status: string, siretNumber: string}>}
   */
  async getVerificationStatus(userId) {
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_type', 'siret')
      .maybeSingle();

    if (error || !data) return { verified: false, status: null };

    return {
      verified: data.status === 'approved',
      status: data.status,
      siretNumber: data.document_reference,
      data: data.verification_data,
      rejectionReason: data.rejection_reason,
    };
  },

  /**
   * Supprime une vérification SIRET
   * @param {string} userId - ID de l'utilisateur
   */
  async deleteVerification(userId) {
    const { error } = await supabase
      .from('verification_documents')
      .delete()
      .eq('user_id', userId)
      .eq('verification_type', 'siret');

    if (error) throw error;
  },

  /**
   * Vérifie si un SIRET est déjà utilisé par un autre utilisateur
   * @param {string} siretNumber - Numéro SIRET
   * @param {string} excludeUserId - ID utilisateur à exclure
   * @returns {Promise<boolean>}
   */
  async isSiretAlreadyUsed(siretNumber, excludeUserId) {
    const { data } = await supabase
      .from('verification_documents')
      .select('user_id')
      .eq('verification_type', 'siret')
      .eq('document_reference', siretNumber.replace(/\s/g, ''))
      .eq('status', 'approved')
      .neq('user_id', excludeUserId)
      .maybeSingle();

    return !!data;
  },

  isValidSiretFormat,
  DEMO_SIRET_DATA: DEMO_MODE ? DEMO_SIRET_DATA : null,
};
