// Mock supabase client
jest.mock('./lib/supabase', () => {
  const mockChain = () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    supabase: {
      from: jest.fn(mockChain),
      auth: {
        startAutoRefresh: jest.fn(),
        stopAutoRefresh: jest.fn(),
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      },
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

// Mock notification service
jest.mock('./services/notificationService', () => ({
  notificationService: {
    createNotification: jest.fn().mockResolvedValue({}),
  },
  NOTIFICATION_TYPES: {
    SUPER_LIKE: 'super_like',
    MATCH: 'match',
  },
}));

// Mock subscription service
jest.mock('./services/subscriptionService', () => ({
  subscriptionService: {
    getLimits: jest.fn().mockResolvedValue({
      limits: { favorites: 3 },
      userType: 'laboratoire',
      tier: 'free',
    }),
  },
}));

// Mock log service (pour les services qui l'utilisent)
jest.mock('./services/logService', () => ({
  logService: {
    log: jest.fn(),
    auth: {
      signup: jest.fn(),
      login: jest.fn(),
      loginFailed: jest.fn(),
      logout: jest.fn(),
      passwordReset: jest.fn(),
      accountDeleted: jest.fn(),
      passwordChanged: jest.fn(),
      passwordResetRequested: jest.fn(),
    },
    verification: {
      siretVerified: jest.fn(),
      siretRejected: jest.fn(),
      rppsVerified: jest.fn(),
      rppsRejected: jest.fn(),
    },
    report: {
      created: jest.fn(),
      userBlocked: jest.fn(),
      userUnblocked: jest.fn(),
    },
    mission: {
      created: jest.fn(),
      published: jest.fn(),
      confirmed: jest.fn(),
      completed: jest.fn(),
      cancelled: jest.fn(),
    },
    listing: {
      created: jest.fn(),
      closed: jest.fn(),
    },
    internship: {
      created: jest.fn(),
      applied: jest.fn(),
    },
    subscription: {
      started: jest.fn(),
      upgraded: jest.fn(),
      cancelled: jest.fn(),
    },
    error: {
      api: jest.fn(),
      payment: jest.fn(),
      critical: jest.fn(),
    },
    messaging: {
      conversationStarted: jest.fn(),
      messageReported: jest.fn(),
    },
  },
}));

