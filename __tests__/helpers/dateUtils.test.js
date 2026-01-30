import {
  formatDistanceToNow,
  formatDate,
  formatDateShort,
  formatDateRange,
  formatTime,
  formatDateTime,
  isPast,
  isToday,
  daysBetween,
  formatConversationTime,
  formatRelativeDate,
  getExpirationStatus,
  formatExpiration,
  formatPublishedAgo,
  formatPublishedAgoShort,
} from '../../helpers/dateUtils';

// Pin time for all relative date tests
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-06-15T10:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

// ============================================
// formatDistanceToNow
// ============================================

describe('formatDistanceToNow', () => {
  test('returns empty string for null', () => {
    expect(formatDistanceToNow(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(formatDistanceToNow(undefined)).toBe('');
  });

  test('returns "a l\'instant" for 30 seconds ago', () => {
    const date = new Date('2025-06-15T09:59:30Z');
    expect(formatDistanceToNow(date)).toBe("à l'instant");
  });

  test('returns minutes for 5 minutes ago', () => {
    const date = new Date('2025-06-15T09:55:00Z');
    expect(formatDistanceToNow(date)).toBe('il y a 5 min');
  });

  test('returns hours for 3 hours ago', () => {
    const date = new Date('2025-06-15T07:00:00Z');
    expect(formatDistanceToNow(date)).toBe('il y a 3h');
  });

  test('returns hier for 1 day ago', () => {
    const date = new Date('2025-06-14T10:00:00Z');
    expect(formatDistanceToNow(date)).toBe('hier');
  });

  test('returns days for 4 days ago', () => {
    const date = new Date('2025-06-11T10:00:00Z');
    expect(formatDistanceToNow(date)).toBe('il y a 4 jours');
  });

  test('returns 1 semaine for 7 days ago', () => {
    const date = new Date('2025-06-08T10:00:00Z');
    expect(formatDistanceToNow(date)).toBe('il y a 1 semaine');
  });

  test('returns weeks for 14 days ago', () => {
    const date = new Date('2025-06-01T10:00:00Z');
    expect(formatDistanceToNow(date)).toBe('il y a 2 semaines');
  });

  test('returns 1 mois for ~31 days ago', () => {
    const date = new Date('2025-05-15T10:00:00Z');
    expect(formatDistanceToNow(date)).toBe('il y a 1 mois');
  });

  test('returns months for 6 months ago', () => {
    const date = new Date('2024-12-15T10:00:00Z');
    const result = formatDistanceToNow(date);
    expect(result).toBe('il y a 6 mois');
  });

  test('returns locale date for 400+ days ago', () => {
    const date = new Date('2024-01-01T10:00:00Z');
    const result = formatDistanceToNow(date);
    // Should be a locale date string, not a relative time
    expect(result).toBeTruthy();
    expect(result).not.toContain('il y a');
  });
});

// ============================================
// formatDate
// ============================================

describe('formatDate', () => {
  test('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  test('formats date in French', () => {
    const result = formatDate('2025-03-15');
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });

  test('respects custom options', () => {
    const result = formatDate('2025-03-15', { month: 'short' });
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });
});

// ============================================
// formatDateShort
// ============================================

describe('formatDateShort', () => {
  test('returns empty string for null', () => {
    expect(formatDateShort(null)).toBe('');
  });

  test('formats short date', () => {
    const result = formatDateShort('2025-01-15');
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });
});

// ============================================
// formatDateRange
// ============================================

describe('formatDateRange', () => {
  test('returns Dates flexibles when startDate is null', () => {
    expect(formatDateRange(null, '2025-06-20')).toBe('Dates flexibles');
  });

  test('returns only start when endDate is null', () => {
    const result = formatDateRange('2025-06-15', null);
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });

  test('returns range with arrow', () => {
    const result = formatDateRange('2025-06-15', '2025-06-20');
    expect(result).toContain('→');
    expect(result).toContain('15');
    expect(result).toContain('20');
  });
});

// ============================================
// formatTime
// ============================================

describe('formatTime', () => {
  test('returns empty string for null', () => {
    expect(formatTime(null)).toBe('');
  });

  test('formats time', () => {
    const result = formatTime('2025-06-15T14:30:00Z');
    expect(result).toBeTruthy();
  });
});

// ============================================
// formatDateTime
// ============================================

describe('formatDateTime', () => {
  test('returns empty string for null', () => {
    expect(formatDateTime(null)).toBe('');
  });

  test('formats date and time', () => {
    const result = formatDateTime('2025-06-15T14:30:00Z');
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });
});

// ============================================
// isPast
// ============================================

describe('isPast', () => {
  test('returns false for null', () => {
    expect(isPast(null)).toBe(false);
  });

  test('returns true for past date', () => {
    expect(isPast('2024-01-01')).toBe(true);
  });

  test('returns false for future date', () => {
    expect(isPast('2026-01-01')).toBe(false);
  });
});

// ============================================
// isToday
// ============================================

describe('isToday', () => {
  test('returns false for null', () => {
    expect(isToday(null)).toBe(false);
  });

  test('returns true for today', () => {
    expect(isToday('2025-06-15T08:00:00Z')).toBe(true);
  });

  test('returns false for yesterday', () => {
    expect(isToday('2025-06-14T10:00:00Z')).toBe(false);
  });

  test('returns true for today at different time', () => {
    expect(isToday('2025-06-15T23:59:00Z')).toBe(true);
  });
});

// ============================================
// daysBetween
// ============================================

describe('daysBetween', () => {
  test('returns 0 when startDate is null', () => {
    expect(daysBetween(null, '2025-06-20')).toBe(0);
  });

  test('returns 0 when endDate is null', () => {
    expect(daysBetween('2025-06-15', null)).toBe(0);
  });

  test('returns 1 for consecutive dates', () => {
    expect(daysBetween('2025-06-15', '2025-06-16')).toBe(1);
  });

  test('returns 30 for a 30-day span', () => {
    expect(daysBetween('2025-06-01', '2025-07-01')).toBe(30);
  });

  test('returns negative for reversed dates', () => {
    expect(daysBetween('2025-06-20', '2025-06-15')).toBeLessThan(0);
  });
});

// ============================================
// formatConversationTime
// ============================================

describe('formatConversationTime', () => {
  test('returns empty string for null', () => {
    expect(formatConversationTime(null)).toBe('');
  });

  test('returns time for today', () => {
    const result = formatConversationTime('2025-06-15T08:30:00Z');
    expect(result).toBeTruthy();
  });

  test('returns Hier for yesterday', () => {
    expect(formatConversationTime('2025-06-14T08:30:00Z')).toBe('Hier');
  });

  test('returns weekday for 3 days ago', () => {
    const result = formatConversationTime('2025-06-12T08:30:00Z');
    expect(result).toBeTruthy();
    expect(result).not.toBe('Hier');
  });

  test('returns short date for 10 days ago', () => {
    const result = formatConversationTime('2025-06-05T08:30:00Z');
    expect(result).toBeTruthy();
    expect(result).toContain('5');
  });
});

// ============================================
// formatRelativeDate
// ============================================

describe('formatRelativeDate', () => {
  test('returns empty string for null', () => {
    expect(formatRelativeDate(null)).toBe('');
  });

  test('returns Aujourd\'hui for today', () => {
    expect(formatRelativeDate('2025-06-15T08:00:00Z')).toBe("Aujourd'hui");
  });

  test('returns Demain for tomorrow', () => {
    expect(formatRelativeDate('2025-06-16T08:00:00Z')).toBe('Demain');
  });

  test('returns formatted date for 5 days from now', () => {
    const result = formatRelativeDate('2025-06-20T08:00:00Z');
    expect(result).toBeTruthy();
    expect(result).toContain('20');
  });
});

// ============================================
// getExpirationStatus
// ============================================

describe('getExpirationStatus', () => {
  test('returns default object for null', () => {
    const result = getExpirationStatus(null);
    expect(result).toEqual({
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: null,
      label: '',
    });
  });

  test('returns isExpired true for past date', () => {
    const result = getExpirationStatus('2025-06-10T10:00:00Z');
    expect(result.isExpired).toBe(true);
    expect(result.daysRemaining).toBe(0);
    expect(result.label).toBe('Expirée');
  });

  test('returns Expire demain for 1 day remaining', () => {
    const result = getExpirationStatus('2025-06-16T10:00:00Z');
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(true);
    expect(result.daysRemaining).toBe(1);
    expect(result.label).toBe('Expire demain');
  });

  test('returns isExpiringSoon for 5 days remaining', () => {
    const result = getExpirationStatus('2025-06-20T10:00:00Z');
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(true);
    expect(result.daysRemaining).toBe(5);
    expect(result.label).toBe('Expire dans 5 jours');
  });

  test('returns jours restants for 10 days remaining', () => {
    const result = getExpirationStatus('2025-06-25T10:00:00Z');
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.daysRemaining).toBe(10);
    expect(result.label).toBe('10 jours restants');
  });

  test('returns Expire le for more than 14 days', () => {
    const result = getExpirationStatus('2025-07-15T10:00:00Z');
    expect(result.isExpired).toBe(false);
    expect(result.isExpiringSoon).toBe(false);
    expect(result.label).toContain('Expire le');
  });
});

// ============================================
// formatExpiration
// ============================================

describe('formatExpiration', () => {
  test('returns empty string for null', () => {
    expect(formatExpiration(null)).toBe('');
  });

  test('returns Expirée for past date', () => {
    expect(formatExpiration('2025-06-10T10:00:00Z')).toBe('Expirée');
  });

  test('returns label for valid future date', () => {
    const result = formatExpiration('2025-06-20T10:00:00Z');
    expect(result).toBe('Expire dans 5 jours');
  });
});

// ============================================
// formatPublishedAgo
// ============================================

describe('formatPublishedAgo', () => {
  test('returns empty string for null', () => {
    expect(formatPublishedAgo(null)).toBe('');
  });

  test('returns "Publiée aujourd\'hui" for today', () => {
    expect(formatPublishedAgo('2025-06-15T08:00:00Z')).toBe("Publiée aujourd'hui");
  });

  test('returns "Publiée hier" for yesterday', () => {
    expect(formatPublishedAgo('2025-06-14T10:00:00Z')).toBe('Publiée hier');
  });

  test('returns "Publiée il y a X jours" for 3 days ago', () => {
    expect(formatPublishedAgo('2025-06-12T10:00:00Z')).toBe('Publiée il y a 3 jours');
  });

  test('returns "Publiée il y a 1 semaine" for 7 days ago', () => {
    expect(formatPublishedAgo('2025-06-08T10:00:00Z')).toBe('Publiée il y a 1 semaine');
  });

  test('returns "Publiée il y a X semaines" for 14 days ago', () => {
    expect(formatPublishedAgo('2025-06-01T10:00:00Z')).toBe('Publiée il y a 2 semaines');
  });

  test('returns "Publiée il y a 1 mois" for ~31 days ago', () => {
    expect(formatPublishedAgo('2025-05-15T10:00:00Z')).toBe('Publiée il y a 1 mois');
  });

  test('returns "Publiée il y a X mois" for several months ago', () => {
    const result = formatPublishedAgo('2025-02-15T10:00:00Z');
    expect(result).toBe('Publiée il y a 4 mois');
  });

  test('returns "Publiée le ..." for very old dates', () => {
    const result = formatPublishedAgo('2024-01-15T10:00:00Z');
    expect(result).toContain('Publiée le');
  });
});

// ============================================
// formatPublishedAgoShort
// ============================================

describe('formatPublishedAgoShort', () => {
  test('returns empty string for null', () => {
    expect(formatPublishedAgoShort(null)).toBe('');
  });

  test('returns "Aujourd\'hui" for today', () => {
    expect(formatPublishedAgoShort('2025-06-15T08:00:00Z')).toBe("Aujourd'hui");
  });

  test('returns "Hier" for yesterday', () => {
    expect(formatPublishedAgoShort('2025-06-14T10:00:00Z')).toBe('Hier');
  });

  test('returns "3j" for 3 days ago', () => {
    expect(formatPublishedAgoShort('2025-06-12T10:00:00Z')).toBe('3j');
  });

  test('returns "1 sem." for 7 days ago', () => {
    expect(formatPublishedAgoShort('2025-06-08T10:00:00Z')).toBe('1 sem.');
  });

  test('returns "2 sem." for 14 days ago', () => {
    expect(formatPublishedAgoShort('2025-06-01T10:00:00Z')).toBe('2 sem.');
  });

  test('returns "1 mois" for ~31 days ago', () => {
    expect(formatPublishedAgoShort('2025-05-15T10:00:00Z')).toBe('1 mois');
  });

  test('returns formatted date for very old dates', () => {
    const result = formatPublishedAgoShort('2024-01-15T10:00:00Z');
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });
});
