import { siretVerificationService } from '../../services/siretVerificationService';
import { supabase } from '../../lib/supabase';
import { logService } from '../../services/logService';

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// isValidSiretFormat
// ============================================

describe('siretVerificationService.isValidSiretFormat', () => {
  test('returns true for valid 14-digit SIRET', () => {
    expect(siretVerificationService.isValidSiretFormat('12345678901234')).toBe(true);
    expect(siretVerificationService.isValidSiretFormat('00000000000000')).toBe(true);
    expect(siretVerificationService.isValidSiretFormat('98765432109876')).toBe(true);
  });

  test('returns true for SIRET with spaces (cleaned internally)', () => {
    expect(siretVerificationService.isValidSiretFormat('123 456 789 01234')).toBe(true);
    expect(siretVerificationService.isValidSiretFormat('12345678901234')).toBe(true);
  });

  test('returns false for SIRET with less than 14 digits', () => {
    expect(siretVerificationService.isValidSiretFormat('1234567890123')).toBe(false);
    expect(siretVerificationService.isValidSiretFormat('123456789')).toBe(false);
    expect(siretVerificationService.isValidSiretFormat('1')).toBe(false);
    expect(siretVerificationService.isValidSiretFormat('')).toBe(false);
  });

  test('returns false for SIRET with more than 14 digits', () => {
    expect(siretVerificationService.isValidSiretFormat('123456789012345')).toBe(false);
    expect(siretVerificationService.isValidSiretFormat('12345678901234567890')).toBe(false);
  });

  test('returns false for SIRET with non-digit characters (except spaces)', () => {
    expect(siretVerificationService.isValidSiretFormat('1234567890123a')).toBe(false);
    expect(siretVerificationService.isValidSiretFormat('12345-6789-0123')).toBe(false);
    expect(siretVerificationService.isValidSiretFormat('abcdefghijklmn')).toBe(false);
  });
});

// ============================================
// DEMO_SIRET_DATA (mode démo)
// ============================================

describe('siretVerificationService.DEMO_SIRET_DATA', () => {
  test('contains demo data when in demo mode', () => {
    if (siretVerificationService.DEMO_SIRET_DATA) {
      expect(siretVerificationService.DEMO_SIRET_DATA['12345678901234']).toBeDefined();
      expect(siretVerificationService.DEMO_SIRET_DATA['12345678901234'].name).toBe('DERMACARE LABORATORIES SAS');
      expect(siretVerificationService.DEMO_SIRET_DATA['12345678901234'].active).toBe(true);
    }
  });

  test('demo data contains various company types', () => {
    if (siretVerificationService.DEMO_SIRET_DATA) {
      // Animateurs
      expect(siretVerificationService.DEMO_SIRET_DATA['12345678901234']).toBeDefined();
      // Laboratoires
      expect(siretVerificationService.DEMO_SIRET_DATA['11122233344455']).toBeDefined();
      expect(siretVerificationService.DEMO_SIRET_DATA['11122233344455'].name).toBe('ORTHOMED LABORATORIES');
    }
  });
});

// ============================================
// submitVerification
// ============================================

describe('siretVerificationService.submitVerification', () => {
  test('returns error for invalid SIRET format', async () => {
    const result = await siretVerificationService.submitVerification('user-123', '12345');

    expect(result.verified).toBe(false);
    expect(result.message).toContain('14 chiffres');
  });

  test('returns verified true for valid demo SIRET', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await siretVerificationService.submitVerification(
      'user-123',
      '12345678901234'
    );

    expect(result.verified).toBe(true);
    expect(result.message).toContain('succès');
    expect(result.data.name).toBe('DERMACARE LABORATORIES SAS');
  });

  test('returns verified false for unknown SIRET number', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await siretVerificationService.submitVerification(
      'user-123',
      '99999999999999'
    );

    expect(result.verified).toBe(false);
    expect(result.message).toContain('non trouvé');
  });

  test('handles SIRET with spaces correctly', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await siretVerificationService.submitVerification(
      'user-123',
      '123 456 789 01234'
    );

    expect(result.verified).toBe(true);
  });

  test('calls logService on successful verification', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    await siretVerificationService.submitVerification('user-123', '12345678901234');

    expect(logService.verification.siretVerified).toHaveBeenCalledWith(
      'user-123',
      '12345678901234',
      'DERMACARE LABORATORIES SAS'
    );
  });

  test('calls logService on failed verification', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    await siretVerificationService.submitVerification('user-123', '99999999999999');

    expect(logService.verification.siretRejected).toHaveBeenCalledWith(
      'user-123',
      '99999999999999',
      expect.any(String)
    );
  });

  test('upserts verification document to database', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    await siretVerificationService.submitVerification('user-123', '12345678901234');

    expect(supabase.from).toHaveBeenCalledWith('verification_documents');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        verification_type: 'siret',
        document_reference: '12345678901234',
        status: 'approved',
      }),
      expect.any(Object)
    );
  });

  test('returns error when database upsert fails', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: { message: 'DB error' } });
    supabase.from.mockReturnValue({ upsert: mockUpsert });

    const result = await siretVerificationService.submitVerification('user-123', '12345678901234');

    expect(result.verified).toBe(false);
    expect(result.message).toContain('enregistrement');
  });
});

// ============================================
// getVerificationStatus
// ============================================

describe('siretVerificationService.getVerificationStatus', () => {
  test('returns verified true when status is approved', async () => {
    const mockData = {
      status: 'approved',
      document_reference: '12345678901234',
      verification_data: { name: 'Ma Société' },
    };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await siretVerificationService.getVerificationStatus('user-123');

    expect(result.verified).toBe(true);
    expect(result.status).toBe('approved');
    expect(result.siretNumber).toBe('12345678901234');
  });

  test('returns verified false when status is rejected', async () => {
    const mockData = {
      status: 'rejected',
      document_reference: '12345678901234',
      rejection_reason: 'Etablissement inactif',
    };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await siretVerificationService.getVerificationStatus('user-123');

    expect(result.verified).toBe(false);
    expect(result.rejectionReason).toBe('Etablissement inactif');
  });

  test('returns verified false when no data exists', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await siretVerificationService.getVerificationStatus('user-123');

    expect(result.verified).toBe(false);
    expect(result.status).toBeNull();
  });
});

// ============================================
// deleteVerification
// ============================================

describe('siretVerificationService.deleteVerification', () => {
  test('deletes verification document', async () => {
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockDelete = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ delete: mockDelete });

    await siretVerificationService.deleteVerification('user-123');

    expect(supabase.from).toHaveBeenCalledWith('verification_documents');
    expect(mockDelete).toHaveBeenCalled();
  });

  test('throws on database error', async () => {
    const mockError = { message: 'DB error' };
    const mockEq2 = jest.fn().mockResolvedValue({ error: mockError });
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockDelete = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ delete: mockDelete });

    await expect(siretVerificationService.deleteVerification('user-123'))
      .rejects.toEqual(mockError);
  });
});

// ============================================
// isSiretAlreadyUsed
// ============================================

describe('siretVerificationService.isSiretAlreadyUsed', () => {
  test('returns true when SIRET is used by another user', async () => {
    const mockData = { user_id: 'other-user' };
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockNeq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq3 = jest.fn(() => ({ neq: mockNeq }));
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await siretVerificationService.isSiretAlreadyUsed('12345678901234', 'user-123');

    expect(result).toBe(true);
  });

  test('returns false when SIRET is not used', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockNeq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq3 = jest.fn(() => ({ neq: mockNeq }));
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await siretVerificationService.isSiretAlreadyUsed('12345678901234', 'user-123');

    expect(result).toBe(false);
  });

  test('cleans spaces from SIRET before checking', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockNeq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq3 = jest.fn(() => ({ neq: mockNeq }));
    const mockEq2 = jest.fn(() => ({ eq: mockEq3 }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    await siretVerificationService.isSiretAlreadyUsed('123 456 789 01234', 'user-123');

    // Vérifie que le SIRET nettoyé est utilisé
    expect(mockEq2).toHaveBeenCalledWith('document_reference', '12345678901234');
  });
});
