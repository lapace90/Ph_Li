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

    // Mock chain: from().select().eq().eq() -> awaitable Promise
    const mockResult = Promise.resolve({ count: 2, error: null });
    const mockEq2 = jest.fn(() => mockResult);
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

    // Mock chain: from().select().eq().eq() -> awaitable Promise
    const mockResult = Promise.resolve({ count: 3, error: null });
    const mockEq2 = jest.fn(() => mockResult);
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

    // Mock chain: from().select().eq().eq() -> awaitable Promise
    const mockResult = Promise.resolve({ count: 10, error: null });
    const mockEq2 = jest.fn(() => mockResult);
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.canAddFavorite('user-1');
    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Pro');
  });
});

// ============================================
// getAll
// ============================================

describe('favoritesService.getAll', () => {
  test('returns all favorites for user', async () => {
    const mockData = [
      { id: 'fav-1', user_id: 'user-1', target_type: 'candidate', target_id: 'c-1' },
      { id: 'fav-2', user_id: 'user-1', target_type: 'job_offer', target_id: 'j-1' },
    ];
    const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getAll('user-1');

    expect(supabase.from).toHaveBeenCalledWith('favorites');
    expect(result).toEqual(mockData);
  });

  test('returns empty array when no favorites', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getAll('user-1');

    expect(result).toEqual([]);
  });

  test('throws error on database failure', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('Query failed') });
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    await expect(favoritesService.getAll('user-1')).rejects.toThrow('Query failed');
  });
});

// ============================================
// getByType
// ============================================

describe('favoritesService.getByType', () => {
  test('returns favorites of specific type', async () => {
    const mockData = [{ id: 'fav-1', target_type: 'candidate' }];
    const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getByType('user-1', FAVORITE_TYPES.CANDIDATE);

    expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockEq2).toHaveBeenCalledWith('target_type', 'candidate');
    expect(result).toEqual(mockData);
  });
});

// ============================================
// add
// ============================================

describe('favoritesService.add', () => {
  test('adds a non-animator favorite without quota check', async () => {
    const mockFav = { id: 'fav-1', user_id: 'user-1', target_type: 'candidate', target_id: 'c-1' };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockFav, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    const result = await favoritesService.add('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(subscriptionService.getLimits).not.toHaveBeenCalled();
    expect(result).toEqual(mockFav);
  });

  test('checks quota when adding animator favorite', async () => {
    subscriptionService.getLimits.mockResolvedValueOnce({
      limits: { favorites: 10 },
      userType: 'laboratoire',
      tier: 'starter',
    });

    // Mock getFavoritesCount
    const mockCountResult = Promise.resolve({ count: 5, error: null });
    const mockCountEq2 = jest.fn(() => mockCountResult);
    const mockCountEq1 = jest.fn(() => ({ eq: mockCountEq2 }));
    const mockCountSelect = jest.fn(() => ({ eq: mockCountEq1 }));

    // Mock insert
    const mockFav = { id: 'fav-1', target_type: 'animator' };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockFav, error: null });
    const mockInsertSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockInsertSelect }));

    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockCountSelect };
      }
      return { insert: mockInsert };
    });

    const result = await favoritesService.add('user-1', FAVORITE_TYPES.ANIMATOR, 'a-1');

    expect(subscriptionService.getLimits).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockFav);
  });

  test('throws error when animator quota exceeded', async () => {
    subscriptionService.getLimits.mockResolvedValueOnce({
      limits: { favorites: 3 },
      userType: 'laboratoire',
      tier: 'free',
    });

    const mockCountResult = Promise.resolve({ count: 3, error: null });
    const mockCountEq2 = jest.fn(() => mockCountResult);
    const mockCountEq1 = jest.fn(() => ({ eq: mockCountEq2 }));
    const mockCountSelect = jest.fn(() => ({ eq: mockCountEq1 }));
    supabase.from.mockReturnValue({ select: mockCountSelect });

    await expect(favoritesService.add('user-1', FAVORITE_TYPES.ANIMATOR, 'a-1'))
      .rejects.toThrow('Limite de favoris atteinte');
  });

  test('throws error when already favorited (duplicate)', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate' }
    });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    await expect(favoritesService.add('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1'))
      .rejects.toThrow('Déjà dans vos favoris');
  });
});

// ============================================
// remove
// ============================================

describe('favoritesService.remove', () => {
  test('removes a favorite successfully', async () => {
    const mockEq3 = jest.fn().mockResolvedValue({ error: null });
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockDelete = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ delete: mockDelete });

    const result = await favoritesService.remove('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(supabase.from).toHaveBeenCalledWith('favorites');
    expect(result).toBe(true);
  });

  test('throws error on database failure', async () => {
    const mockEq3 = jest.fn().mockResolvedValue({ error: new Error('Delete failed') });
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockDelete = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ delete: mockDelete });

    await expect(favoritesService.remove('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1'))
      .rejects.toThrow('Delete failed');
  });
});

// ============================================
// isFavorite
// ============================================

describe('favoritesService.isFavorite', () => {
  test('returns true when favorite exists', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'fav-1' }, error: null });
    const mockEq3 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.isFavorite('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(result).toBe(true);
  });

  test('returns false when favorite does not exist', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq3 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.isFavorite('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(result).toBe(false);
  });
});

// ============================================
// toggle
// ============================================

describe('favoritesService.toggle', () => {
  test('removes favorite when it exists', async () => {
    // Mock isFavorite -> true
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'fav-1' }, error: null });
    const mockEq3IsFav = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq2IsFav = jest.fn(() => ({ eq: mockEq3IsFav }));
    const mockEq1IsFav = jest.fn(() => ({ eq: mockEq2IsFav }));
    const mockSelectIsFav = jest.fn(() => ({ eq: mockEq1IsFav }));

    // Mock remove
    const mockEq3Remove = jest.fn().mockResolvedValue({ error: null });
    const mockEq2Remove = jest.fn(() => ({ eq: mockEq3Remove }));
    const mockEq1Remove = jest.fn(() => ({ eq: mockEq2Remove }));
    const mockDelete = jest.fn(() => ({ eq: mockEq1Remove }));

    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectIsFav };
      }
      return { delete: mockDelete };
    });

    const result = await favoritesService.toggle('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(result).toEqual({ added: false });
  });

  test('adds favorite when it does not exist', async () => {
    // Mock isFavorite -> false
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq3IsFav = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq2IsFav = jest.fn(() => ({ eq: mockEq3IsFav }));
    const mockEq1IsFav = jest.fn(() => ({ eq: mockEq2IsFav }));
    const mockSelectIsFav = jest.fn(() => ({ eq: mockEq1IsFav }));

    // Mock add
    const mockFav = { id: 'fav-new', target_type: 'candidate' };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockFav, error: null });
    const mockSelectInsert = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelectInsert }));

    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectIsFav };
      }
      return { insert: mockInsert };
    });

    const result = await favoritesService.toggle('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(result).toEqual({ added: true, favorite: mockFav });
  });
});

// ============================================
// updateNotes
// ============================================

describe('favoritesService.updateNotes', () => {
  test('updates notes successfully', async () => {
    const mockFav = { id: 'fav-1', notes: 'Updated notes' };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockFav, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockEq3 = jest.fn(() => ({ select: mockSelect }));
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockUpdate = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ update: mockUpdate });

    const result = await favoritesService.updateNotes('user-1', FAVORITE_TYPES.CANDIDATE, 'c-1', 'Updated notes');

    expect(mockUpdate).toHaveBeenCalledWith({ notes: 'Updated notes' });
    expect(result).toEqual(mockFav);
  });
});

// ============================================
// getFavoritesCount
// ============================================

describe('favoritesService.getFavoritesCount', () => {
  test('returns count for all favorites', async () => {
    const mockResult = Promise.resolve({ count: 5, error: null });
    const mockEq = jest.fn(() => mockResult);
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const count = await favoritesService.getFavoritesCount('user-1');

    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(count).toBe(5);
  });

  test('returns count for specific type', async () => {
    const mockResult = Promise.resolve({ count: 3, error: null });
    const mockEq2 = jest.fn(() => mockResult);
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const count = await favoritesService.getFavoritesCount('user-1', FAVORITE_TYPES.ANIMATOR);

    expect(mockEq2).toHaveBeenCalledWith('target_type', 'animator');
    expect(count).toBe(3);
  });

  test('returns 0 when count is null', async () => {
    const mockResult = Promise.resolve({ count: null, error: null });
    const mockEq = jest.fn(() => mockResult);
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const count = await favoritesService.getFavoritesCount('user-1');

    expect(count).toBe(0);
  });
});

// ============================================
// countForTarget
// ============================================

describe('favoritesService.countForTarget', () => {
  test('returns count of favorites for target', async () => {
    const mockResult = Promise.resolve({ count: 10, error: null });
    const mockEq2 = jest.fn(() => mockResult);
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const count = await favoritesService.countForTarget(FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(mockEq1).toHaveBeenCalledWith('target_type', 'candidate');
    expect(mockEq2).toHaveBeenCalledWith('target_id', 'c-1');
    expect(count).toBe(10);
  });
});

// ============================================
// isFirstFavorite
// ============================================

describe('favoritesService.isFirstFavorite', () => {
  test('returns true when count is 1', async () => {
    const mockResult = Promise.resolve({ count: 1, error: null });
    const mockEq2 = jest.fn(() => mockResult);
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.isFirstFavorite(FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(result).toBe(true);
  });

  test('returns false when count is greater than 1', async () => {
    const mockResult = Promise.resolve({ count: 5, error: null });
    const mockEq2 = jest.fn(() => mockResult);
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.isFirstFavorite(FAVORITE_TYPES.CANDIDATE, 'c-1');

    expect(result).toBe(false);
  });
});

// ============================================
// getFavoriteIds
// ============================================

describe('favoritesService.getFavoriteIds', () => {
  test('returns array of target IDs', async () => {
    const mockData = [{ target_id: 'c-1' }, { target_id: 'c-2' }, { target_id: 'c-3' }];
    const mockEq2 = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const ids = await favoritesService.getFavoriteIds('user-1', FAVORITE_TYPES.CANDIDATE);

    expect(ids).toEqual(['c-1', 'c-2', 'c-3']);
  });

  test('returns empty array when no favorites', async () => {
    const mockEq2 = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const ids = await favoritesService.getFavoriteIds('user-1', FAVORITE_TYPES.CANDIDATE);

    expect(ids).toEqual([]);
  });
});

// ============================================
// Enriched getters - getCandidateFavorites
// ============================================

describe('favoritesService.getCandidateFavorites', () => {
  test('returns empty array when no favorites', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getCandidateFavorites('user-1');

    expect(result).toEqual([]);
  });
});

// ============================================
// Enriched getters - getAnimatorFavorites
// ============================================

describe('favoritesService.getAnimatorFavorites', () => {
  test('returns empty array when no favorites', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getAnimatorFavorites('user-1');

    expect(result).toEqual([]);
  });
});

// ============================================
// Enriched getters - getLaboratoryFavorites
// ============================================

describe('favoritesService.getLaboratoryFavorites', () => {
  test('returns empty array when no favorites', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getLaboratoryFavorites('user-1');

    expect(result).toEqual([]);
  });
});

// ============================================
// Enriched getters - getJobOfferFavorites
// ============================================

describe('favoritesService.getJobOfferFavorites', () => {
  test('returns empty array when no favorites', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getJobOfferFavorites('user-1');

    expect(result).toEqual([]);
  });
});

// ============================================
// Enriched getters - getMissionFavorites
// ============================================

describe('favoritesService.getMissionFavorites', () => {
  test('returns empty array when no favorites', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getMissionFavorites('user-1');

    expect(result).toEqual([]);
  });
});

// ============================================
// Enriched getters - getPharmacyListingFavorites
// ============================================

describe('favoritesService.getPharmacyListingFavorites', () => {
  test('returns empty array when no favorites', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await favoritesService.getPharmacyListingFavorites('user-1');

    expect(result).toEqual([]);
  });
});
