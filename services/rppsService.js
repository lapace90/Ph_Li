import { supabase } from '../lib/supabase';
import { logService } from './logService';

// ============================================
// CONFIGURATION
// ============================================

// Mode démo pour les présentations (pas d'appel API réel)
const DEMO_MODE = true;

// Données de test pour le mode démo (alignées sur seed-demo-v2.mjs)
const DEMO_RPPS_DATA = {
  // Titulaires (pharmaciens)
  '10000000001': { firstName: 'Marie', lastName: 'Durand', profession: 'Pharmacien', professionCode: '21' },
  '10000000002': { firstName: 'Jean-Pierre', lastName: 'Martin', profession: 'Pharmacien', professionCode: '21' },
  '10000000003': { firstName: 'Sophie', lastName: 'Bernard', profession: 'Pharmacien', professionCode: '21' },
  '10000000004': { firstName: 'François', lastName: 'Petit', profession: 'Pharmacien', professionCode: '21' },
  '10000000005': { firstName: 'Claire', lastName: 'Moreau', profession: 'Pharmacien', professionCode: '21' },
  '10000000006': { firstName: 'Thomas', lastName: 'Leroy', profession: 'Pharmacien', professionCode: '21' },
  // Préparateurs
  '10000000011': { firstName: 'Emma', lastName: 'Lefebvre', profession: 'Préparateur en pharmacie', professionCode: '26' },
  '10000000012': { firstName: 'Lucas', lastName: 'Dubois', profession: 'Préparateur en pharmacie', professionCode: '26' },
  '10000000013': { firstName: 'Camille', lastName: 'Rousseau', profession: 'Préparateur en pharmacie', professionCode: '26' },
};

// ============================================
// HELPERS
// ============================================

const normalizeName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const namesMatch = (name1, name2) => {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  const words1 = n1.split(' ').filter(Boolean);
  const words2 = n2.split(' ').filter(Boolean);
  
  const allWords1InWords2 = words1.every(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  const allWords2InWords1 = words2.every(w => words1.some(w1 => w1.includes(w) || w.includes(w1)));
  
  return allWords1InWords2 || allWords2InWords1;
};

const isValidRppsFormat = (rppsNumber) => /^\d{11}$/.test(rppsNumber);

// ============================================
// VÉRIFICATION DEMO
// ============================================

const verifyRppsDemo = (rppsNumber, firstName, lastName) => {
  const demoData = DEMO_RPPS_DATA[rppsNumber];
  
  if (!demoData) {
    return {
      verified: false,
      message: 'Numéro RPPS non trouvé',
      data: null,
    };
  }
  
  const firstNameMatch = namesMatch(firstName, demoData.firstName);
  const lastNameMatch = namesMatch(lastName, demoData.lastName);
  
  if (!firstNameMatch || !lastNameMatch) {
    return {
      verified: false,
      message: 'Le nom ne correspond pas au titulaire du RPPS',
      data: { expected: `${demoData.firstName} ${demoData.lastName}` },
    };
  }
  
  return {
    verified: true,
    message: 'RPPS vérifié avec succès',
    data: {
      rpps_number: rppsNumber,
      first_name: demoData.firstName,
      last_name: demoData.lastName,
      profession: demoData.profession,
      profession_code: demoData.professionCode,
      active: true,
      source: 'demo',
    },
  };
};

// ============================================
// VÉRIFICATION PRODUCTION (API ANS)
// ============================================

const verifyRppsProduction = async (rppsNumber, firstName, lastName) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-rpps', {
      body: { rppsNumber, firstName, lastName },
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur vérification RPPS:', error);
    return {
      verified: false,
      message: 'Erreur lors de la vérification',
      data: null,
    };
  }
};

// ============================================
// SERVICE PUBLIC
// ============================================

export const rppsService = {
  async submitVerification(userId, rppsNumber, firstName, lastName) {
    if (!isValidRppsFormat(rppsNumber)) {
      return {
        verified: false,
        message: 'Le numéro RPPS doit contenir exactement 11 chiffres',
      };
    }
    
    const result = DEMO_MODE
      ? verifyRppsDemo(rppsNumber, firstName, lastName)
      : await verifyRppsProduction(rppsNumber, firstName, lastName);
    
    const { error } = await supabase
      .from('verification_documents')
      .upsert({
        user_id: userId,
        verification_type: 'rpps',
        document_reference: rppsNumber,
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

    // Log le résultat de la vérification
    if (result.verified) {
      logService.verification.rppsVerified(userId, rppsNumber);
    } else {
      logService.verification.rppsRejected(userId, rppsNumber, result.message);
    }

    return result;
  },

  async getVerificationStatus(userId) {
    const { data, error } = await supabase
      .from('verification_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_type', 'rpps')
      .maybeSingle();
    
    if (error || !data) return { verified: false, status: null };
    
    return {
      verified: data.status === 'approved',
      status: data.status,
      rppsNumber: data.document_reference,
      data: data.verification_data,
      rejectionReason: data.rejection_reason,
    };
  },
  
  async deleteVerification(userId) {
    const { error } = await supabase
      .from('verification_documents')
      .delete()
      .eq('user_id', userId)
      .eq('verification_type', 'rpps');
    
    if (error) throw error;
  },
  
  async isRppsAlreadyUsed(rppsNumber, excludeUserId) {
    const { data } = await supabase
      .from('verification_documents')
      .select('user_id')
      .eq('verification_type', 'rpps')
      .eq('document_reference', rppsNumber)
      .eq('status', 'approved')
      .neq('user_id', excludeUserId)
      .maybeSingle();
    
    return !!data;
  },
  
  isValidRppsFormat,
  DEMO_RPPS_DATA: DEMO_MODE ? DEMO_RPPS_DATA : null,
};