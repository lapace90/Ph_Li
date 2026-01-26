// services/pharmacyDetailsService.js
// Gestion des pharmacies vérifiées des titulaires

import { supabase } from '../lib/supabase';

export const pharmacyDetailsService = {
  /**
   * Récupère toutes les pharmacies d'un titulaire
   */
  async getByOwnerId(ownerId) {
    const { data, error } = await supabase
      .from('pharmacy_details')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère une pharmacie par son ID
   */
  async getById(pharmacyId) {
    const { data, error } = await supabase
      .from('pharmacy_details')
      .select('*')
      .eq('id', pharmacyId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Récupère une pharmacie par son SIRET
   */
  async getBySiret(siret) {
    const { data, error } = await supabase
      .from('pharmacy_details')
      .select('*')
      .eq('siret', siret.replace(/\s/g, ''))
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Crée une nouvelle pharmacie
   */
  async create(ownerId, pharmacyData) {
    const { data, error } = await supabase
      .from('pharmacy_details')
      .insert({
        owner_id: ownerId,
        siret: pharmacyData.siret?.replace(/\s/g, ''),
        name: pharmacyData.name,
        legal_name: pharmacyData.legal_name,
        address: pharmacyData.address,
        city: pharmacyData.city,
        postal_code: pharmacyData.postal_code,
        department: pharmacyData.department,
        region: pharmacyData.region,
        latitude: pharmacyData.latitude,
        longitude: pharmacyData.longitude,
        phone: pharmacyData.phone,
        email: pharmacyData.email,
        website: pharmacyData.website,
        pharmacy_type: pharmacyData.pharmacy_type || 'officine',
        employee_count: pharmacyData.employee_count,
        finess_number: pharmacyData.finess_number,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour une pharmacie
   */
  async update(pharmacyId, updates) {
    const { data, error } = await supabase
      .from('pharmacy_details')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pharmacyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime une pharmacie
   */
  async delete(pharmacyId) {
    const { error } = await supabase
      .from('pharmacy_details')
      .delete()
      .eq('id', pharmacyId);

    if (error) throw error;
    return true;
  },

  /**
   * Vérifie un SIRET via l'API INSEE
   * Retourne les infos de l'établissement si valide
   */
  async verifySiret(siret) {
    const cleanSiret = siret.replace(/\s/g, '');
    
    if (cleanSiret.length !== 14) {
      throw new Error('Le SIRET doit contenir 14 chiffres');
    }

    try {
      const response = await fetch(
        `https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du SIRET');
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error('SIRET non trouvé dans la base SIRENE');
      }

      const company = data.results[0];
      const etablissement = company.matching_etablissements?.find(e => e.siret === cleanSiret)
        || (company.siege?.siret === cleanSiret ? company.siege : null);

      if (!etablissement) {
        throw new Error('SIRET non trouvé dans la base SIRENE');
      }

      // Vérifier que c'est bien une pharmacie (code NAF 4773Z)
      const nafCode = etablissement.activite_principale || company.activite_principale;
      const isPharmacy = nafCode === '47.73Z' || nafCode === '4773Z';

      if (!isPharmacy) {
        console.warn('SIRET valide mais pas une pharmacie (NAF:', nafCode, ')');
      }

      return {
        valid: true,
        isPharmacy,
        nafCode,
        data: {
          siret: cleanSiret,
          name: company.nom_complet || company.nom_raison_sociale || 'Pharmacie',
          legal_name: company.nom_raison_sociale || company.nom_complet,
          address: etablissement.adresse || '',
          postal_code: etablissement.code_postal || '',
          city: etablissement.libelle_commune || '',
          department: etablissement.libelle_commune || '',
          region: null,
          latitude: etablissement.latitude ? parseFloat(etablissement.latitude) : null,
          longitude: etablissement.longitude ? parseFloat(etablissement.longitude) : null,
          employee_count: null,
          is_active: etablissement.etat_administratif === 'A',
        },
      };
    } catch (error) {
      console.error('Erreur vérification SIRET:', error);
      throw error;
    }
  },

  /**
   * Marque une pharmacie comme vérifiée
   */
  async markAsVerified(pharmacyId) {
    const { data, error } = await supabase
      .from('pharmacy_details')
      .update({
        siret_verified: true,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pharmacyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Vérifie et enregistre une pharmacie en une seule opération
   */
  async verifyAndCreate(ownerId, siret) {
    // 1. Vérifier le SIRET
    const verification = await this.verifySiret(siret);
    
    if (!verification.valid) {
      throw new Error('SIRET invalide');
    }

    // 2. Vérifier que ce SIRET n'est pas déjà enregistré
    const existing = await this.getBySiret(siret);
    if (existing) {
      throw new Error('Cette pharmacie est déjà enregistrée sur la plateforme');
    }

    // 3. Créer la pharmacie avec les infos récupérées
    const pharmacy = await this.create(ownerId, verification.data);

    // 4. Marquer comme vérifiée
    return await this.markAsVerified(pharmacy.id);
  },

  /**
   * Récupère les pharmacies vérifiées pour l'affichage public
   */
  async getVerifiedPharmacies(filters = {}) {
    let query = supabase
      .from('pharmacy_details')
      .select('*')
      .eq('siret_verified', true)
      .eq('is_active', true);

    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Helper: Convertit la tranche d'effectifs INSEE en nombre
   */
  _parseEmployeeCount(tranche) {
    const tranches = {
      '00': 0,
      '01': 2,
      '02': 4,
      '03': 8,
      '11': 15,
      '12': 35,
      '21': 75,
      '22': 150,
    };
    return tranches[tranche] || null;
  },
};