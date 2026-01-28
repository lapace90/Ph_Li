import {
  getDisplayName,
  getDisplayNameFromPrivacy,
  getInitials,
} from '../../helpers/displayName';

// ============================================
// getDisplayName
// ============================================

describe('getDisplayName', () => {
  test('returns Utilisateur for null profile', () => {
    expect(getDisplayName(null)).toBe('Utilisateur');
  });

  test('returns Utilisateur for undefined profile', () => {
    expect(getDisplayName(undefined)).toBe('Utilisateur');
  });

  test('returns full name in public mode', () => {
    expect(getDisplayName({ first_name: 'Marie', last_name: 'Durand' }, false))
      .toBe('Marie Durand');
  });

  test('returns Utilisateur for empty names in public mode', () => {
    expect(getDisplayName({ first_name: '', last_name: '' }, false))
      .toBe('Utilisateur');
  });

  test('returns nickname in anonymous mode', () => {
    expect(getDisplayName({ first_name: 'Marie', last_name: 'Durand', nickname: 'PharmaPro75' }, true))
      .toBe('PharmaPro75');
  });

  test('returns first_name in anonymous mode without nickname', () => {
    expect(getDisplayName({ first_name: 'Marie', last_name: 'Durand' }, true))
      .toBe('Marie');
  });

  test('returns Utilisateur in anonymous mode without nickname or first_name', () => {
    expect(getDisplayName({ last_name: 'Durand' }, true))
      .toBe('Utilisateur');
  });

  test('returns first_name only when last_name is missing', () => {
    expect(getDisplayName({ first_name: 'Marie' }, false))
      .toBe('Marie');
  });
});

// ============================================
// getDisplayNameFromPrivacy
// ============================================

describe('getDisplayNameFromPrivacy', () => {
  const profile = { first_name: 'Marie', last_name: 'Durand', nickname: 'PharmaPro75' };

  test('uses full name when show_full_name is true', () => {
    expect(getDisplayNameFromPrivacy(profile, { show_full_name: true }))
      .toBe('Marie Durand');
  });

  test('uses anonymous mode when show_full_name is false', () => {
    expect(getDisplayNameFromPrivacy(profile, { show_full_name: false }))
      .toBe('PharmaPro75');
  });

  test('uses anonymous mode when privacy is null', () => {
    expect(getDisplayNameFromPrivacy(profile, null))
      .toBe('PharmaPro75');
  });

  test('uses anonymous mode when privacy is undefined', () => {
    expect(getDisplayNameFromPrivacy(profile, undefined))
      .toBe('PharmaPro75');
  });
});

// ============================================
// getInitials
// ============================================

describe('getInitials', () => {
  test('returns initials from full name', () => {
    expect(getInitials({ first_name: 'Marie', last_name: 'Durand' }, false))
      .toBe('MD');
  });

  test('returns first 2 chars of nickname in anonymous mode', () => {
    expect(getInitials({ first_name: 'Marie', nickname: 'PharmaPro75' }, true))
      .toBe('PH');
  });

  test('returns first 2 chars of first_name in anonymous mode without nickname', () => {
    expect(getInitials({ first_name: 'Marie' }, true))
      .toBe('MA');
  });

  test('returns UT for null profile (from Utilisateur)', () => {
    expect(getInitials(null, false))
      .toBe('UT');
  });

  test('handles multi-part name correctly', () => {
    expect(getInitials({ first_name: 'Jean-Pierre', last_name: 'Lefebvre' }, false))
      .toBe('JL');
  });
});
