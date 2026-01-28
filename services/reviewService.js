// Gestion des avis de mission

import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

export const reviewService = {
  /**
   * Verifie si un utilisateur a deja laisse un avis pour une mission
   */
  async getExistingReview(missionId, reviewerId) {
    const { data, error } = await supabase
      .from('mission_reviews')
      .select('*')
      .eq('mission_id', missionId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /**
   * Soumet un avis pour une mission
   * @param {Object} reviewData
   * @param {string} reviewData.mission_id
   * @param {string} reviewData.reviewer_id
   * @param {string} reviewData.reviewee_id
   * @param {number} reviewData.rating_overall
   * @param {string} [reviewData.comment]
   * @param {Object} reviewData.criteria - ex: { rating_punctuality: 4, ... }
   */
  async submitReview(reviewData) {
    const { criteria, ...rest } = reviewData;

    const { data, error } = await supabase
      .from('mission_reviews')
      .insert({
        ...rest,
        ...criteria,
        visible: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Vous avez deja laisse un avis pour cette mission');
      }
      throw error;
    }

    // Notifier le reviewee
    await notificationService.createNotification(
      reviewData.reviewee_id,
      'new_review',
      'Nouvel avis recu',
      `Vous avez recu un avis (${reviewData.rating_overall.toFixed(1)}/5)`,
      { missionId: reviewData.mission_id, reviewId: data.id }
    ).catch(err => console.warn('Erreur notification avis:', err));

    return data;
  },

  /**
   * Recupere les avis pour une mission
   */
  async getByMissionId(missionId) {
    const { data, error } = await supabase
      .from('mission_reviews')
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
