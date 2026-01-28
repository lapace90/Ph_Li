// Service pour les signalements utilisateurs

import { supabase } from '../lib/supabase';
import { logService } from './logService';

// Raisons de signalement disponibles
export const REPORT_REASONS = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  INAPPROPRIATE: 'inappropriate',
  FAKE_PROFILE: 'fake_profile',
  SCAM: 'scam',
  OTHER: 'other',
};

// Labels français pour les raisons
export const REPORT_REASON_LABELS = {
  [REPORT_REASONS.SPAM]: 'Spam ou publicité',
  [REPORT_REASONS.HARASSMENT]: 'Harcèlement ou intimidation',
  [REPORT_REASONS.INAPPROPRIATE]: 'Contenu inapproprié',
  [REPORT_REASONS.FAKE_PROFILE]: 'Faux profil ou usurpation',
  [REPORT_REASONS.SCAM]: 'Arnaque ou fraude',
  [REPORT_REASONS.OTHER]: 'Autre raison',
};

// Types de contenu signalables
export const REPORT_CONTENT_TYPES = {
  PROFILE: 'profile',
  JOB_OFFER: 'job_offer',
  INTERNSHIP_OFFER: 'internship_offer',
  MISSION: 'mission',
  MESSAGE: 'message',
  LABORATORY_POST: 'laboratory_post',
  CV: 'cv',
  URGENT_ALERT: 'urgent_alert',
  PHARMACY_LISTING: 'pharmacy_listing',
};

// Statuts de signalement
export const REPORT_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};

export const reportService = {
  // ==========================================
  // CRÉATION DE SIGNALEMENT
  // ==========================================

  /**
   * Signaler un utilisateur
   * @param {string} reporterId - ID du signaleur
   * @param {string} reportedUserId - ID de l'utilisateur signalé
   * @param {string} reason - Raison (REPORT_REASONS)
   * @param {string} description - Description optionnelle
   */
  async reportUser(reporterId, reportedUserId, reason, description = null) {
    if (reporterId === reportedUserId) {
      throw new Error('Vous ne pouvez pas vous signaler vous-même');
    }

    const { data, error } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        reported_content_type: REPORT_CONTENT_TYPES.PROFILE,
        reason,
        description,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Vous avez déjà signalé cet utilisateur');
      }
      throw error;
    }

    // Log le signalement
    logService.report.created(reporterId, reportedUserId, REPORT_REASON_LABELS[reason] || reason, 'profile');

    return data;
  },

  /**
   * Signaler un contenu spécifique
   * @param {string} reporterId - ID du signaleur
   * @param {string} contentType - Type de contenu (REPORT_CONTENT_TYPES)
   * @param {string} contentId - ID du contenu
   * @param {string} contentOwnerId - ID du propriétaire du contenu (optionnel)
   * @param {string} reason - Raison
   * @param {string} description - Description optionnelle
   */
  async reportContent(reporterId, contentType, contentId, contentOwnerId, reason, description = null) {
    if (reporterId === contentOwnerId) {
      throw new Error('Vous ne pouvez pas signaler votre propre contenu');
    }

    const { data, error } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: contentOwnerId,
        reported_content_type: contentType,
        reported_content_id: contentId,
        reason,
        description,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Vous avez déjà signalé ce contenu');
      }
      throw error;
    }

    // Log le signalement
    logService.report.created(reporterId, contentOwnerId, REPORT_REASON_LABELS[reason] || reason, contentType);

    return data;
  },

  // ==========================================
  // LECTURE
  // ==========================================

  /**
   * Récupérer les signalements envoyés par un utilisateur
   */
  async getMyReports(userId) {
    const { data, error } = await supabase
      .from('user_reports')
      .select('*')
      .eq('reporter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Vérifier si un utilisateur a déjà signalé un autre utilisateur
   */
  async hasReportedUser(reporterId, reportedUserId) {
    const { data, error } = await supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', reporterId)
      .eq('reported_user_id', reportedUserId)
      .eq('status', REPORT_STATUS.PENDING)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  /**
   * Vérifier si un contenu a déjà été signalé par l'utilisateur
   */
  async hasReportedContent(reporterId, contentType, contentId) {
    const { data, error } = await supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', reporterId)
      .eq('reported_content_type', contentType)
      .eq('reported_content_id', contentId)
      .eq('status', REPORT_STATUS.PENDING)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // ==========================================
  // ADMIN (pour ton panel Vue.js)
  // ==========================================

  /**
   * Récupérer tous les signalements (admin)
   * Note: Nécessite des droits admin côté RLS
   */
  async getAllReports(filters = {}) {
    let query = supabase
      .from('user_reports')
      .select(`
        *,
        reporter:profiles!reporter_id(first_name, last_name, photo_url),
        reported_user:profiles!reported_user_id(first_name, last_name, photo_url)
      `)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.reason) {
      query = query.eq('reason', filters.reason);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Mettre à jour le statut d'un signalement (admin)
   */
  async updateReportStatus(reportId, status, reviewerId, resolution = null, resolutionNotes = null) {
    const updateData = {
      status,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    };

    if (resolution) {
      updateData.resolution = resolution;
    }
    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes;
    }

    const { data, error } = await supabase
      .from('user_reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Compter les signalements par statut (admin dashboard)
   */
  async getReportCounts() {
    const { data, error } = await supabase
      .from('user_reports')
      .select('status')
      .then(({ data, error }) => {
        if (error) throw error;
        const counts = {
          pending: 0,
          reviewing: 0,
          resolved: 0,
          dismissed: 0,
          total: data?.length || 0,
        };
        data?.forEach(r => {
          if (counts[r.status] !== undefined) {
            counts[r.status]++;
          }
        });
        return { data: counts, error: null };
      });

    if (error) throw error;
    return data;
  },

  /**
   * Compter les signalements contre un utilisateur spécifique
   */
  async getReportCountForUser(userId) {
    const { count, error } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact', head: true })
      .eq('reported_user_id', userId);

    if (error) throw error;
    return count || 0;
  },
};
