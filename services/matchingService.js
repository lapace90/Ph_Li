import { supabase } from '../lib/supabase';

/**
 * Service de matching - Gestion des swipes et matchs
 */
export const matchingService = {
  // ==========================================
  // SWIPES
  // ==========================================

  /**
   * Enregistre un swipe (like, dislike, superlike)
   */
  async recordSwipe(userId, targetType, targetId, action) {
    const { data, error } = await supabase
      .from('swipes')
      .upsert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        action: action,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,target_type,target_id',
      })
      .select()
      .single();

    if (error) throw error;

    // Vérifier si un match est créé
    if (action === 'like' || action === 'superlike') {
      const match = await this.checkAndCreateMatch(userId, targetType, targetId);
      return { swipe: data, match };
    }

    return { swipe: data, match: null };
  },

  /**
   * Vérifie si un match mutuel existe et le crée si nécessaire
   */
  async checkAndCreateMatch(userId, targetType, targetId) {
    // Récupérer l'offre pour avoir le pharmacy_owner_id
    const offerTable = targetType === 'job_offer' ? 'job_offers' : 'internship_offers';
    const { data: offer } = await supabase
      .from(offerTable)
      .select('pharmacy_owner_id')
      .eq('id', targetId)
      .single();

    if (!offer) return null;

    // Vérifier si l'employeur a aussi swipé like sur ce candidat
    const { data: employerSwipe } = await supabase
      .from('swipes')
      .select('*')
      .eq('user_id', offer.pharmacy_owner_id)
      .eq('target_type', 'candidate')
      .eq('target_id', userId)
      .in('action', ['like', 'superlike'])
      .maybeSingle();

    // Si l'employeur a liké le candidat, créer le match
    if (employerSwipe) {
      return await this.createMatch(userId, targetType, targetId, offer.pharmacy_owner_id);
    }

    // Sinon, créer un match en attente (candidat a liké, mais pas encore l'employeur)
    return await this.createPendingMatch(userId, targetType, targetId);
  },

  /**
   * Crée un match confirmé (les deux parties ont liké)
   */
  async createMatch(candidateId, targetType, targetId, employerId) {
    const matchData = {
      candidate_id: candidateId,
      candidate_liked: true,
      employer_liked: true,
      matched_at: new Date().toISOString(),
      status: 'matched',
    };

    // Ajouter la bonne foreign key selon le type
    if (targetType === 'job_offer') {
      matchData.job_offer_id = targetId;
    } else {
      matchData.internship_offer_id = targetId;
    }

    // Upsert pour éviter les doublons
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
   * Crée un match en attente (une seule partie a liké)
   */
  async createPendingMatch(candidateId, targetType, targetId) {
    const matchData = {
      candidate_id: candidateId,
      candidate_liked: true,
      employer_liked: false,
      status: 'pending',
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
   */
  async recordEmployerSwipe(employerId, candidateId, jobOfferId, action) {
    const { data: swipe, error } = await supabase
      .from('swipes')
      .upsert({
        user_id: employerId,
        target_type: 'candidate',
        target_id: candidateId,
        action: action,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,target_type,target_id',
      })
      .select()
      .single();

    if (error) throw error;

    if (action === 'like' || action === 'superlike') {
      // Vérifier si le candidat avait déjà liké cette offre
      const { data: candidateSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', candidateId)
        .eq('target_type', 'job_offer')
        .eq('target_id', jobOfferId)
        .in('action', ['like', 'superlike'])
        .maybeSingle();

      if (candidateSwipe) {
        // Match mutuel !
        const match = await this.createMatch(candidateId, 'job_offer', jobOfferId, employerId);
        return { swipe, match };
      } else {
        // Mettre à jour le match en attente si existe
        await supabase
          .from('matches')
          .update({ employer_liked: true })
          .eq('job_offer_id', jobOfferId)
          .eq('candidate_id', candidateId);
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
    // D'abord récupérer les IDs déjà swipés
    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', userId)
      .eq('target_type', 'job_offer');

    const excludeIds = swipedIds?.map(s => s.target_id) || [];

    // Construire la requête
    let query = supabase
      .from('job_offers')
      .select('*')
      .eq('status', 'active');

    // Exclure les offres déjà swipées
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Filtres optionnels
    if (filters.contract_type) {
      query = query.eq('contract_type', filters.contract_type);
    }
    if (filters.position_type) {
      query = query.eq('position_type', filters.position_type);
    }
    if (filters.region) {
      query = query.eq('region', filters.region);
    }

    // Limite pour le deck de cartes
    query = query.limit(filters.limit || 20);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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

    let query = supabase
      .from('internship_offers')
      .select('*')
      .eq('status', 'active');

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
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
    return data || [];
  },

  /**
   * Récupère les candidats swipables pour un employeur
   */
  async getSwipeableCandidates(employerId, jobOfferId, filters = {}) {
    // Récupérer les candidats déjà swipés par cet employeur
    const { data: swipedIds } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', employerId)
      .eq('target_type', 'candidate');

    const excludeIds = swipedIds?.map(s => s.target_id) || [];
    excludeIds.push(employerId); // Exclure soi-même

    // Récupérer les candidats avec profil recherchable
    let query = supabase
      .from('profiles')
      .select(`
        *,
        users!inner (
          id,
          user_type,
          profile_completed
        ),
        privacy_settings (
          searchable_by_recruiters,
          profile_visibility,
          show_photo,
          show_full_name
        )
      `)
      .eq('users.profile_completed', true)
      .in('users.user_type', ['preparateur', 'pharmacien', 'etudiant']);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    if (filters.region) {
      query = query.eq('current_region', filters.region);
    }

    query = query.limit(filters.limit || 20);

    const { data, error } = await query;
    if (error) throw error;

    // Filtrer ceux qui sont searchable
    return (data || []).filter(p => 
      p.privacy_settings?.searchable_by_recruiters !== false
    );
  },

  // ==========================================
  // GESTION DES MATCHS
  // ==========================================

  /**
   * Récupère les matchs d'un candidat
   */
  async getCandidateMatches(userId) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        job_offers (
          id,
          title,
          contract_type,
          position_type,
          city,
          salary_range,
          profiles:pharmacy_owner_id (
            first_name,
            last_name,
            photo_url
          )
        ),
        internship_offers (
          id,
          title,
          type,
          city,
          duration_months,
          profiles:pharmacy_owner_id (
            first_name,
            last_name,
            photo_url
          )
        )
      `)
      .eq('candidate_id', userId)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupère les matchs d'un employeur pour une offre
   */
  async getEmployerMatches(employerId) {
    // D'abord récupérer les offres de l'employeur
    const { data: jobOffers } = await supabase
      .from('job_offers')
      .select('id')
      .eq('pharmacy_owner_id', employerId);

    const { data: internshipOffers } = await supabase
      .from('internship_offers')
      .select('id')
      .eq('pharmacy_owner_id', employerId);

    const jobIds = jobOffers?.map(j => j.id) || [];
    const internshipIds = internshipOffers?.map(i => i.id) || [];

    if (jobIds.length === 0 && internshipIds.length === 0) {
      return [];
    }

    let query = supabase
      .from('matches')
      .select(`
        *,
        profiles:candidate_id (
          id,
          first_name,
          last_name,
          photo_url,
          current_city,
          experience_years
        ),
        job_offers (
          id,
          title,
          contract_type
        ),
        internship_offers (
          id,
          title,
          type
        )
      `)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false });

    // Filtrer par offres de l'employeur
    if (jobIds.length > 0 && internshipIds.length > 0) {
      query = query.or(`job_offer_id.in.(${jobIds.join(',')}),internship_offer_id.in.(${internshipIds.join(',')})`);
    } else if (jobIds.length > 0) {
      query = query.in('job_offer_id', jobIds);
    } else {
      query = query.in('internship_offer_id', internshipIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Compte les super likes restants ce mois
   */
  async getSuperLikesRemaining(userId, maxFree = 3) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('swipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'superlike')
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;
    return Math.max(0, maxFree - (count || 0));
  },

  // ==========================================
  // SCORING (version simplifiée)
  // ==========================================

  /**
   * Calcule un score de compatibilité simple
   * TODO: Implémenter l'algorithme complet en PostgreSQL function
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