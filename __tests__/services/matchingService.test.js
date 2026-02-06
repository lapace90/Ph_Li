import { matchingService } from '../../services/matchingService';
import { subscriptionService } from '../../services/subscriptionService';
import { supabase } from '../../lib/supabase';

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// shuffleArray
// ============================================

describe('matchingService.shuffleArray', () => {
  test('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(matchingService.shuffleArray(arr)).toHaveLength(5);
  });

  test('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = matchingService.shuffleArray(arr);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    matchingService.shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  test('empty array returns empty array', () => {
    expect(matchingService.shuffleArray([])).toEqual([]);
  });
});

// ============================================
// calculateMatchScore
// ============================================

describe('matchingService.calculateMatchScore', () => {
  test('returns 0 for empty candidate and offer', () => {
    const score = matchingService.calculateMatchScore({}, {});
    expect(score).toBe(0);
  });

  test('scores 25 for exact region match only', () => {
    const candidate = { current_region: 'Île-de-France' };
    const offer = { region: 'Île-de-France' };
    const score = matchingService.calculateMatchScore(candidate, offer);
    // 25 points with 1 factor → normalized: (25 / 25) * 100 = 100
    expect(score).toBe(100);
  });

  test('scores 15 for preferred_regions match', () => {
    const candidate = {
      current_region: 'Bretagne',
      preferred_regions: ['Île-de-France'],
    };
    const offer = { region: 'Île-de-France' };
    const score = matchingService.calculateMatchScore(candidate, offer);
    // 15 points with 1 factor → normalized: (15 / 25) * 100 = 60
    expect(score).toBe(60);
  });

  test('scores for contract type match', () => {
    const candidate = { preferred_contract_types: ['CDI'] };
    const offer = { contract_type: 'CDI' };
    const score = matchingService.calculateMatchScore(candidate, offer);
    // 20 points with 1 factor → normalized: (20 / 25) * 100 = 80
    expect(score).toBe(80);
  });

  test('scores for experience meeting requirement', () => {
    const candidate = { experience_years: 5 };
    const offer = { required_experience: 3 };
    const score = matchingService.calculateMatchScore(candidate, offer);
    // 20 points with 1 factor → normalized: (20 / 25) * 100 = 80
    expect(score).toBe(80);
  });

  test('scores partial for experience within 1 year', () => {
    const candidate = { experience_years: 2 };
    const offer = { required_experience: 3 };
    const score = matchingService.calculateMatchScore(candidate, offer);
    // 10 points with 1 factor → normalized: (10 / 25) * 100 = 40
    expect(score).toBe(40);
  });

  test('scores for availability before start date', () => {
    const candidate = { availability_date: '2025-01-01' };
    const offer = { start_date: '2025-06-01' };
    const score = matchingService.calculateMatchScore(candidate, offer);
    // 10 points with 1 factor → normalized: (10 / 25) * 100 = 40
    expect(score).toBe(40);
  });

  test('combined factors produce capped score', () => {
    const candidate = {
      current_region: 'Île-de-France',
      preferred_contract_types: ['CDI'],
      experience_years: 5,
      availability_date: '2025-01-01',
    };
    const offer = {
      region: 'Île-de-France',
      contract_type: 'CDI',
      required_experience: 3,
      start_date: '2025-06-01',
    };
    const score = matchingService.calculateMatchScore(candidate, offer);
    // 25 + 20 + 20 + 10 = 75, 4 factors so no normalization
    expect(score).toBe(75);
  });

  test('score is always between 0 and 100', () => {
    const candidate = {
      current_region: 'Île-de-France',
      preferred_contract_types: ['CDI'],
      experience_years: 10,
      availability_date: '2020-01-01',
    };
    const offer = {
      region: 'Île-de-France',
      contract_type: 'CDI',
      required_experience: 1,
      start_date: '2025-06-01',
    };
    const score = matchingService.calculateMatchScore(candidate, offer);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ============================================
// getSuperLikeQuota
// ============================================

describe('matchingService.getSuperLikeQuota', () => {
  test('returns quota from subscriptionService', async () => {
    subscriptionService.canSuperLike = jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 5,
      max: 10,
      used: 5,
    });

    const quota = await matchingService.getSuperLikeQuota('user-1');

    expect(subscriptionService.canSuperLike).toHaveBeenCalledWith('user-1');
    expect(quota.remaining).toBe(5);
    expect(quota.max).toBe(10);
    expect(quota.used).toBe(5);
    expect(quota.allowed).toBe(true);
    expect(quota.unlimited).toBe(false);
  });

  test('returns unlimited when max is Infinity', async () => {
    subscriptionService.canSuperLike = jest.fn().mockResolvedValue({
      allowed: true,
      remaining: Infinity,
      max: Infinity,
      used: 0,
    });

    const quota = await matchingService.getSuperLikeQuota('user-1');

    expect(quota.unlimited).toBe(true);
    expect(quota.remaining).toBe(Infinity);
    expect(quota.max).toBe(Infinity);
  });

  test('returns unlimited when max is null', async () => {
    subscriptionService.canSuperLike = jest.fn().mockResolvedValue({
      allowed: true,
      remaining: null,
      max: null,
      used: 0,
    });

    const quota = await matchingService.getSuperLikeQuota('user-1');

    expect(quota.unlimited).toBe(true);
  });

  test('returns fallback when subscriptionService fails', async () => {
    subscriptionService.canSuperLike = jest.fn().mockRejectedValue(new Error('Service error'));

    const quota = await matchingService.getSuperLikeQuota('user-1');

    expect(quota.remaining).toBe(3);
    expect(quota.max).toBe(3);
    expect(quota.used).toBe(0);
    expect(quota.allowed).toBe(true);
    expect(quota.unlimited).toBe(false);
  });
});

// ============================================
// getSuperLikesRemaining (deprecated)
// ============================================

describe('matchingService.getSuperLikesRemaining', () => {
  test('returns remaining from getSuperLikeQuota', async () => {
    subscriptionService.canSuperLike = jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 7,
      max: 10,
      used: 3,
    });

    const remaining = await matchingService.getSuperLikesRemaining('user-1');

    expect(remaining).toBe(7);
  });
});

// ============================================
// getSwipeableCandidates (RPC)
// ============================================

describe('matchingService.getSwipeableCandidates', () => {
  test('returns candidates from RPC', async () => {
    const mockCandidates = [
      { id: 'c-1', first_name: 'Jean', last_name: 'Dupont' },
      { id: 'c-2', first_name: 'Marie', last_name: 'Martin' },
    ];
    supabase.rpc.mockResolvedValue({ data: mockCandidates, error: null });

    const result = await matchingService.getSwipeableCandidates('employer-1', 'job-1');

    expect(supabase.rpc).toHaveBeenCalledWith('get_swipeable_candidates', {
      p_employer_id: 'employer-1',
      p_job_offer_id: 'job-1',
      p_limit: 50,
    });
    expect(result).toEqual(mockCandidates);
  });

  test('uses custom limit when provided', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });

    await matchingService.getSwipeableCandidates('employer-1', 'job-1', { limit: 10 });

    expect(supabase.rpc).toHaveBeenCalledWith('get_swipeable_candidates', {
      p_employer_id: 'employer-1',
      p_job_offer_id: 'job-1',
      p_limit: 10,
    });
  });

  test('returns empty array when no candidates', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await matchingService.getSwipeableCandidates('employer-1', 'job-1');

    expect(result).toEqual([]);
  });

  test('throws error on RPC failure', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC failed') });

    await expect(matchingService.getSwipeableCandidates('employer-1', 'job-1'))
      .rejects.toThrow('RPC failed');
  });
});

// ============================================
// createPendingMatch
// ============================================

describe('matchingService.createPendingMatch', () => {
  test('creates pending match for job_offer', async () => {
    const mockMatch = {
      id: 'match-1',
      candidate_id: 'user-1',
      job_offer_id: 'job-1',
      candidate_liked: true,
      employer_liked: false,
      status: 'pending',
    };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockMatch, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockUpsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await matchingService.createPendingMatch('user-1', 'job_offer', 'job-1', false);

    expect(supabase.from).toHaveBeenCalledWith('matches');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        candidate_id: 'user-1',
        job_offer_id: 'job-1',
        candidate_liked: true,
        employer_liked: false,
        status: 'pending',
        is_super_like: false,
      }),
      { onConflict: 'job_offer_id,candidate_id' }
    );
    expect(result).toEqual(mockMatch);
  });

  test('creates pending match for internship_offer', async () => {
    const mockMatch = {
      id: 'match-1',
      candidate_id: 'user-1',
      internship_offer_id: 'intern-1',
      status: 'pending',
    };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockMatch, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockUpsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await matchingService.createPendingMatch('user-1', 'internship_offer', 'intern-1', true);

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        candidate_id: 'user-1',
        internship_offer_id: 'intern-1',
        is_super_like: true,
      }),
      { onConflict: 'internship_offer_id,candidate_id' }
    );
    expect(result).toEqual(mockMatch);
  });

  test('throws error on database failure', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockUpsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    await expect(matchingService.createPendingMatch('user-1', 'job_offer', 'job-1', false))
      .rejects.toThrow('Insert failed');
  });
});

// ============================================
// getCandidateMatches
// ============================================

describe('matchingService.getCandidateMatches', () => {
  test('returns empty array when no matches', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await matchingService.getCandidateMatches('user-1');

    expect(result).toEqual([]);
  });

  test('throws error on database failure', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('Query failed') });
    const mockEq2 = jest.fn(() => ({ order: mockOrder }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    await expect(matchingService.getCandidateMatches('user-1'))
      .rejects.toThrow('Query failed');
  });
});

// ============================================
// getEmployerMatches
// ============================================

describe('matchingService.getEmployerMatches', () => {
  test('returns empty array when employer has no offers', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      return { select: mockSelect };
    });

    const result = await matchingService.getEmployerMatches('employer-1');

    expect(result).toEqual([]);
  });
});
