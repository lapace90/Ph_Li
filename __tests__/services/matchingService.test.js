import { matchingService } from '../../services/matchingService';

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
