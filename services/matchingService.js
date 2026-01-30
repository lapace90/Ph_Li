import { supabase } from '../lib/supabase';
import { notificationService, NOTIFICATION_TYPES } from './notificationService';
import { subscriptionService } from './subscriptionService';
import { blockService } from './blockService';

/**
 * Service de matching - Gestion des swipes et matchs
 */
export const matchingService = {
  // ==========================================
  // UTILITAIRES
  // ==========================================

  /**
   * Mélange un tableau de manière aléatoire (Fisher-Yates)
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // ==========================================
  // SWIPES
  // ==========================================

  /**
   * Enregistre un swipe (like, dislike, superlike)
   * Pour les candidats swipant sur des offres (pas de context_id)
   */
  async recordSwipe(userId, targetType, targetId, action) {
    const isSuperLike = action === 'superlike';
    const now = new Date().toISOString();

    // D'abord, vérifier si un swipe existe déjà
    const { data: existingSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .is('context_id', null)
      .maybeSingle();

    let data;
    let error;

    if (existingSwipe) {
      // Mettre à jour le swipe existant
      const result = await supabase
        .from('swipes')
        .update({
          action,
          is_super_like: isSuperLike,
          super_liked_at: isSuperLike ? now : existingSwipe.super_liked_at,
        })
        .eq('id', existingSwipe.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Créer un nouveau swipe
      const result = await supabase
        .from('swipes')
        .insert({
          user_id: userId,
          target_type: targetType,
          target_id: targetId,
          context_id: null,
          action,
          is_super_like: isSuperLike,
          super_liked_at: isSuperLike ? now : null,
          created_at: now,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    // Incrémenter le compteur de super likes
    if (isSuperLike) {
      try {
        await subscriptionService.incrementSuperLikes(userId);
      } catch (e) {
        console.warn('Failed to increment super likes usage:', e);
      }

      // Notifier le destinataire
      await this._notifySuperLike(userId, targetType, targetId);
    }

    // Vérifier si un match est créé
    if (action === 'like' || isSuperLike) {
      const match = await this.checkAndCreateMatch(userId, targetType, targetId, isSuperLike);
      return { swipe: data, match };
    }

    return { swipe: data, match: null };
  },

  /**
   * Vérifie si un match mutuel existe et le crée si nécessaire
   */
  async checkAndCreateMatch(userId, targetType, targetId, isSuperLike = false) {
    // Récupérer l'offre pour avoir le pharmacy_owner_id
    const offerTable = targetType === 'job_offer' ? 'job_offers' : 'internship_offers';
    const { data: offer } = await supabase
      .from(offerTable)
      .select('pharmacy_owner_id')
      .eq('id', targetId)
      .single();

    if (!offer) return null;

    // Vérifier si l'employeur a aussi swipé like sur ce candidat POUR CETTE OFFRE SPÉCIFIQUE
    const { data: employerSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('user_id', offer.pharmacy_owner_id)
      .eq('target_type', 'candidate')
      .eq('target_id', userId)
      .eq('context_id', targetId)  // IMPORTANT: filtrer par l'offre spécifique
      .in('action', ['like', 'superlike'])
      .maybeSingle();

    // Si l'employeur a liké le candidat pour cette offre, créer le match
    if (employerSwipe) {
      return await this.createMatch(userId, targetType, targetId, offer.pharmacy_owner_id, isSuperLike || employerSwipe.is_super_like);
    }

    // Sinon, créer un match en attente (candidat a liké, mais pas encore l'employeur)
    return await this.createPendingMatch(userId, targetType, targetId, isSuperLike);
  },

  /**
   * Crée un match confirmé (les deux parties ont liké)
   */
  async createMatch(candidateId, targetType, targetId, employerId, isSuperLike = false) {
    const matchData = {
      candidate_id: candidateId,
      candidate_liked: true,
      employer_liked: true,
      matched_at: new Date().toISOString(),
      status: 'matched',
      is_super_like: isSuperLike,
    };

    if (targetType === 'job_offer') {
      matchData.job_offer_id = targetId;
    } else {
      matchData.internship_offer_id = targetId;
    }

    // D'abord, vérifier si un match existe déjà
    const existingQuery = supabase
      .from('matches')
      .select('*')
      .eq('candidate_id', candidateId);

    if (targetType === 'job_offer') {
      existingQuery.eq('job_offer_id', targetId);
    } else {
      existingQuery.eq('internship_offer_id', targetId);
    }

    const { data: existingMatch } = await existingQuery.maybeSingle();

    if (existingMatch) {
      // Mettre à jour le match existant vers 'matched'
      const { data: updated, error: updateError } = await supabase
        .from('matches')
        .update({
          candidate_liked: true,
          employer_liked: true,
          status: 'matched',
          matched_at: new Date().toISOString(),
          is_super_like: isSuperLike || existingMatch.is_super_like,
        })
        .eq('id', existingMatch.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating match:', updateError);
        throw updateError;
      }
      return updated;
    }

    // Sinon, créer un nouveau match
    const { data, error } = await supabase
      .from('matches')
      .insert(matchData)
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      throw error;
    }
    return data;
  },

  /**
   * Crée un match en attente (une seule partie a liké)
   */
  async createPendingMatch(candidateId, targetType, targetId, isSuperLike = false) {
    const matchData = {
      candidate_id: candidateId,
      candidate_liked: true,
      employer_liked: false,
      status: 'pending',
      is_super_like: isSuperLike,
    };

    if (targetType === 'job_offer') {
      matchData.job_offer_id = targetId;
    } else {
      matchData.internship_offer_id = targetId;
    }

    const { data, error } = await supabase
      .from('matches')
      .upsert(matchData, {
        onConflict: targetType === 'job_offer' 
          ? 'job_offer_id,candidate_id' 
          : 'internship_offer_id,candidate_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Enregistre le swipe d'un employeur sur un candidat
   * Stocke le context_id (offerId) pour permettre de swiper le même candidat pour différentes offres
   * @param {string} offerType - 'job_offer' ou 'internship_offer'
   */
  async recordEmployerSwipe(employerId, candidateId, offerId, action, offerType = 'job_offer') {
    const isSuperLike = action === 'superlike';
    const now = new Date().toISOString();
    const offerIdField = offerType === 'job_offer' ? 'job_offer_id' : 'internship_offer_id';

    const { data: swipeData, error } = await supabase
      .from('swipes')
      .insert({
        user_id: employerId,
        target_type: 'candidate',
        target_id: candidateId,
        context_id: offerId,
        action,
        is_super_like: isSuperLike,
        super_liked_at: isSuperLike ? now : null,
        created_at: now,
      })
      .select()
      .single();

    // Gérer les doublons - mais quand même vérifier si un match devrait exister
    let swipe = swipeData;
    if (error?.code === '23505') {
      console.log('Swipe already exists, checking for match anyway');
      // Le swipe existe déjà, on continue pour vérifier le match
      swipe = null;
    } else if (error) {
      throw error;
    }

    if (isSuperLike && swipe) {
      try {
        await subscriptionService.incrementSuperLikes(employerId);
      } catch (e) {
        console.warn('Failed to increment super likes usage:', e);
      }

      // Notifier le candidat
      await this._notifySuperLike(employerId, 'candidate', candidateId);
    }

    if (action === 'like' || isSuperLike) {
      // Vérifier si le candidat avait déjà liké cette offre
      const { data: candidateSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', candidateId)
        .eq('target_type', offerType)
        .eq('target_id', offerId)
        .in('action', ['like', 'superlike'])
        .maybeSingle();

      console.log(`Checking for candidate swipe on ${offerType}:`, { candidateId, offerId, found: !!candidateSwipe });

      if (candidateSwipe) {
        // Match mutuel !
        try {
          const match = await this.createMatch(candidateId, offerType, offerId, employerId);
          console.log('Match created:', match);
          return { swipe, match };
        } catch (matchError) {
          console.error('Error creating match:', matchError);
          // Essayer de récupérer un match existant
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('*')
            .eq(offerIdField, offerId)
            .eq('candidate_id', candidateId)
            .maybeSingle();

          if (existingMatch) {
            // Mettre à jour vers 'matched' si pas déjà fait
            if (existingMatch.status !== 'matched') {
              const { data: updatedMatch } = await supabase
                .from('matches')
                .update({
                  status: 'matched',
                  employer_liked: true,
                  matched_at: new Date().toISOString()
                })
                .eq('id', existingMatch.id)
                .select()
                .single();
              return { swipe, match: updatedMatch };
            }
            return { swipe, match: existingMatch };
          }
        }
      } else {
        // Mettre à jour le match en attente si existe
        const { data: pendingMatch } = await supabase
          .from('matches')
          .select('*')
          .eq(offerIdField, offerId)
          .eq('candidate_id', candidateId)
          .maybeSingle();

        if (pendingMatch) {
          // Si le candidat avait déjà liké → MATCH !
          if (pendingMatch.candidate_liked) {
            const { data: matchedRecord } = await supabase
              .from('matches')
              .update({
                employer_liked: true,
                status: 'matched',
                matched_at: new Date().toISOString(),
              })
              .eq('id', pendingMatch.id)
              .select()
              .single();
            console.log('Match completed from pending:', matchedRecord);
            return { swipe, match: matchedRecord };
          } else {
            // Sinon juste marquer employer_liked
            await supabase
              .from('matches')
              .update({ employer_liked: true })
              .eq('id', pendingMatch.id);
          }
        }
      }
    }

    return { swipe, match: null };
  },

  // ==========================================
  // RÉCUPÉRATION DES OFFRES SWIPABLES
  // ==========================================

  /**
   * Récupère les offres d'emploi que le candidat n'a pas encore swipées
   */
  async getSwipeableJobOffers(userId, filters = {}) {
    // Récupérer les IDs déjà swipés
    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', 'job_offer');

    const excludeIds = swipedIds?.map(s => s.target_id) || [];

    // Récupérer les utilisateurs bloqués pour filtrer leurs offres
    let blockedUserIds = [];
    try {
      blockedUserIds = await blockService.getBlockedUserIdsSimple(userId);
    } catch (e) {
      console.warn('Could not fetch blocked users:', e);
    }

    let query = supabase
      .from('job_offers')
      .select('*')
      .eq('status', 'active')
      // Exclure les offres expirées
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Exclure les offres des utilisateurs bloqués
    if (blockedUserIds.length > 0) {
      query = query.not('pharmacy_owner_id', 'in', `(${blockedUserIds.join(',')})`);
    }

    if (filters.contract_type) {
      query = query.eq('contract_type', filters.contract_type);
    }
    if (filters.position_type) {
      query = query.eq('position_type', filters.position_type);
    }
    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    query = query.limit(filters.limit || 20);

    const { data, error } = await query;
    if (error) throw error;
    
    // Mélanger pour varier l'ordre d'apparition
    return this.shuffleArray(data || []);
  },

  /**
   * Récupère les stages/alternances que l'étudiant n'a pas encore swipés
   */
  async getSwipeableInternships(userId, filters = {}) {
    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', 'internship_offer');

    const excludeIds = swipedIds?.map(s => s.target_id) || [];

    // Récupérer les utilisateurs bloqués
    let blockedUserIds = [];
    try {
      blockedUserIds = await blockService.getBlockedUserIdsSimple(userId);
    } catch (e) {
      console.warn('Could not fetch blocked users:', e);
    }

    let query = supabase
      .from('internship_offers')
      .select('*')
      .eq('status', 'active')
      // Exclure les offres expirées
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Exclure les offres des utilisateurs bloqués
    if (blockedUserIds.length > 0) {
      query = query.not('pharmacy_owner_id', 'in', `(${blockedUserIds.join(',')})`);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    query = query.limit(filters.limit || 20);

    const { data, error } = await query;
    if (error) throw error;
    
    // Mélanger pour varier l'ordre d'apparition
    return this.shuffleArray(data || []);
  },

  /**
   * Récupère les candidats swipables pour un employeur via RPC (contourne RLS)
   * Filtre par offre d'emploi spécifique pour permettre de voir les mêmes candidats sur différentes offres
   */
  async getSwipeableCandidates(employerId, jobOfferId, filters = {}) {
    const { data, error } = await supabase.rpc('get_swipeable_candidates', {
      p_employer_id: employerId,
      p_job_offer_id: jobOfferId,
      p_limit: filters.limit || 50,
    });

    if (error) {
      console.error('RPC get_swipeable_candidates error:', error);
      throw error;
    }

    return data || [];
  },

  // ==========================================
  // GESTION DES MATCHS
  // ==========================================

  /**
   * Récupère les matchs d'un candidat (CORRIGÉ - requêtes séparées)
   */
  async getCandidateMatches(userId) {
    // 1. Récupérer les matchs
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('candidate_id', userId)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false });

    if (error) throw error;
    if (!matches?.length) return [];

    // 2. Récupérer les job_offers liées
    const jobOfferIds = matches.map(m => m.job_offer_id).filter(Boolean);
    const internshipOfferIds = matches.map(m => m.internship_offer_id).filter(Boolean);

    let jobOffersMap = {};
    let internshipOffersMap = {};

    if (jobOfferIds.length > 0) {
      const { data: jobOffers } = await supabase
        .from('job_offers')
        .select('id, title, contract_type, position_type, city, salary_range, pharmacy_owner_id')
        .in('id', jobOfferIds);
      (jobOffers || []).forEach(j => { jobOffersMap[j.id] = j; });
    }

    if (internshipOfferIds.length > 0) {
      const { data: internshipOffers } = await supabase
        .from('internship_offers')
        .select('id, title, type, city, duration_months, pharmacy_owner_id')
        .in('id', internshipOfferIds);
      (internshipOffers || []).forEach(i => { internshipOffersMap[i.id] = i; });
    }

    // 3. Récupérer les profils des pharmacy_owners
    const ownerIds = [
      ...Object.values(jobOffersMap).map(j => j.pharmacy_owner_id),
      ...Object.values(internshipOffersMap).map(i => i.pharmacy_owner_id),
    ].filter(Boolean);

    let profilesMap = {};
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, photo_url')
        .in('id', ownerIds);
      (profiles || []).forEach(p => { profilesMap[p.id] = p; });
    }

    // 4. Assembler les données
    return matches.map(match => {
      const jobOffer = jobOffersMap[match.job_offer_id];
      const internshipOffer = internshipOffersMap[match.internship_offer_id];
      const offer = jobOffer || internshipOffer;
      const ownerProfile = offer ? profilesMap[offer.pharmacy_owner_id] : null;

      return {
        ...match,
        job_offers: jobOffer ? { ...jobOffer, profiles: ownerProfile } : null,
        internship_offers: internshipOffer ? { ...internshipOffer, profiles: ownerProfile } : null,
      };
    });
  },

  /**
   * Récupère les matchs d'un employeur (CORRIGÉ - requêtes séparées)
   */
  async getEmployerMatches(employerId) {
    // 1. Récupérer les offres de l'employeur
    const { data: jobOffers } = await supabase
      .from('job_offers')
      .select('id, title, contract_type')
      .eq('pharmacy_owner_id', employerId);

    const { data: internshipOffers } = await supabase
      .from('internship_offers')
      .select('id, title, type')
      .eq('pharmacy_owner_id', employerId);

    const jobIds = jobOffers?.map(j => j.id) || [];
    const internshipIds = internshipOffers?.map(i => i.id) || [];

    if (jobIds.length === 0 && internshipIds.length === 0) {
      return [];
    }

    // 2. Récupérer les matchs
    let matches = [];

    if (jobIds.length > 0) {
      const { data: jm } = await supabase
        .from('matches')
        .select('*')
        .in('job_offer_id', jobIds)
        .eq('status', 'matched')
        .order('matched_at', { ascending: false });
      matches = [...matches, ...(jm || [])];
    }

    if (internshipIds.length > 0) {
      const { data: im } = await supabase
        .from('matches')
        .select('*')
        .in('internship_offer_id', internshipIds)
        .eq('status', 'matched')
        .order('matched_at', { ascending: false });
      matches = [...matches, ...(im || [])];
    }

    if (matches.length === 0) return [];

    // 3. Récupérer les profils des candidats
    const candidateIds = [...new Set(matches.map(m => m.candidate_id).filter(Boolean))];

    let candidatesMap = {};
    if (candidateIds.length > 0) {
      const { data: candidates } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, photo_url, current_city, experience_years')
        .in('id', candidateIds);
      (candidates || []).forEach(c => { candidatesMap[c.id] = c; });
    }

    // 4. Créer les maps d'offres
    const jobOffersMap = {};
    (jobOffers || []).forEach(j => { jobOffersMap[j.id] = j; });

    const internshipOffersMap = {};
    (internshipOffers || []).forEach(i => { internshipOffersMap[i.id] = i; });

    // 5. Assembler les données
    return matches.map(match => ({
      ...match,
      profiles: candidatesMap[match.candidate_id] || null,
      job_offers: jobOffersMap[match.job_offer_id] || null,
      internship_offers: internshipOffersMap[match.internship_offer_id] || null,
    }));
  },

  /**
   * Récupère le quota de super likes (quota quotidien via subscriptionService)
   * @returns {{ remaining: number, max: number, used: number }}
   */
  async getSuperLikeQuota(userId) {
    try {
      const result = await subscriptionService.canSuperLike(userId);
      return {
        remaining: result.remaining ?? Infinity,
        max: result.max ?? Infinity,
        used: result.used ?? 0,
        allowed: result.allowed,
        unlimited: result.max === null || result.max === Infinity,
      };
    } catch {
      // Fallback si subscriptionService non disponible
      return { remaining: 3, max: 3, used: 0, allowed: true, unlimited: false };
    }
  },

  /**
   * @deprecated Utiliser getSuperLikeQuota à la place
   */
  async getSuperLikesRemaining(userId) {
    const quota = await this.getSuperLikeQuota(userId);
    return quota.remaining;
  },

  /**
   * Envoie une notification de super like au destinataire
   */
  async _notifySuperLike(senderId, targetType, targetId) {
    try {
      // Récupérer le nom de l'expéditeur
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', senderId)
        .single();

      const senderName = senderProfile
        ? `${senderProfile.first_name} ${senderProfile.last_name?.[0] || ''}.`
        : 'Quelqu\'un';

      // Déterminer le destinataire
      let recipientId = null;

      if (targetType === 'candidate' || targetType === 'animator') {
        recipientId = targetId;
      } else if (targetType === 'job_offer') {
        const { data: offer } = await supabase
          .from('job_offers')
          .select('pharmacy_owner_id')
          .eq('id', targetId)
          .single();
        recipientId = offer?.pharmacy_owner_id;
      } else if (targetType === 'internship_offer') {
        const { data: offer } = await supabase
          .from('internship_offers')
          .select('pharmacy_owner_id')
          .eq('id', targetId)
          .single();
        recipientId = offer?.pharmacy_owner_id;
      } else if (targetType === 'mission') {
        const { data: mission } = await supabase
          .from('animation_missions')
          .select('client_id')
          .eq('id', targetId)
          .single();
        recipientId = mission?.client_id;
      }

      if (recipientId) {
        await notificationService.createNotification(
          recipientId,
          NOTIFICATION_TYPES.SUPER_LIKE,
          'Super Like recu !',
          `${senderName} vous a envoye un Super Like !`,
          { sender_id: senderId, target_type: targetType, target_id: targetId }
        );
      }
    } catch (e) {
      console.warn('Failed to send super like notification:', e);
    }
  },

  // ==========================================
  // SCORING (version simplifiée)
  // ==========================================

  /**
   * Calcule un score de compatibilité simple
   */
  calculateMatchScore(candidate, offer) {
    let score = 0;
    let factors = 0;

    // Distance (si disponible) - 25%
    if (candidate.current_region && offer.region) {
      if (candidate.current_region === offer.region) {
        score += 25;
      } else if (candidate.preferred_regions?.includes(offer.region)) {
        score += 15;
      }
      factors++;
    }

    // Type de contrat - 20%
    if (candidate.preferred_contract_types && offer.contract_type) {
      if (candidate.preferred_contract_types.includes(offer.contract_type)) {
        score += 20;
      }
      factors++;
    }

    // Expérience - 20%
    if (candidate.experience_years !== undefined && offer.required_experience !== undefined) {
      if (candidate.experience_years >= offer.required_experience) {
        score += 20;
      } else if (candidate.experience_years >= offer.required_experience - 1) {
        score += 10;
      }
      factors++;
    }

    // Disponibilité - 10%
    if (candidate.availability_date) {
      const availDate = new Date(candidate.availability_date);
      const startDate = offer.start_date ? new Date(offer.start_date) : new Date();
      if (availDate <= startDate) {
        score += 10;
      }
      factors++;
    }

    // Normaliser si pas tous les facteurs
    if (factors > 0 && factors < 4) {
      score = Math.round((score / (factors * 25)) * 100);
    }

    return Math.min(100, Math.max(0, score));
  },
};