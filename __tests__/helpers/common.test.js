// Dimensions is mocked in jest.setup.js to return { width: 375, height: 812 }
import { hp, wp } from '../../helpers/common';

describe('hp (height percentage)', () => {
  test('hp(100) returns full height', () => {
    expect(hp(100)).toBe(812);
  });

  test('hp(50) returns half height', () => {
    expect(hp(50)).toBe(406);
  });

  test('hp(0) returns 0', () => {
    expect(hp(0)).toBe(0);
  });
});

describe('wp (width percentage)', () => {
  test('wp(100) returns full width', () => {
    expect(wp(100)).toBe(375);
  });

  test('wp(50) returns half width', () => {
    expect(wp(50)).toBe(187.5);
  });

  test('wp(0) returns 0', () => {
    expect(wp(0)).toBe(0);
  });
});
