import { reviewService } from '../../services/reviewService';
import { supabase } from '../../lib/supabase';
import { notificationService } from '../../services/notificationService';

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// submitReview
// ============================================

describe('reviewService.submitReview', () => {
  const reviewData = {
    mission_id: 'mission-1',
    reviewer_id: 'user-1',
    reviewee_id: 'user-2',
    rating_overall: 4.5,
    comment: 'Excellent travail',
    criteria: { rating_punctuality: 5, rating_professionalism: 4 },
  };

  test('inserts review and returns data', async () => {
    const mockData = { id: 'review-1', ...reviewData };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    const result = await reviewService.submitReview(reviewData);

    expect(result).toEqual(mockData);
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      mission_id: 'mission-1',
      rating_punctuality: 5,
      rating_professionalism: 4,
      visible: true,
    }));
  });

  test('calls notificationService after successful insert', async () => {
    const mockData = { id: 'review-1' };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    await reviewService.submitReview(reviewData);

    expect(notificationService.createNotification).toHaveBeenCalledWith(
      'user-2',
      'new_review',
      'Nouvel avis recu',
      expect.stringContaining('4.5'),
      expect.objectContaining({ missionId: 'mission-1' }),
    );
  });

  test('throws duplicate error for code 23505', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate' },
    });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    await expect(reviewService.submitReview(reviewData))
      .rejects.toThrow('Vous avez deja laisse un avis pour cette mission');
  });

  test('throws generic error for other errors', async () => {
    const mockError = { code: '500', message: 'Server error' };
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    await expect(reviewService.submitReview(reviewData))
      .rejects.toEqual(mockError);
  });

  test('does not throw if notification fails', async () => {
    const mockData = { id: 'review-1' };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    notificationService.createNotification.mockRejectedValueOnce(new Error('notif failed'));

    const result = await reviewService.submitReview(reviewData);
    expect(result).toEqual(mockData);
  });
});

// ============================================
// getExistingReview
// ============================================

describe('reviewService.getExistingReview', () => {
  test('returns data when review exists', async () => {
    const mockData = { id: 'review-1', rating_overall: 4 };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await reviewService.getExistingReview('mission-1', 'user-1');
    expect(result).toEqual(mockData);
  });

  test('returns null when no review exists', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await reviewService.getExistingReview('mission-1', 'user-1');
    expect(result).toBeNull();
  });

  test('throws on supabase error', async () => {
    const mockError = { message: 'DB error' };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    await expect(reviewService.getExistingReview('mission-1', 'user-1'))
      .rejects.toEqual(mockError);
  });
});

// ============================================
// getByMissionId
// ============================================

describe('reviewService.getByMissionId', () => {
  test('returns array of reviews', async () => {
    const mockData = [{ id: 'r1' }, { id: 'r2' }];
    const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await reviewService.getByMissionId('mission-1');
    expect(result).toEqual(mockData);
  });

  test('returns empty array when no reviews', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await reviewService.getByMissionId('mission-1');
    expect(result).toEqual([]);
  });
});
