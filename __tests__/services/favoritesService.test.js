import { favoritesService, FAVORITE_TYPES } from '../../services/favoritesService';
import { subscriptionService } from '../../services/subscriptionService';
import { supabase } from '../../lib/supabase';

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// FAVORITE_TYPES
// ============================================

describe('FAVORITE_TYPES', () => {
  test('has all 6 types defined', () => {
    expect(FAVORITE_TYPES.CANDIDATE).toBe('candidate');
    expect(FAVORITE_TYPES.ANIMATOR).toBe('animator');
    expect(FAVORITE_TYPES.LABORATORY).toBe('laboratory');
    expect(FAVORITE_TYPES.JOB_OFFER).toBe('job_offer');
    expect(FAVORITE_TYPES.MISSION).toBe('mission');
    expect(FAVORITE_TYPES.PHARMACY_LISTING).toBe('pharmacy_listing');
  });
});

// ============================================
// canAddFavorite
// ============================================

describe('favoritesService.canAddFavorite', () => {
  test('non-laboratoire users are always allowed', async () => {
    subscriptionService.getLimits.mockResolvedValueOnce({
      limits: { favorites: 3 },
      userType: 'preparateur',
      tier: 'free',
    });

    const result = await favoritesService.canAddFavorite('user-1');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Infinity);
  });

  test('laboratoire with Infinity limit is allowed', async () => {
    subscriptionService.getLimits.mockResolvedValueOnce({
      limits: { favorites: Infinity },
      userType: 'laboratoire',
      tier: 'business',
    });

    const result = await favoritesService.canAddFavorite('user-1');
    expect(result.allowed).toBe(true);
  });

  test('laboratoire under limit is allowed', async () => {
    subscriptionService.getLimits.mockResolvedValueOnce({
      limits: { favorites: 3 },
      userType: 'laboratoire',
      tier: 'free',
    });

    // Mock getFavoritesCount via supabase
    const mockHead = jest.fn().mockResolvedValue({ count: 2, error: null });
    const mockEq2 = jest.fn(() => mockHead);
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.canAddFavorite('user-1');
    expect(result.allowed).toBe(true);
    expect(result.current).toBe(2);
    expect(result.limit).toBe(3);
  });

  test('laboratoire at limit is not allowed', async () => {
    subscriptionService.getLimits.mockResolvedValueOnce({
      limits: { favorites: 3 },
      userType: 'laboratoire',
      tier: 'free',
    });

    const mockHead = jest.fn().mockResolvedValue({ count: 3, error: null });
    const mockEq2 = jest.fn(() => mockHead);
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.canAddFavorite('user-1');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Starter');
    expect(result.message).toContain('3/3');
  });

  test('starter tier message mentions Pro', async () => {
    subscriptionService.getLimits.mockResolvedValueOnce({
      limits: { favorites: 10 },
      userType: 'laboratoire',
      tier: 'starter',
    });

    const mockHead = jest.fn().mockResolvedValue({ count: 10, error: null });
    const mockEq2 = jest.fn(() => mockHead);
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.canAddFavorite('user-1');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Pro');
  });
});
