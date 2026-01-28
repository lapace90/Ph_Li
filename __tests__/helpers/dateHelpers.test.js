import {
  formatRelativeTime,
  formatShortDate,
  formatFullDate,
  isToday,
  isThisWeek,
} from '../../helpers/dateHelpers';

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-06-15T10:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

// ============================================
// formatRelativeTime
// ============================================

describe('formatRelativeTime', () => {
  test('returns empty string for null', () => {
    expect(formatRelativeTime(null)).toBe('');
  });

  test('returns A l\'instant for 30 seconds ago', () => {
    const date = new Date('2025-06-15T09:59:30Z');
    expect(formatRelativeTime(date)).toBe("À l'instant");
  });

  test('returns minutes for 5 minutes ago', () => {
    const date = new Date('2025-06-15T09:55:00Z');
    expect(formatRelativeTime(date)).toBe('Il y a 5 min');
  });

  test('returns hours for 3 hours ago', () => {
    const date = new Date('2025-06-15T07:00:00Z');
    expect(formatRelativeTime(date)).toBe('Il y a 3h');
  });

  test('returns Hier for 1 day ago', () => {
    const date = new Date('2025-06-14T10:00:00Z');
    expect(formatRelativeTime(date)).toBe('Hier');
  });

  test('returns days for 4 days ago', () => {
    const date = new Date('2025-06-11T10:00:00Z');
    expect(formatRelativeTime(date)).toBe('Il y a 4 jours');
  });

  test('returns 1 semaine for 7 days ago', () => {
    const date = new Date('2025-06-08T10:00:00Z');
    expect(formatRelativeTime(date)).toBe('Il y a 1 semaine');
  });

  test('returns weeks for 21 days ago', () => {
    const date = new Date('2025-05-25T10:00:00Z');
    expect(formatRelativeTime(date)).toBe('Il y a 3 semaines');
  });

  test('returns 1 mois for ~31 days ago', () => {
    const date = new Date('2025-05-15T10:00:00Z');
    expect(formatRelativeTime(date)).toBe('Il y a 1 mois');
  });

  test('returns months for 6 months ago', () => {
    const date = new Date('2024-12-15T10:00:00Z');
    expect(formatRelativeTime(date)).toBe('Il y a 6 mois');
  });

  test('returns locale date for 400+ days ago', () => {
    const date = new Date('2024-01-01T10:00:00Z');
    const result = formatRelativeTime(date);
    expect(result).toBeTruthy();
    expect(result).not.toContain('Il y a');
  });
});

// ============================================
// formatShortDate
// ============================================

describe('formatShortDate', () => {
  test('returns empty string for null', () => {
    expect(formatShortDate(null)).toBe('');
  });

  test('formats short date', () => {
    const result = formatShortDate('2025-01-15');
    expect(result).toBeTruthy();
    expect(result).toContain('15');
  });
});

// ============================================
// formatFullDate
// ============================================

describe('formatFullDate', () => {
  test('returns empty string for null', () => {
    expect(formatFullDate(null)).toBe('');
  });

  test('formats full date', () => {
    const result = formatFullDate('2025-03-15');
    expect(result).toBeTruthy();
    expect(result).toContain('15');
    expect(result).toContain('2025');
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
});

// ============================================
// isThisWeek
// ============================================

describe('isThisWeek', () => {
  test('returns false for null', () => {
    expect(isThisWeek(null)).toBe(false);
  });

  test('returns true for 3 days ago', () => {
    expect(isThisWeek('2025-06-12T10:00:00Z')).toBe(true);
  });

  test('returns false for 10 days ago', () => {
    expect(isThisWeek('2025-06-05T10:00:00Z')).toBe(false);
  });
});
