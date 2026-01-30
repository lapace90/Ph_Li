import { rppsService } from '../../services/rppsService';
import { supabase } from '../../lib/supabase';
import { logService } from '../../services/logService';

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// isValidRppsFormat
// ============================================

describe('rppsService.isValidRppsFormat', () => {
  test('returns true for valid 11-digit RPPS', () => {
    expect(rppsService.isValidRppsFormat('10000000001')).toBe(true);
    expect(rppsService.isValidRppsFormat('12345678901')).toBe(true);
    expect(rppsService.isValidRppsFormat('00000000000')).toBe(true);
  });

  test('returns false for RPPS with less than 11 digits', () => {
    expect(rppsService.isValidRppsFormat('1234567890')).toBe(false);
    expect(rppsService.isValidRppsFormat('123456789')).toBe(false);
    expect(rppsService.isValidRppsFormat('1')).toBe(false);
    expect(rppsService.isValidRppsFormat('')).toBe(false);
  });

  test('returns false for RPPS with more than 11 digits', () => {
    expect(rppsService.isValidRppsFormat('123456789012')).toBe(false);
    expect(rppsService.isValidRppsFormat('1234567890123456')).toBe(false);
  });

  test('returns false for RPPS with non-digit characters', () => {
    expect(rppsService.isValidRppsFormat('1234567890a')).toBe(false);
    expect(rppsService.isValidRppsFormat('12345 67890')).toBe(false);
    expect(rppsService.isValidRppsFormat('12345-67890')).toBe(false);
    expect(rppsService.isValidRppsFormat('abcdefghijk')).toBe(false);
  });

  test('returns false for null or undefined', () => {
    expect(rppsService.isValidRppsFormat(null)).toBe(false);
    expect(rppsService.isValidRppsFormat(undefined)).toBe(false);
  });
});

// ============================================
// DEMO_RPPS_DATA (mode démo)
// ============================================

describe('rppsService.DEMO_RPPS_DATA', () => {
  test('contains demo data when in demo mode', () => {
    // En mode démo, DEMO_RPPS_DATA est exposé
    if (rppsService.DEMO_RPPS_DATA) {
      expect(rppsService.DEMO_RPPS_DATA['10000000001']).toBeDefined();
      expect(rppsService.DEMO_RPPS_DATA['10000000001'].firstName).toBe('Marie');
      expect(rppsService.DEMO_RPPS_DATA['10000000001'].lastName).toBe('Durand');
      expect(rppsService.DEMO_RPPS_DATA['10000000001'].profession).toBe('Pharmacien');
    }
  });

  test('demo data contains pharmaciens and preparateurs', () => {
    if (rppsService.DEMO_RPPS_DATA) {
      // Titulaires (pharmaciens)
      expect(rppsService.DEMO_RPPS_DATA['10000000001'].professionCode).toBe('21');
      // Préparateurs
      expect(rppsService.DEMO_RPPS_DATA['10000000011'].professionCode).toBe('26');
    }
  });
});

// ============================================
// submitVerification
// ============================================

describe('rppsService.submitVerification', () => {
  test('returns error for invalid RPPS format', async () => {
    const result = await rppsService.submitVerification('user-123', '12345', 'Marie', 'Durand');

    expect(result.verified).toBe(false);
    expect(result.message).toContain('11 chiffres');
  });

  test('returns verified true for valid demo RPPS with matching name', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await rppsService.submitVerification(
      'user-123',
      '10000000001',
      'Marie',
      'Durand'
    );

    expect(result.verified).toBe(true);
    expect(result.message).toContain('succès');
  });

  test('returns verified false for valid RPPS with non-matching name', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await rppsService.submitVerification(
      'user-123',
      '10000000001',
      'Jean',
      'Martin'
    );

    expect(result.verified).toBe(false);
    expect(result.message).toContain('ne correspond pas');
  });

  test('returns verified false for unknown RPPS number', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await rppsService.submitVerification(
      'user-123',
      '99999999999',
      'Marie',
      'Durand'
    );

    expect(result.verified).toBe(false);
    expect(result.message).toContain('non trouvé');
  });

  test('calls logService on successful verification', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    await rppsService.submitVerification('user-123', '10000000001', 'Marie', 'Durand');

    expect(logService.verification.rppsVerified).toHaveBeenCalledWith('user-123', '10000000001');
  });

  test('calls logService on failed verification', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    await rppsService.submitVerification('user-123', '99999999999', 'Marie', 'Durand');

    expect(logService.verification.rppsRejected).toHaveBeenCalledWith(
      'user-123',
      '99999999999',
      expect.any(String)
    );
  });

  test('upserts verification document to database', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    await rppsService.submitVerification('user-123', '10000000001', 'Marie', 'Durand');

    expect(supabase.from).toHaveBeenCalledWith('verification_documents');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        verification_type: 'rpps',
        document_reference: '10000000001',
        status: 'approved',
      }),
      expect.any(Object)
    );
  });
});

// ============================================
// getVerificationStatus
// ============================================

describe('rppsService.getVerificationStatus', () => {
  test('returns verified true when status is approved', async () => {
    const mockData = {
      status: 'approved',
      document_reference: '10000000001',
      verification_data: { profession: 'Pharmacien' },
    };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await rppsService.getVerificationStatus('user-123');

    expect(result.verified).toBe(true);
    expect(result.status).toBe('approved');
    expect(result.rppsNumber).toBe('10000000001');
  });

  test('returns verified false when status is rejected', async () => {
    const mockData = {
      status: 'rejected',
      document_reference: '10000000001',
      rejection_reason: 'Nom incorrect',
    };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await rppsService.getVerificationStatus('user-123');

    expect(result.verified).toBe(false);
    expect(result.rejectionReason).toBe('Nom incorrect');
  });

  test('returns verified false when no data exists', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await rppsService.getVerificationStatus('user-123');

    expect(result.verified).toBe(false);
    expect(result.status).toBeNull();
  });
});

// ============================================
// isRppsAlreadyUsed
// ============================================

describe('rppsService.isRppsAlreadyUsed', () => {
  test('returns true when RPPS is used by another user', async () => {
    const mockData = { user_id: 'other-user' };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockNeq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq3 = jest.fn(() => ({ neq: mockNeq }));
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await rppsService.isRppsAlreadyUsed('10000000001', 'user-123');

    expect(result).toBe(true);
  });

  test('returns false when RPPS is not used', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockNeq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq3 = jest.fn(() => ({ neq: mockNeq }));
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await rppsService.isRppsAlreadyUsed('10000000001', 'user-123');

    expect(result).toBe(false);
  });
});
