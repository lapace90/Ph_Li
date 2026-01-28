/**
 * Service de logging pour le panel admin
 * Enregistre les événements importants dans admin_logs
 */

import { supabase } from '../lib/supabase';

// ============================================
// SERVICE PRINCIPAL
// ============================================

const log = async (category, action, options = {}) => {
  const {
    userId = null,
    targetId = null,
    targetType = null,
    message,
    metadata = {},
    severity = 'info',
  } = options;

  try {
    await supabase.from('admin_logs').insert({
      category,
      action,
      severity,
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      message,
      metadata,
    });
  } catch (error) {
    // Silencieux - le logging ne doit pas bloquer l'app
    console.error('[LogService] Erreur:', error.message);
  }
};

// ============================================
// HELPERS PAR CATÉGORIE
// ============================================

export const logService = {
  // Méthode générique
  log,

  // ----------------------------------------
  // AUTH
  // ----------------------------------------
  auth: {
    signup: (userId, email, userType) =>
      log('auth', 'signup', {
        userId,
        message: `Nouvelle inscription: ${email} (${userType})`,
        metadata: { email, userType },
      }),

    login: (userId, email) =>
      log('auth', 'login', {
        userId,
        message: `Connexion: ${email}`,
        metadata: { email },
      }),

    loginFailed: (email, reason) =>
      log('auth', 'login_failed', {
        severity: 'warning',
        message: `Échec connexion: ${email}`,
        metadata: { email, reason },
      }),

    logout: (userId, email) =>
      log('auth', 'logout', {
        userId,
        message: `Déconnexion: ${email}`,
      }),

    passwordReset: (email) =>
      log('auth', 'password_reset', {
        message: `Demande reset mot de passe: ${email}`,
        metadata: { email },
      }),

    accountDeleted: (userId, email) =>
      log('auth', 'account_deleted', {
        severity: 'warning',
        userId,
        message: `Compte supprimé: ${email}`,
        metadata: { email },
      }),

    passwordChanged: (userId, email) =>
      log('auth', 'password_changed', {
        userId,
        message: `Mot de passe modifié: ${email}`,
        metadata: { email },
      }),

    passwordResetRequested: (email) =>
      log('auth', 'password_reset_requested', {
        message: `Demande de réinitialisation: ${email}`,
        metadata: { email },
      }),
  },

  // ----------------------------------------
  // VERIFICATION (SIRET/RPPS)
  // ----------------------------------------
  verification: {
    siretVerified: (userId, siret, companyName) =>
      log('verification', 'siret_verified', {
        userId,
        message: `SIRET vérifié: ${siret} - ${companyName}`,
        metadata: { siret, companyName },
      }),

    siretRejected: (userId, siret, reason) =>
      log('verification', 'siret_rejected', {
        severity: 'warning',
        userId,
        message: `SIRET rejeté: ${siret}`,
        metadata: { siret, reason },
      }),

    rppsVerified: (userId, rpps) =>
      log('verification', 'rpps_verified', {
        userId,
        message: `RPPS vérifié: ${rpps}`,
        metadata: { rpps },
      }),

    rppsRejected: (userId, rpps, reason) =>
      log('verification', 'rpps_rejected', {
        severity: 'warning',
        userId,
        message: `RPPS rejeté: ${rpps}`,
        metadata: { rpps, reason },
      }),
  },

  // ----------------------------------------
  // REPORTS (Signalements)
  // ----------------------------------------
  report: {
    created: (userId, reportedUserId, reason, category) =>
      log('report', 'report_created', {
        severity: 'warning',
        userId,
        targetId: reportedUserId,
        targetType: 'user',
        message: `Signalement: ${reason}`,
        metadata: { reportedUserId, reason, category },
      }),

    userBlocked: (blockedUserId, blockedEmail, adminNote) =>
      log('report', 'user_blocked', {
        severity: 'critical',
        targetId: blockedUserId,
        targetType: 'user',
        message: `Utilisateur bloqué: ${blockedEmail}`,
        metadata: { blockedEmail, adminNote },
      }),

    userUnblocked: (userId, email) =>
      log('report', 'user_unblocked', {
        targetId: userId,
        targetType: 'user',
        message: `Utilisateur débloqué: ${email}`,
      }),
  },

  // ----------------------------------------
  // MISSIONS
  // ----------------------------------------
  mission: {
    created: (userId, missionId, title, missionType) =>
      log('mission', 'mission_created', {
        userId,
        targetId: missionId,
        targetType: 'mission',
        message: `Mission créée: ${title}`,
        metadata: { title, missionType },
      }),

    published: (userId, missionId, title) =>
      log('mission', 'mission_published', {
        userId,
        targetId: missionId,
        targetType: 'mission',
        message: `Mission publiée: ${title}`,
      }),

    confirmed: (userId, missionId, animatorId, title) =>
      log('mission', 'mission_confirmed', {
        userId,
        targetId: missionId,
        targetType: 'mission',
        message: `Mission confirmée: ${title}`,
        metadata: { animatorId },
      }),

    completed: (userId, missionId, title) =>
      log('mission', 'mission_completed', {
        userId,
        targetId: missionId,
        targetType: 'mission',
        message: `Mission terminée: ${title}`,
      }),

    cancelled: (userId, missionId, title, reason) =>
      log('mission', 'mission_cancelled', {
        severity: 'warning',
        userId,
        targetId: missionId,
        targetType: 'mission',
        message: `Mission annulée: ${title}`,
        metadata: { reason },
      }),
  },

  // ----------------------------------------
  // LISTINGS (Marketplace pharmacies)
  // ----------------------------------------
  listing: {
    created: (userId, listingId, title, type) =>
      log('listing', 'listing_created', {
        userId,
        targetId: listingId,
        targetType: 'listing',
        message: `Annonce créée: ${title} (${type})`,
        metadata: { title, type },
      }),

    closed: (userId, listingId, title) =>
      log('listing', 'listing_closed', {
        userId,
        targetId: listingId,
        targetType: 'listing',
        message: `Annonce fermée: ${title}`,
      }),
  },

  // ----------------------------------------
  // INTERNSHIPS (Stages)
  // ----------------------------------------
  internship: {
    created: (userId, offerId, title, type) =>
      log('internship', 'internship_created', {
        userId,
        targetId: offerId,
        targetType: 'internship',
        message: `Offre ${type} créée: ${title}`,
        metadata: { title, type },
      }),

    applied: (userId, offerId, offerTitle) =>
      log('internship', 'internship_applied', {
        userId,
        targetId: offerId,
        targetType: 'internship',
        message: `Candidature stage: ${offerTitle}`,
      }),
  },

  // ----------------------------------------
  // SUBSCRIPTIONS (Abonnements)
  // ----------------------------------------
  subscription: {
    started: (userId, tier, email) =>
      log('subscription', 'subscription_started', {
        userId,
        message: `Abonnement démarré: ${tier}`,
        metadata: { tier, email },
      }),

    upgraded: (userId, fromTier, toTier) =>
      log('subscription', 'subscription_upgraded', {
        userId,
        message: `Upgrade: ${fromTier} → ${toTier}`,
        metadata: { fromTier, toTier },
      }),

    cancelled: (userId, tier, reason) =>
      log('subscription', 'subscription_cancelled', {
        severity: 'warning',
        userId,
        message: `Abonnement annulé: ${tier}`,
        metadata: { tier, reason },
      }),
  },

  // ----------------------------------------
  // ERRORS
  // ----------------------------------------
  error: {
    api: (userId, endpoint, errorMessage) =>
      log('error', 'api_error', {
        severity: 'error',
        userId,
        message: `Erreur API: ${endpoint}`,
        metadata: { endpoint, error: errorMessage },
      }),

    payment: (userId, errorMessage, amount) =>
      log('error', 'payment_error', {
        severity: 'error',
        userId,
        message: `Erreur paiement`,
        metadata: { error: errorMessage, amount },
      }),

    critical: (message, metadata = {}) =>
      log('error', 'critical_error', {
        severity: 'critical',
        message,
        metadata,
      }),
  },

  // ----------------------------------------
  // MESSAGING
  // ----------------------------------------
  messaging: {
    conversationStarted: (userId, otherUserId) =>
      log('messaging', 'conversation_started', {
        userId,
        targetId: otherUserId,
        targetType: 'user',
        message: `Nouvelle conversation`,
      }),

    messageReported: (userId, messageId, reason) =>
      log('messaging', 'message_reported', {
        severity: 'warning',
        userId,
        targetId: messageId,
        targetType: 'message',
        message: `Message signalé: ${reason}`,
        metadata: { reason },
      }),
  },
};

export default logService;
