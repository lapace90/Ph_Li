// services/cvService.js

import { supabase } from '../lib/supabase';
import { subscriptionService } from './subscriptionService';

export const cvService = {
  // ==========================================
  // QUOTAS
  // ==========================================

  /**
   * Statistiques des CVs d'un utilisateur
   * @returns {{ generated: number, uploaded: number, total: number, limit: number }}
   */
  async getCVStats(userId) {
    const cvs = await this.getByUserId(userId);
    const generated = cvs.filter(cv => cv.has_structured_cv).length;
    const uploaded = cvs.filter(cv => cv.has_pdf && !cv.has_structured_cv).length;
    return { generated, uploaded, total: cvs.length, limit: 5 };
  },

  /**
   * Verifie si l'utilisateur peut creer un CV genere (formulaire)
   * Free = 1, Premium = 3
   * @returns {{ allowed: boolean, current: number, limit: number, message: string|null }}
   */
  async canGenerateCV(userId) {
    const [stats, limitsInfo] = await Promise.all([
      this.getCVStats(userId),
      subscriptionService.getLimits(userId),
    ]);

    const limit = limitsInfo.limits.cvCount || 1;
    const allowed = stats.generated < limit && stats.total < 5;

    let message = null;
    if (stats.total >= 5) {
      message = 'Stockage plein (5/5). Supprimez un CV pour en ajouter un nouveau.';
    } else if (stats.generated >= limit) {
      const nextLimit = limit < 3 ? 3 : limit;
      message = `Vous avez atteint la limite de ${limit} CV genere${limit > 1 ? 's' : ''}. Passez Premium pour creer jusqu'a ${nextLimit} CV differents.`;
    }

    return { allowed, current: stats.generated, limit, message };
  },

  /**
   * Verifie si l'utilisateur peut uploader un CV (PDF)
   * Limite de 5 CVs au total (generes + uploades) pour tous les forfaits
   * @returns {{ allowed: boolean, current: number, limit: number, message: string|null }}
   */
  async canUploadCV(userId) {
    const stats = await this.getCVStats(userId);
    const limit = 5;
    const allowed = stats.total < limit;

    const message = !allowed
      ? `Stockage plein (${stats.total}/${limit}). Supprimez un CV pour en ajouter un nouveau.`
      : null;

    return { allowed, current: stats.total, limit, message };
  },

  // ==========================================
  // CRUD
  // ==========================================

  /**
   * Récupère tous les CVs d'un utilisateur
   */
  async getByUserId(userId) {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère un CV par son ID
   */
  async getById(cvId) {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', cvId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Récupère le CV par défaut d'un utilisateur
   */
  async getDefault(userId) {
    const { data, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Crée un nouveau CV
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} cvData - Données du CV
   * @param {string} cvData.title - Titre du CV
   * @param {string} cvData.visibility - 'anonymous' | 'public' | 'hidden'
   * @param {Object} cvData.structured_data - Données structurées (optionnel)
   * @param {string} cvData.file_url - URL du PDF (optionnel)
   * @param {string} cvData.pdf_visibility - Visibilité du PDF (optionnel)
   */
  async create(userId, cvData) {
    // Si c'est le premier CV, le mettre par défaut
    const existingCvs = await this.getByUserId(userId);
    const isFirst = existingCvs.length === 0;

    const { data, error } = await supabase
      .from('cvs')
      .insert({
        user_id: userId,
        is_default: isFirst,
        visibility: cvData.visibility || 'anonymous',
        title: cvData.title || 'Mon CV',
        file_url: cvData.file_url || null,
        pdf_visibility: cvData.pdf_visibility || 'after_match',
        structured_data: cvData.structured_data || null,
        has_structured_cv: !!cvData.structured_data,
        has_pdf: !!cvData.file_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour un CV existant
   */
  async update(cvId, updates) {
    // Préparer les mises à jour
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Mettre à jour les flags si nécessaire
    if (updates.structured_data !== undefined) {
      updateData.has_structured_cv = !!updates.structured_data;
    }
    if (updates.file_url !== undefined) {
      updateData.has_pdf = !!updates.file_url;
    }

    const { data, error } = await supabase
      .from('cvs')
      .update(updateData)
      .eq('id', cvId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour uniquement les données structurées d'un CV
   */
  async updateStructuredData(cvId, structuredData) {
    return this.update(cvId, { structured_data: structuredData });
  },

  /**
   * Met à jour la visibilité d'un CV
   */
  async updateVisibility(cvId, visibility) {
    return this.update(cvId, { visibility });
  },

  /**
   * Met à jour la visibilité du PDF
   */
  async updatePdfVisibility(cvId, pdfVisibility) {
    return this.update(cvId, { pdf_visibility: pdfVisibility });
  },

  /**
   * Supprime un CV
   */
  async delete(cvId) {
    // Récupérer le CV pour supprimer le fichier associé si besoin
    const cv = await this.getById(cvId);
    
    if (cv?.file_url) {
      // Extraire le chemin du fichier
      const urlParts = cv.file_url.split('cvs/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('cvs').remove([filePath]);
      }
    }

    const { error } = await supabase
      .from('cvs')
      .delete()
      .eq('id', cvId);

    if (error) throw error;
    return true;
  },

  /**
   * Définit un CV comme CV par défaut
   */
  async setDefault(userId, cvId) {
    // Retirer le défaut des autres CV
    await supabase
      .from('cvs')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Mettre ce CV par défaut
    return this.update(cvId, { is_default: true });
  },

  /**
   * Upload un fichier PDF
   */
  async uploadFile(userId, file) {
    const fileExt = file.name?.split('.').pop() || 'pdf';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('cvs')
      .upload(fileName, file, { contentType: 'application/pdf' });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('cvs')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  /**
   * Récupère les CVs avec données structurées (pour matching)
   */
  async getSearchableCVs(filters = {}) {
    let query = supabase
      .from('cvs')
      .select(`
        *,
        profiles!inner (
          id,
          first_name,
          current_region,
          current_city
        )
      `)
      .eq('has_structured_cv', true)
      .eq('visibility', filters.visibility || 'anonymous');

    if (filters.region) {
      query = query.eq('profiles.current_region', filters.region);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Vérifie si l'utilisateur peut voir le PDF d'un CV
   */
  canViewPdf(cv, viewerUserId, matchStatus) {
    if (!cv.has_pdf) return false;
    
    switch (cv.pdf_visibility) {
      case 'hidden':
        return false;
      case 'public':
        return true;
      case 'after_match':
        return matchStatus === 'matched';
      case 'after_approval':
        // Nécessite une logique d'approbation séparée
        return false;
      default:
        return false;
    }
  },

  /**
   * Récupère la version anonymisée ou complète d'un CV selon le contexte
   */
  async getForViewer(cvId, viewerUserId, matchStatus = null) {
    const cv = await this.getById(cvId);
    if (!cv) return null;

    const canSeeFull = matchStatus === 'matched' || cv.visibility === 'public';
    const canSeePdf = this.canViewPdf(cv, viewerUserId, matchStatus);

    return {
      ...cv,
      // Masquer les infos sensibles si pas de match
      structured_data: canSeeFull ? cv.structured_data : this.anonymizeData(cv.structured_data),
      file_url: canSeePdf ? cv.file_url : null,
      _viewMode: canSeeFull ? 'full' : 'anonymous',
      _canSeePdf: canSeePdf,
    };
  },

  /**
   * Version simplifiée de l'anonymisation côté service
   * (La version complète est dans utils/cvAnonymizer.js)
   */
  anonymizeData(structuredData) {
    if (!structuredData) return null;
    
    return {
      ...structuredData,
      // Anonymiser les expériences
      experiences: structuredData.experiences?.map(exp => ({
        ...exp,
        company_name: null, // Masqué
        city: null, // Masqué
      })),
      // Anonymiser les formations
      formations: structuredData.formations?.map(form => ({
        ...form,
        school_name: null, // Masqué
        school_city: null, // Masqué
      })),
    };
  },

  // ==========================================
  // TRACKING VUES CV
  // ==========================================

  /**
   * Enregistre une vue de CV
   */
  async recordCvView(cvId, cvOwnerId, viewerId) {
    const { error } = await supabase
      .from('cv_views')
      .insert({
        cv_id: cvId,
        cv_owner_id: cvOwnerId,
        viewer_id: viewerId,
      });

    if (error) console.warn('Erreur enregistrement vue CV:', error);
  },

  /**
   * Compte les vues de CV d'un utilisateur (30 derniers jours)
   */
  async getCvViewsCount(userId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('cv_views')
      .select('*', { count: 'exact', head: true })
      .eq('cv_owner_id', userId)
      .gte('viewed_at', thirtyDaysAgo);

    if (error) {
      console.warn('Erreur comptage vues CV:', error);
      return 0;
    }
    return count || 0;
  },

  // ==========================================
  // PARTAGE CV DANS CONVERSATION
  // ==========================================

  /**
   * Partage le CV dans un match (mode non-anonyme pour le destinataire)
   * @param {string} matchId - ID du match
   * @param {string} userId - ID du candidat
   * @param {string} cvId - ID du CV à partager (optionnel, sinon CV par défaut)
   */
  async shareInMatch(matchId, userId, cvId = null) {
    const { data, error } = await supabase.rpc('share_cv_in_match', {
      p_match_id: matchId,
      p_user_id: userId,
      p_cv_id: cvId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Révoque le partage du CV dans un match
   * @param {string} matchId - ID du match
   * @param {string} userId - ID du candidat
   */
  async unshareInMatch(matchId, userId) {
    const { data, error } = await supabase.rpc('unshare_cv_in_match', {
      p_match_id: matchId,
      p_user_id: userId,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Vérifie si le CV est partagé dans un match
   * @param {string} matchId - ID du match
   */
  async isSharedInMatch(matchId) {
    const { data, error } = await supabase
      .from('matches')
      .select('cv_shared, shared_cv_id, cv_shared_at')
      .eq('id', matchId)
      .single();

    if (error) throw error;
    return {
      isShared: data?.cv_shared || false,
      cvId: data?.shared_cv_id,
      sharedAt: data?.cv_shared_at,
    };
  },

  /**
   * Récupère le CV partagé pour un employeur (mode complet)
   * @param {string} matchId - ID du match
   * @param {string} viewerId - ID de l'employeur qui consulte
   */
  async getSharedCvForEmployer(matchId, viewerId) {
    // Vérifier que le CV est partagé
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        cv_shared,
        shared_cv_id,
        candidate_id,
        job_offers (pharmacy_owner_id),
        internship_offers (pharmacy_owner_id)
      `)
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;

    // Vérifier que le viewer est l'employeur
    const employerId = match.job_offers?.pharmacy_owner_id || match.internship_offers?.pharmacy_owner_id;
    if (employerId !== viewerId) {
      throw new Error('Non autorisé');
    }

    if (!match.cv_shared) {
      return null;
    }

    // Récupérer le CV (complet ou par défaut)
    let cv;
    if (match.shared_cv_id) {
      cv = await this.getById(match.shared_cv_id);
    } else {
      cv = await this.getDefault(match.candidate_id);
    }

    if (!cv) return null;

    // Retourner le CV en mode complet (non anonymisé)
    return {
      ...cv,
      _viewMode: 'full',
      _canSeePdf: true,
    };
  },
};