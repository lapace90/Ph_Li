// Test logService sans le mock global
// On doit unmock pour tester le vrai service
jest.unmock('../../services/logService');

import { supabase } from '../../lib/supabase';

// Import après unmock
let logService;
beforeAll(() => {
  logService = require('../../services/logService').logService;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// Structure des logs
// ============================================

describe('logService structure', () => {
  test('has auth methods', () => {
    expect(logService.auth).toBeDefined();
    expect(typeof logService.auth.signup).toBe('function');
    expect(typeof logService.auth.login).toBe('function');
    expect(typeof logService.auth.logout).toBe('function');
    expect(typeof logService.auth.loginFailed).toBe('function');
    expect(typeof logService.auth.accountDeleted).toBe('function');
    expect(typeof logService.auth.passwordChanged).toBe('function');
    expect(typeof logService.auth.passwordResetRequested).toBe('function');
  });

  test('has verification methods', () => {
    expect(logService.verification).toBeDefined();
    expect(typeof logService.verification.siretVerified).toBe('function');
    expect(typeof logService.verification.siretRejected).toBe('function');
    expect(typeof logService.verification.rppsVerified).toBe('function');
    expect(typeof logService.verification.rppsRejected).toBe('function');
  });

  test('has report methods', () => {
    expect(logService.report).toBeDefined();
    expect(typeof logService.report.created).toBe('function');
    expect(typeof logService.report.userBlocked).toBe('function');
    expect(typeof logService.report.userUnblocked).toBe('function');
  });

  test('has mission methods', () => {
    expect(logService.mission).toBeDefined();
    expect(typeof logService.mission.created).toBe('function');
    expect(typeof logService.mission.published).toBe('function');
    expect(typeof logService.mission.confirmed).toBe('function');
    expect(typeof logService.mission.completed).toBe('function');
    expect(typeof logService.mission.cancelled).toBe('function');
  });

  test('has listing methods', () => {
    expect(logService.listing).toBeDefined();
    expect(typeof logService.listing.created).toBe('function');
    expect(typeof logService.listing.closed).toBe('function');
  });

  test('has internship methods', () => {
    expect(logService.internship).toBeDefined();
    expect(typeof logService.internship.created).toBe('function');
    expect(typeof logService.internship.applied).toBe('function');
  });

  test('has subscription methods', () => {
    expect(logService.subscription).toBeDefined();
    expect(typeof logService.subscription.started).toBe('function');
    expect(typeof logService.subscription.upgraded).toBe('function');
    expect(typeof logService.subscription.cancelled).toBe('function');
  });

  test('has error methods', () => {
    expect(logService.error).toBeDefined();
    expect(typeof logService.error.api).toBe('function');
    expect(typeof logService.error.payment).toBe('function');
    expect(typeof logService.error.critical).toBe('function');
  });

  test('has messaging methods', () => {
    expect(logService.messaging).toBeDefined();
    expect(typeof logService.messaging.conversationStarted).toBe('function');
    expect(typeof logService.messaging.messageReported).toBe('function');
  });
});

// ============================================
// Auth logs
// ============================================

describe('logService.auth', () => {
  test('signup logs with correct category and action', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.auth.signup('user-123', 'test@example.com', 'titulaire');

    expect(supabase.from).toHaveBeenCalledWith('admin_logs');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'auth',
        action: 'signup',
        user_id: 'user-123',
        message: expect.stringContaining('test@example.com'),
      })
    );
  });

  test('login logs with correct data', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.auth.login('user-123', 'test@example.com');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'auth',
        action: 'login',
        user_id: 'user-123',
      })
    );
  });

  test('loginFailed logs with warning severity', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.auth.loginFailed('test@example.com', 'Invalid password');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'auth',
        action: 'login_failed',
        severity: 'warning',
        message: expect.stringContaining('test@example.com'),
      })
    );
  });

  test('passwordChanged logs correctly', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.auth.passwordChanged('user-123', 'test@example.com');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'auth',
        action: 'password_changed',
        user_id: 'user-123',
      })
    );
  });

  test('passwordResetRequested logs correctly', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.auth.passwordResetRequested('test@example.com');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'auth',
        action: 'password_reset_requested',
        message: expect.stringContaining('test@example.com'),
      })
    );
  });
});

// ============================================
// Verification logs
// ============================================

describe('logService.verification', () => {
  test('siretVerified logs with company name', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.verification.siretVerified('user-123', '12345678901234', 'Ma Pharmacie');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'verification',
        action: 'siret_verified',
        user_id: 'user-123',
        message: expect.stringContaining('12345678901234'),
      })
    );
  });

  test('siretRejected logs with warning severity', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.verification.siretRejected('user-123', '12345678901234', 'SIRET invalide');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'verification',
        action: 'siret_rejected',
        severity: 'warning',
      })
    );
  });

  test('rppsVerified logs correctly', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.verification.rppsVerified('user-123', '10000000001');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'verification',
        action: 'rpps_verified',
        user_id: 'user-123',
      })
    );
  });

  test('rppsRejected logs with warning severity', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.verification.rppsRejected('user-123', '10000000001', 'Nom incorrect');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'verification',
        action: 'rpps_rejected',
        severity: 'warning',
      })
    );
  });
});

// ============================================
// Mission logs
// ============================================

describe('logService.mission', () => {
  test('created logs with mission details', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.mission.created('user-123', 'mission-456', 'Animation Dermocosmétique', 'animation');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'mission',
        action: 'mission_created',
        user_id: 'user-123',
        target_id: 'mission-456',
        target_type: 'mission',
        message: expect.stringContaining('Animation Dermocosmétique'),
      })
    );
  });

  test('confirmed logs with animator id in metadata', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.mission.confirmed('user-123', 'mission-456', 'animator-789', 'Ma Mission');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'mission',
        action: 'mission_confirmed',
        metadata: expect.objectContaining({ animatorId: 'animator-789' }),
      })
    );
  });

  test('cancelled logs with warning severity and reason', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.mission.cancelled('user-123', 'mission-456', 'Ma Mission', 'Client indisponible');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'mission',
        action: 'mission_cancelled',
        severity: 'warning',
        metadata: expect.objectContaining({ reason: 'Client indisponible' }),
      })
    );
  });
});

// ============================================
// Report logs
// ============================================

describe('logService.report', () => {
  test('created logs with report details', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.report.created('user-123', 'user-456', 'Spam', 'profile');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'report',
        action: 'report_created',
        user_id: 'user-123',
        target_id: 'user-456',
      })
    );
  });

  test('userBlocked logs with critical severity', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.report.userBlocked('user-456', 'test@example.com');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'report',
        action: 'user_blocked',
        severity: 'critical',
      })
    );
  });
});

// ============================================
// Error handling
// ============================================

describe('logService error handling', () => {
  test('does not throw when supabase insert fails', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: { message: 'DB error' } });
    supabase.from.mockReturnValue({ insert: mockInsert });

    // Should not throw
    await expect(logService.auth.login('user-123', 'test@example.com')).resolves.not.toThrow();
  });

  test('logs error to console when exception is thrown', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockInsert = jest.fn().mockRejectedValue(new Error('Network error'));
    supabase.from.mockReturnValue({ insert: mockInsert });

    await logService.auth.login('user-123', 'test@example.com');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[LogService] Erreur:',
      'Network error'
    );
    consoleSpy.mockRestore();
  });

  test('silently handles errors without blocking the app', async () => {
    const mockInsert = jest.fn().mockRejectedValue(new Error('Crash'));
    supabase.from.mockReturnValue({ insert: mockInsert });

    // Log function should complete without throwing
    await expect(logService.auth.login('user-123', 'test@example.com')).resolves.toBeUndefined();
  });
});
