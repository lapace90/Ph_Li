import { supabase } from '../lib/supabase';

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
    // 1. Enregistrer le swipe
    const { data: swipe, error: swipeError } = await supabase
      .from('swipes')
      .upsert({
        user_id: animatorId,
        target_type: 'mission',
        target_id: missionId,
        action,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,target_type,target_id' })
      .select()
      .single();

    if (swipeError) throw swipeError;

    // 2. Si like/superlike, vérifier le match
    if (action === 'like' || action === 'superlike') {
      const match = await this.checkAnimatorMatch(animatorId, missionId);
      return { swipe, match };
    }

    return { swipe, match: null };
  },

  /**
   * Labo swipe sur un animateur (pour une mission spécifique)
   */
  async laboratorySwipeAnimator(laboratoryId, animatorId, missionId, action) {
    // 1. Enregistrer le swipe
    const { data: swipe, error: swipeError } = await supabase
      .from('swipes')
      .upsert({
        user_id: laboratoryId,
        target_type: 'animator',
        target_id: animatorId,
        action,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,target_type,target_id' })
      .select()
      .single();

    if (swipeError) throw swipeError;

    // 2. Si like/superlike, vérifier le match
    if (action === 'like' || action === 'superlike') {
      const match = await this.checkLaboratoryMatch(laboratoryId, animatorId, missionId);
      return { swipe, match };
    }

    return { swipe, match: null };
  },

  /**
   * Vérifie si un match existe côté animateur
   */
  async checkAnimatorMatch(animatorId, missionId) {
    // Récupérer la mission pour avoir le labo
    const { data: mission } = await supabase
      .from('animation_missions')
      .select('client_id')
      .eq('id', missionId)
      .single();

    if (!mission) return null;

    // Vérifier si le labo a déjà liké cet animateur
    const { data: labSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('user_id', mission.client_id)
      .eq('target_type', 'animator')
      .eq('target_id', animatorId)
      .in('action', ['like', 'superlike'])
      .maybeSingle();

    if (labSwipe) {
      // Match mutuel !
      return await this.createMatch(missionId, animatorId, mission.client_id, true, true);
    }

    // Créer/mettre à jour match en attente
    return await this.createMatch(missionId, animatorId, mission.client_id, true, false);
  },

  /**
   * Vérifie si un match existe côté labo
   */
  async checkLaboratoryMatch(laboratoryId, animatorId, missionId) {
    // Vérifier si l'animateur a déjà liké cette mission
    const { data: animatorSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('user_id', animatorId)
      .eq('target_type', 'mission')
      .eq('target_id', missionId)
      .in('action', ['like', 'superlike'])
      .maybeSingle();

    if (animatorSwipe) {
      // Match mutuel !
      return await this.createMatch(missionId, animatorId, laboratoryId, true, true);
    }

    // Créer/mettre à jour match en attente
    return await this.createMatch(missionId, animatorId, laboratoryId, false, true);
  },

  /**
   * Crée ou met à jour un match
   */
  async createMatch(missionId, animatorId, laboratoryId, animatorLiked, laboratoryLiked) {
    const isMatched = animatorLiked && laboratoryLiked;

    const { data, error } = await supabase
      .from('animator_matches')
      .upsert({
        mission_id: missionId,
        animator_id: animatorId,
        laboratory_id: laboratoryId,
        animator_liked: animatorLiked,
        laboratory_liked: laboratoryLiked,
        status: isMatched ? 'matched' : 'pending',
        matched_at: isMatched ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'mission_id,animator_id' })
      .select(`
        *,
        mission:animation_missions(*),
        animator:animator_profiles(*, profile:profiles(*)),
        laboratory:laboratory_profiles(*)
      `)
      .single();

    if (error) throw error;
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

    // Récupérer le profil animateur pour les filtres
    const { data: animatorProfile } = await supabase
      .from('animator_profiles')
      .select('mobility_zones, animation_specialties, daily_rate_min')
      .eq('id', animatorId)
      .single();

    let query = supabase
      .from('animation_missions')
      .select(`
        *,
        client_profile:laboratory_profiles!animation_missions_client_id_fkey(*)
      `)
      .eq('status', 'open')
      .is('animator_id', null);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Filtrer par région si l'animateur a des zones de mobilité
    if (animatorProfile?.mobility_zones?.length > 0 && !filters.ignoreLocation) {
      query = query.in('region', animatorProfile.mobility_zones);
    }

    // Filtrer par tarif minimum
    if (animatorProfile?.daily_rate_min) {
      query = query.gte('daily_rate', animatorProfile.daily_rate_min);
    }

    query = query.order('created_at', { ascending: false }).limit(filters.limit || 50);

    const { data, error } = await query;
    if (error) throw error;

    return this.shuffleArray(data || []);
  },

  /**
   * Animateurs swipables pour un labo (par mission)
   */
  async getSwipeableAnimators(laboratoryId, missionId, filters = {}) {
    // IDs déjà swipés par ce labo
    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', laboratoryId)
      .eq('target_type', 'animator');

    const excludeIds = swipedIds?.map(s => s.target_id) || [];

    // Récupérer la mission pour les critères
    const { data: mission } = await supabase
      .from('animation_missions')
      .select('*')
      .eq('id', missionId)
      .single();

    let query = supabase
      .from('animator_profiles')
      .select(`
        *,
        profile:profiles!animator_profiles_id_fkey(*)
      `);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Filtrer par disponibilité
    if (filters.availableOnly) {
      query = query.eq('available_now', true);
    }

    // Filtrer par spécialités requises
    if (mission?.specialties_required?.length > 0) {
      query = query.overlaps('animation_specialties', mission.specialties_required);
    }

    // Filtrer par région
    if (mission?.region) {
      query = query.contains('mobility_zones', [mission.region]);
    }

    // Filtrer par tarif max
    if (mission?.daily_rate) {
      query = query.lte('daily_rate_min', mission.daily_rate);
    }

    query = query.limit(filters.limit || 50);

    const { data, error } = await query;
    if (error) throw error;

    // Calculer les scores et trier
    const scoredAnimators = (data || []).map(animator => ({
      ...animator,
      matchScore: this.calculateAnimatorScore(animator, mission),
    }));

    scoredAnimators.sort((a, b) => b.matchScore - a.matchScore);

    return scoredAnimators;
  },

  /**
   * Calcule un score de compatibilité animateur/mission
   */
  calculateAnimatorScore(animator, mission) {
    let score = 0;

    // Spécialités correspondantes (40%)
    if (mission?.specialties_required?.length > 0 && animator.animation_specialties?.length > 0) {
      const matchingSpecs = mission.specialties_required.filter(s => 
        animator.animation_specialties.includes(s)
      );
      score += (matchingSpecs.length / mission.specialties_required.length) * 40;
    } else {
      score += 20; // Pas de spécialité requise = bonus
    }

    // Tarif dans la fourchette (25%)
    if (animator.daily_rate_min && animator.daily_rate_max && mission?.daily_rate) {
      if (mission.daily_rate >= animator.daily_rate_min && mission.daily_rate <= animator.daily_rate_max) {
        score += 25;
      } else if (mission.daily_rate >= animator.daily_rate_min) {
        score += 15;
      }
    }

    // Disponibilité immédiate (15%)
    if (animator.available_now) {
      score += 15;
    }

    // Expérience (missions complétées) (10%)
    if (animator.missions_completed >= 10) score += 10;
    else if (animator.missions_completed >= 5) score += 7;
    else if (animator.missions_completed >= 1) score += 4;

    // Note moyenne (10%)
    if (animator.average_rating >= 4.5) score += 10;
    else if (animator.average_rating >= 4) score += 7;
    else if (animator.average_rating >= 3.5) score += 4;

    return Math.round(score);
  },

  // ==========================================
  // MATCHES
  // ==========================================

  /**
   * Récupère les matches d'un animateur
   */
  async getAnimatorMatches(animatorId, status = 'matched') {
    const { data, error } = await supabase
      .from('animator_matches')
      .select(`
        *,
        mission:animation_missions(*),
        laboratory:laboratory_profiles(*)
      `)
      .eq('animator_id', animatorId)
      .eq('status', status)
      .order('matched_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère les matches d'un labo
   */
  async getLaboratoryMatches(laboratoryId, status = 'matched') {
    const { data, error } = await supabase
      .from('animator_matches')
      .select(`
        *,
        mission:animation_missions(*),
        animator:animator_profiles(*, profile:profiles(*))
      `)
      .eq('laboratory_id', laboratoryId)
      .eq('status', status)
      .order('matched_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère un match par ID avec tous les détails
   */
  async getMatchById(matchId) {
    const { data, error } = await supabase
      .from('animator_matches')
      .select(`
        *,
        mission:animation_missions(*),
        animator:animator_profiles(*, profile:profiles(*)),
        laboratory:laboratory_profiles(*)
      `)
      .eq('id', matchId)
      .single();

    if (error) throw error;
    return data;
  },

  // ==========================================
  // HELPERS
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