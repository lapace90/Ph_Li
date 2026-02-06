import { blockService } from '../../services/blockService';
import { supabase } from '../../lib/supabase';

beforeEach(() => {
  jest.clearAllMocks();
});

// ============================================
// blockUser
// ============================================

describe('blockService.blockUser', () => {
  test('blocks a user successfully', async () => {
    const mockData = { id: 'block-1', blocker_id: 'user-1', blocked_id: 'user-2' };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    const result = await blockService.blockUser('user-1', 'user-2');

    expect(supabase.from).toHaveBeenCalledWith('user_blocks');
    expect(mockInsert).toHaveBeenCalledWith({
      blocker_id: 'user-1',
      blocked_id: 'user-2',
    });
    expect(result).toEqual(mockData);
  });

  test('throws error when blocking self', async () => {
    await expect(blockService.blockUser('user-1', 'user-1'))
      .rejects.toThrow('Vous ne pouvez pas vous bloquer vous-même');
  });

  test('throws error when user already blocked (duplicate)', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key' }
    });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    await expect(blockService.blockUser('user-1', 'user-2'))
      .rejects.toThrow('Cet utilisateur est déjà bloqué');
  });

  test('throws other database errors', async () => {
    const dbError = new Error('Database connection failed');
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: dbError });
    const mockSelect = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelect }));
    supabase.from.mockReturnValue({ insert: mockInsert });

    await expect(blockService.blockUser('user-1', 'user-2'))
      .rejects.toThrow('Database connection failed');
  });
});

// ============================================
// unblockUser
// ============================================

describe('blockService.unblockUser', () => {
  test('unblocks a user successfully', async () => {
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockDelete = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ delete: mockDelete });

    const result = await blockService.unblockUser('user-1', 'user-2');

    expect(supabase.from).toHaveBeenCalledWith('user_blocks');
    expect(mockEq1).toHaveBeenCalledWith('blocker_id', 'user-1');
    expect(mockEq2).toHaveBeenCalledWith('blocked_id', 'user-2');
    expect(result).toBe(true);
  });

  test('throws error on database failure', async () => {
    const dbError = new Error('Delete failed');
    const mockEq2 = jest.fn().mockResolvedValue({ error: dbError });
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockDelete = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ delete: mockDelete });

    await expect(blockService.unblockUser('user-1', 'user-2'))
      .rejects.toThrow('Delete failed');
  });
});

// ============================================
// isBlocked
// ============================================

describe('blockService.isBlocked', () => {
  test('returns true when user is blocked', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'block-1' }, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await blockService.isBlocked('user-1', 'user-2');

    expect(result).toBe(true);
  });

  test('returns false when user is not blocked', async () => {
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await blockService.isBlocked('user-1', 'user-2');

    expect(result).toBe(false);
  });

  test('throws error on database failure', async () => {
    const dbError = new Error('Query failed');
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: dbError });
    const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
    const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
    supabase.from.mockReturnValue({ select: mockSelect });

    await expect(blockService.isBlocked('user-1', 'user-2'))
      .rejects.toThrow('Query failed');
  });
});

// ============================================
// areUsersBlocked (RPC)
// ============================================

describe('blockService.areUsersBlocked', () => {
  test('returns true when users are blocked', async () => {
    supabase.rpc.mockResolvedValue({ data: true, error: null });

    const result = await blockService.areUsersBlocked('user-1', 'user-2');

    expect(supabase.rpc).toHaveBeenCalledWith('are_users_blocked', { user_a: 'user-1', user_b: 'user-2' });
    expect(result).toBe(true);
  });

  test('returns false when users are not blocked', async () => {
    supabase.rpc.mockResolvedValue({ data: false, error: null });

    const result = await blockService.areUsersBlocked('user-1', 'user-2');

    expect(result).toBe(false);
  });

  test('throws error on RPC failure', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC failed') });

    await expect(blockService.areUsersBlocked('user-1', 'user-2'))
      .rejects.toThrow('RPC failed');
  });
});

// ============================================
// toggleBlock
// ============================================

describe('blockService.toggleBlock', () => {
  test('blocks user when not blocked', async () => {
    // Mock isBlocked -> false
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq2IsBlocked = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1IsBlocked = jest.fn(() => ({ eq: mockEq2IsBlocked }));
    const mockSelectIsBlocked = jest.fn(() => ({ eq: mockEq1IsBlocked }));

    // Mock blockUser
    const mockBlockData = { id: 'block-1', blocker_id: 'user-1', blocked_id: 'user-2' };
    const mockSingle = jest.fn().mockResolvedValue({ data: mockBlockData, error: null });
    const mockSelectBlock = jest.fn(() => ({ single: mockSingle }));
    const mockInsert = jest.fn(() => ({ select: mockSelectBlock }));

    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectIsBlocked };
      }
      return { insert: mockInsert };
    });

    const result = await blockService.toggleBlock('user-1', 'user-2');

    expect(result).toEqual({ blocked: true });
  });

  test('unblocks user when already blocked', async () => {
    // Mock isBlocked -> true
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: { id: 'block-1' }, error: null });
    const mockEq2IsBlocked = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockEq1IsBlocked = jest.fn(() => ({ eq: mockEq2IsBlocked }));
    const mockSelectIsBlocked = jest.fn(() => ({ eq: mockEq1IsBlocked }));

    // Mock unblockUser
    const mockEq2Delete = jest.fn().mockResolvedValue({ error: null });
    const mockEq1Delete = jest.fn(() => ({ eq: mockEq2Delete }));
    const mockDelete = jest.fn(() => ({ eq: mockEq1Delete }));

    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { select: mockSelectIsBlocked };
      }
      return { delete: mockDelete };
    });

    const result = await blockService.toggleBlock('user-1', 'user-2');

    expect(result).toEqual({ blocked: false });
  });
});

// ============================================
// getBlockedUsers
// ============================================

describe('blockService.getBlockedUsers', () => {
  test('returns list of blocked users', async () => {
    const mockData = [
      { id: 'block-1', blocked_id: 'user-2', created_at: '2025-01-01', blocked_user: { id: 'user-2', first_name: 'John' } },
      { id: 'block-2', blocked_id: 'user-3', created_at: '2025-01-02', blocked_user: { id: 'user-3', first_name: 'Jane' } },
    ];
    const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await blockService.getBlockedUsers('user-1');

    expect(result).toEqual(mockData);
    expect(mockEq).toHaveBeenCalledWith('blocker_id', 'user-1');
  });

  test('returns empty array when no blocked users', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await blockService.getBlockedUsers('user-1');

    expect(result).toEqual([]);
  });

  test('throws error on database failure', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('Query failed') });
    const mockEq = jest.fn(() => ({ order: mockOrder }));
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    await expect(blockService.getBlockedUsers('user-1'))
      .rejects.toThrow('Query failed');
  });
});

// ============================================
// getBlockedUserIds (RPC)
// ============================================

describe('blockService.getBlockedUserIds', () => {
  test('returns list of blocked user IDs', async () => {
    supabase.rpc.mockResolvedValue({ data: ['user-2', 'user-3'], error: null });

    const result = await blockService.getBlockedUserIds('user-1');

    expect(supabase.rpc).toHaveBeenCalledWith('get_blocked_user_ids', { user_id: 'user-1' });
    expect(result).toEqual(['user-2', 'user-3']);
  });

  test('returns empty array when no blocked users', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await blockService.getBlockedUserIds('user-1');

    expect(result).toEqual([]);
  });

  test('throws error on RPC failure', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: new Error('RPC failed') });

    await expect(blockService.getBlockedUserIds('user-1'))
      .rejects.toThrow('RPC failed');
  });
});

// ============================================
// getBlockedUserIdsSimple
// ============================================

describe('blockService.getBlockedUserIdsSimple', () => {
  test('returns combined list of blocked and blocker IDs', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: users I blocked
        const mockEq = jest.fn().mockResolvedValue({
          data: [{ blocked_id: 'user-2' }, { blocked_id: 'user-3' }],
          error: null
        });
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        return { select: mockSelect };
      } else {
        // Second call: users who blocked me
        const mockEq = jest.fn().mockResolvedValue({
          data: [{ blocker_id: 'user-4' }],
          error: null
        });
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        return { select: mockSelect };
      }
    });

    const result = await blockService.getBlockedUserIdsSimple('user-1');

    expect(result).toContain('user-2');
    expect(result).toContain('user-3');
    expect(result).toContain('user-4');
    expect(result.length).toBe(3);
  });

  test('removes duplicates when same user in both lists', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const mockEq = jest.fn().mockResolvedValue({
          data: [{ blocked_id: 'user-2' }],
          error: null
        });
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        return { select: mockSelect };
      } else {
        const mockEq = jest.fn().mockResolvedValue({
          data: [{ blocker_id: 'user-2' }],
          error: null
        });
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        return { select: mockSelect };
      }
    });

    const result = await blockService.getBlockedUserIdsSimple('user-1');

    // user-2 appears in both lists but should only appear once
    expect(result).toEqual(['user-2']);
  });

  test('returns empty array when no blocks', async () => {
    supabase.from.mockImplementation(() => {
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      return { select: mockSelect };
    });

    const result = await blockService.getBlockedUserIdsSimple('user-1');

    expect(result).toEqual([]);
  });

  test('throws error on first query failure', async () => {
    supabase.from.mockImplementation(() => {
      const mockEq = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Query 1 failed')
      });
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      return { select: mockSelect };
    });

    await expect(blockService.getBlockedUserIdsSimple('user-1'))
      .rejects.toThrow('Query 1 failed');
  });

  test('throws error on second query failure', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        return { select: mockSelect };
      } else {
        const mockEq = jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Query 2 failed')
        });
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        return { select: mockSelect };
      }
    });

    await expect(blockService.getBlockedUserIdsSimple('user-1'))
      .rejects.toThrow('Query 2 failed');
  });
});

// ============================================
// getBlockedCount
// ============================================

describe('blockService.getBlockedCount', () => {
  test('returns count of blocked users', async () => {
    const mockEq = jest.fn().mockResolvedValue({ count: 5, error: null });
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await blockService.getBlockedCount('user-1');

    expect(result).toBe(5);
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(mockEq).toHaveBeenCalledWith('blocker_id', 'user-1');
  });

  test('returns 0 when no blocked users', async () => {
    const mockEq = jest.fn().mockResolvedValue({ count: null, error: null });
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    const result = await blockService.getBlockedCount('user-1');

    expect(result).toBe(0);
  });

  test('throws error on database failure', async () => {
    const mockEq = jest.fn().mockResolvedValue({ count: null, error: new Error('Count failed') });
    const mockSelect = jest.fn(() => ({ eq: mockEq }));
    supabase.from.mockReturnValue({ select: mockSelect });

    await expect(blockService.getBlockedCount('user-1'))
      .rejects.toThrow('Count failed');
  });
});

// ============================================
// filterBlockedUsers
// ============================================

describe('blockService.filterBlockedUsers', () => {
  test('filters out blocked users from list', async () => {
    // Mock getBlockedUserIdsSimple
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const mockEq = jest.fn().mockResolvedValue({
          data: [{ blocked_id: 'user-2' }],
          error: null
        });
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        return { select: mockSelect };
      } else {
        const mockEq = jest.fn().mockResolvedValue({
          data: [{ blocker_id: 'user-4' }],
          error: null
        });
        const mockSelect = jest.fn(() => ({ eq: mockEq }));
        return { select: mockSelect };
      }
    });

    const users = [
      { id: 'user-2', name: 'Blocked User' },
      { id: 'user-3', name: 'Normal User' },
      { id: 'user-4', name: 'Blocker User' },
      { id: 'user-5', name: 'Another User' },
    ];

    const result = await blockService.filterBlockedUsers('user-1', users);

    expect(result).toHaveLength(2);
    expect(result.find(u => u.id === 'user-3')).toBeDefined();
    expect(result.find(u => u.id === 'user-5')).toBeDefined();
    expect(result.find(u => u.id === 'user-2')).toBeUndefined();
    expect(result.find(u => u.id === 'user-4')).toBeUndefined();
  });

  test('returns same list when no users are blocked', async () => {
    supabase.from.mockImplementation(() => {
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      return { select: mockSelect };
    });

    const users = [
      { id: 'user-2', name: 'User 2' },
      { id: 'user-3', name: 'User 3' },
    ];

    const result = await blockService.filterBlockedUsers('user-1', users);

    expect(result).toHaveLength(2);
  });

  test('returns empty array when input is empty', async () => {
    const result = await blockService.filterBlockedUsers('user-1', []);
    expect(result).toEqual([]);
  });

  test('returns input when input is null', async () => {
    const result = await blockService.filterBlockedUsers('user-1', null);
    expect(result).toBeNull();
  });
});

// ============================================
// canInteractWith
// ============================================

describe('blockService.canInteractWith', () => {
  test('returns true when users are not blocked', async () => {
    supabase.rpc.mockResolvedValue({ data: false, error: null });

    const result = await blockService.canInteractWith('user-1', 'user-2');

    expect(result).toBe(true);
  });

  test('returns false when users are blocked', async () => {
    supabase.rpc.mockResolvedValue({ data: true, error: null });

    const result = await blockService.canInteractWith('user-1', 'user-2');

    expect(result).toBe(false);
  });
});
