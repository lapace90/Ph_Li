import { supabase } from '../lib/supabase';
import { subscriptionService } from './subscriptionService';
import { matchingService } from './matchingService';
import { blockService } from './blockService';

/**
 * Service de matching pour Animateurs ↔ Laboratoires
 */
export const animatorMatchingService = {
  // ==========================================
  // SWIPES
  // ==========================================

  /**
   * Animateur swipe sur une mission
   */
  async animatorSwipeMission(animatorId, missionId, action) {
    const isSuperLike = action === 'superlike';
    const now = new Date().toISOString();

    const { data: swipe, error: swipeError } = await supabase
      .from('swipes')
      .upsert({
        user_id: animatorId,
        target_type: 'mission',
        target_id: missionId,
        action,
        is_super_like: isSuperLike,
        super_liked_at: isSuperLike ? now : null,
        created_at: now,
      }, { onConflict: 'user_id,target_type,target_id' })
      .select()
      .single();

    if (swipeError) throw swipeError;

    if (isSuperLike) {
      try {
        await subscriptionService.incrementSuperLikes(animatorId);
        await matchingService._notifySuperLike(animatorId, 'mission', missionId);
      } catch (e) {
        console.warn('Failed to process super like:', e);
      }
    }

    if (action === 'like' || isSuperLike) {
      const match = await this.checkAnimatorMatch(animatorId, missionId, isSuperLike);
      return { swipe, match };
    }

    return { swipe, match: null };
  },

  /**
   * Labo swipe sur un animateur (pour une mission spécifique)
   */
  async laboratorySwipeAnimator(laboratoryId, animatorId, missionId, action) {
    const isSuperLike = action === 'superlike';
    const now = new Date().toISOString();

    const { data: swipe, error: swipeError } = await supabase
      .from('swipes')
      .upsert({
        user_id: laboratoryId,
        target_type: 'animator',
        target_id: animatorId,
        action,
        is_super_like: isSuperLike,
        super_liked_at: isSuperLike ? now : null,
        created_at: now,
      }, { onConflict: 'user_id,target_type,target_id' })
      .select()
      .single();

    if (swipeError) throw swipeError;

    if (isSuperLike) {
      try {
        await subscriptionService.incrementSuperLikes(laboratoryId);
        await matchingService._notifySuperLike(laboratoryId, 'animator', animatorId);
      } catch (e) {
        console.warn('Failed to process super like:', e);
      }
    }

    if (action === 'like' || isSuperLike) {
      const match = await this.checkLaboratoryMatch(laboratoryId, animatorId, missionId, isSuperLike);
      return { swipe, match };
    }

    return { swipe, match: null };
  },

  /**
   * Vérifie si un match existe côté animateur
   */
  async checkAnimatorMatch(animatorId, missionId, isSuperLike = false) {
    const { data: mission } = await supabase
      .from('animation_missions')
      .select('client_id')
      .eq('id', missionId)
      .single();

    if (!mission) return null;

    const { data: labSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('user_id', mission.client_id)
      .eq('target_type', 'animator')
      .eq('target_id', animatorId)
      .in('action', ['like', 'superlike'])
      .maybeSingle();

    if (labSwipe) {
      return await this.createMatch(missionId, animatorId, mission.client_id, true, true, isSuperLike || labSwipe.is_super_like);
    }

    return await this.createMatch(missionId, animatorId, mission.client_id, true, false, isSuperLike);
  },

  /**
   * Vérifie si un match existe côté labo
   */
  async checkLaboratoryMatch(laboratoryId, animatorId, missionId, isSuperLike = false) {
    const { data: animatorSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('user_id', animatorId)
      .eq('target_type', 'mission')
      .eq('target_id', missionId)
      .in('action', ['like', 'superlike'])
      .maybeSingle();

    if (animatorSwipe) {
      return await this.createMatch(missionId, animatorId, laboratoryId, true, true, isSuperLike || animatorSwipe.is_super_like);
    }

    return await this.createMatch(missionId, animatorId, laboratoryId, false, true, isSuperLike);
  },

  /**
   * Crée ou met à jour un match
   */
  async createMatch(missionId, animatorId, laboratoryId, animatorLiked, laboratoryLiked, isSuperLike = false) {
    const isMatched = animatorLiked && laboratoryLiked;

    const { data, error } = await supabase
      .from('animator_matches')
      .upsert({
        mission_id: missionId,
        animator_id: animatorId,
        laboratory_id: laboratoryId,
        animator_liked: animatorLiked,
        laboratory_liked: laboratoryLiked,
        is_super_like: isSuperLike,
        status: isMatched ? 'matched' : 'pending',
        matched_at: isMatched ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'mission_id,animator_id' })
      .select()
      .single();

    if (error) throw error;

    // Enrichir manuellement
    if (data) {
      const { data: mission } = await supabase
        .from('animation_missions')
        .select('*')
        .eq('id', missionId)
        .single();
      data.mission = mission;

      const { data: animator } = await supabase
        .from('animator_profiles')
        .select('*, profile:profiles(*)')
        .eq('id', animatorId)
        .single();
      data.animator = animator;

      const { data: laboratory } = await supabase
        .from('laboratory_profiles')
        .select('*')
        .eq('id', laboratoryId)
        .single();
      data.laboratory = laboratory;
    }

    return data;
  },

  // ==========================================
  // RÉCUPÉRATION DES CARTES SWIPABLES
  // ==========================================

  /**
   * Missions swipables pour un animateur
   */
  async getSwipeableMissions(animatorId, filters = {}) {
    // IDs déjà swipés
    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', animatorId)
      .eq('target_type', 'mission');

    const excludeIds = swipedIds?.map(s => s.target_id) || [];

    // Récupérer les utilisateurs bloqués
    let blockedUserIds = [];
    try {
      blockedUserIds = await blockService.getBlockedUserIdsSimple(animatorId);
    } catch (e) {
      console.warn('Could not fetch blocked users:', e);
    }

    // Profil animateur pour filtres
    const { data: animatorProfile } = await supabase
      .from('animator_profiles')
      .select('mobility_zones, animation_specialties, daily_rate_min')
      .eq('id', animatorId)
      .single();

    let query = supabase
      .from('animation_missions')
      .select('*')
      .eq('status', 'open')
      .is('animator_id', null);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Exclure les missions des utilisateurs bloqués
    if (blockedUserIds.length > 0) {
      query = query.not('client_id', 'in', `(${blockedUserIds.join(',')})`);
    }

    if (animatorProfile?.mobility_zones?.length > 0 && !filters.ignoreLocation) {
      query = query.in('region', animatorProfile.mobility_zones);
    }

    if (animatorProfile?.daily_rate_min) {
      query = query.gte('daily_rate_max', animatorProfile.daily_rate_min);
    }

    query = query.order('created_at', { ascending: false }).limit(filters.limit || 50);

    const { data, error } = await query;
    if (error) throw error;

    // Enrichir avec client_profile selon client_type
    const missions = data || [];
    for (const mission of missions) {
      if (mission.client_type === 'laboratory') {
        const { data: lab } = await supabase
          .from('laboratory_profiles')
          .select('id, company_name, brand_name, logo_url, verified')
          .eq('id', mission.client_id)
          .single();
        mission.client_profile = lab;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, photo_url')
          .eq('id', mission.client_id)
          .single();
        mission.client_profile = profile;
      }
    }

    return this.shuffleArray(missions);
  },

  /**
   * Animateurs swipables pour un labo (par mission)
   */
  async getSwipeableAnimators(laboratoryId, missionId, filters = {}) {
    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', laboratoryId)
      .eq('target_type', 'animator');

    const excludeIds = swipedIds?.map(s => s.target_id) || [];

    // Ajouter les utilisateurs bloqués aux exclusions
    try {
      const blockedUserIds = await blockService.getBlockedUserIdsSimple(laboratoryId);
      excludeIds.push(...blockedUserIds);
    } catch (e) {
      console.warn('Could not fetch blocked users:', e);
    }

    const { data: mission } = await supabase
      .from('animation_missions')
      .select('*')
      .eq('id', missionId)
      .single();

    let query = supabase
      .from('animator_profiles')
      .select('*, profile:profiles!animator_profiles_id_fkey(*)');

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    if (filters.availableOnly) {
      query = query.eq('available_now', true);
    }

    if (mission?.specialties_required?.length > 0) {
      query = query.overlaps('animation_specialties', mission.specialties_required);
    }

    if (mission?.region) {
      query = query.contains('mobility_zones', [mission.region]);
    }

    if (mission?.daily_rate_max) {
      query = query.lte('daily_rate_min', mission.daily_rate_max);
    }

    query = query.limit(filters.limit || 50);

    const { data, error } = await query;
    if (error) throw error;

    const animators = (data || []).map(a => ({
      ...a,
      matchScore: this.calculateMatchScore(a, mission),
    }));

    animators.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return animators;
  },

  /**
   * Calcule un score de matching animateur/mission
   */
  calculateMatchScore(animator, mission) {
    if (!animator || !mission) return 0;

    let score = 50;

    const commonSpecialties = (animator.animation_specialties || [])
      .filter(s => (mission.specialties_required || []).includes(s));
    score += commonSpecialties.length * 10;

    if (animator.available_now) score += 10;

    if (animator.average_rating) {
      score += animator.average_rating * 2;
    }

    if (animator.missions_completed) {
      score += Math.min(animator.missions_completed, 10);
    }

    return Math.min(score, 100);
  },

  // ==========================================
  // MATCHS
  // ==========================================

  /**
   * Récupère les matchs d'un animateur
   */
  async getAnimatorMatches(animatorId) {
    const { data, error } = await supabase
      .from('animator_matches')
      .select('*')
      .eq('animator_id', animatorId)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false });

    if (error) throw error;

    for (const match of data || []) {
      const { data: mission } = await supabase
        .from('animation_missions')
        .select('*')
        .eq('id', match.mission_id)
        .single();
      match.mission = mission;

      const { data: lab } = await supabase
        .from('laboratory_profiles')
        .select('*')
        .eq('id', match.laboratory_id)
        .single();
      match.laboratory = lab;
    }

    return data || [];
  },

  /**
   * Récupère les matchs d'un labo
   */
  async getLaboratoryMatches(laboratoryId) {
    const { data, error } = await supabase
      .from('animator_matches')
      .select('*')
      .eq('laboratory_id', laboratoryId)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false });

    if (error) throw error;

    for (const match of data || []) {
      const { data: mission } = await supabase
        .from('animation_missions')
        .select('*')
        .eq('id', match.mission_id)
        .single();
      match.mission = mission;

      const { data: animator } = await supabase
        .from('animator_profiles')
        .select('*, profile:profiles(*)')
        .eq('id', match.animator_id)
        .single();
      match.animator = animator;
    }

    return data || [];
  },

  // ==========================================
  // UTILITAIRES
  // ==========================================

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
};