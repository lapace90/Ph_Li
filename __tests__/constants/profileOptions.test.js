import {
  getAnimatorBadge,
  getSubscriptionTiers,
  getSubscriptionTier,
  getSubscriptionLimits,
  checkLimit,
  canPublish,
  canSendAlert,
  canSuperLike,
  getNextTier,
  getMissionStatus,
  getCandidateTypes,
  getRecruiterTypes,
  getFreelanceTypes,
  getBusinessTypes,
  getPharmacyGroupLabel,
  getPharmacyGroupsByType,
  getPharmacyEnvironmentLabel,
  getAnimationSpecialtyLabel,
  getProductCategoryLabel,
  getMissionTypeLabel,
  getMissionStatusInfo,
  REVIEW_CRITERIA_ANIMATOR,
  REVIEW_CRITERIA_CLIENT,
} from '../../constants/profileOptions';

// ============================================
// getAnimatorBadge
// ============================================

describe('getAnimatorBadge', () => {
  test('returns Nouveau for 0 missions', () => {
    expect(getAnimatorBadge(0).label).toBe('Nouveau');
  });

  test('returns Animateur for 1 mission', () => {
    expect(getAnimatorBadge(1).label).toBe('Animateur');
  });

  test('returns Animateur for 10 missions', () => {
    expect(getAnimatorBadge(10).label).toBe('Animateur');
  });

  test('returns Confirmé for 11 missions', () => {
    expect(getAnimatorBadge(11).label).toBe('Confirmé');
  });

  test('returns Expert for 51 missions', () => {
    expect(getAnimatorBadge(51).label).toBe('Expert');
  });

  test('returns Top Animateur for 200 missions', () => {
    expect(getAnimatorBadge(200).label).toBe('Top Animateur');
  });
});

// ============================================
// getSubscriptionTiers
// ============================================

describe('getSubscriptionTiers', () => {
  test('laboratoire has 4 tiers', () => {
    expect(getSubscriptionTiers('laboratoire')).toHaveLength(4);
  });

  test('titulaire has 3 tiers', () => {
    expect(getSubscriptionTiers('titulaire')).toHaveLength(3);
  });

  test('preparateur has 2 tiers', () => {
    expect(getSubscriptionTiers('preparateur')).toHaveLength(2);
  });

  test('etudiant has 2 tiers', () => {
    expect(getSubscriptionTiers('etudiant')).toHaveLength(2);
  });

  test('unknown type falls back to candidat tiers (2)', () => {
    expect(getSubscriptionTiers('unknown')).toHaveLength(2);
  });
});

// ============================================
// getSubscriptionTier
// ============================================

describe('getSubscriptionTier', () => {
  test('returns starter tier for laboratoire', () => {
    const tier = getSubscriptionTier('laboratoire', 'starter');
    expect(tier.value).toBe('starter');
    expect(tier.price).toBe(49);
  });

  test('returns pro tier for titulaire', () => {
    const tier = getSubscriptionTier('titulaire', 'pro');
    expect(tier.value).toBe('pro');
    expect(tier.price).toBe(29);
  });

  test('falls back to first tier for unknown value', () => {
    const tier = getSubscriptionTier('laboratoire', 'nonexistent');
    expect(tier.value).toBe('free');
  });
});

// ============================================
// getSubscriptionLimits
// ============================================

describe('getSubscriptionLimits', () => {
  test('free labo has specific limits', () => {
    const limits = getSubscriptionLimits('laboratoire', 'free');
    expect(limits.missions).toBe(1);
    expect(limits.favorites).toBe(3);
    expect(limits.superLikesPerDay).toBe(3);
  });

  test('business labo has Infinity limits', () => {
    const limits = getSubscriptionLimits('laboratoire', 'business');
    expect(limits.missions).toBe(Infinity);
    expect(limits.favorites).toBe(Infinity);
  });
});

// ============================================
// checkLimit
// ============================================

describe('checkLimit', () => {
  test('returns true when under limit', () => {
    expect(checkLimit('laboratoire', 'free', 'missions', 0)).toBe(true);
  });

  test('returns false when at limit', () => {
    expect(checkLimit('laboratoire', 'free', 'missions', 1)).toBe(false);
  });

  test('returns true for Infinity limit', () => {
    expect(checkLimit('laboratoire', 'business', 'missions', 999)).toBe(true);
  });

  test('returns true when limitKey is undefined', () => {
    expect(checkLimit('laboratoire', 'free', 'nonexistent', 0)).toBe(true);
  });

  test('returns true when currentCount is 0 and limit is 1', () => {
    expect(checkLimit('laboratoire', 'free', 'missions', 0)).toBe(true);
  });
});

// ============================================
// canPublish
// ============================================

describe('canPublish', () => {
  test('labo free with 0 missions can publish', () => {
    expect(canPublish('laboratoire', 'free', 0)).toBe(true);
  });

  test('labo free with 1 mission cannot publish', () => {
    expect(canPublish('laboratoire', 'free', 1)).toBe(false);
  });

  test('titulaire free with 0 offers can publish', () => {
    expect(canPublish('titulaire', 'free', 0)).toBe(true);
  });

  test('titulaire free with 1 offer cannot publish', () => {
    expect(canPublish('titulaire', 'free', 1)).toBe(false);
  });

  test('candidates cannot publish', () => {
    expect(canPublish('preparateur', 'free', 0)).toBe(false);
  });
});

// ============================================
// canSendAlert
// ============================================

describe('canSendAlert', () => {
  test('titulaire free with 0 alerts can send', () => {
    expect(canSendAlert('titulaire', 'free', 0)).toBe(true);
  });

  test('titulaire free with 1 alert cannot send', () => {
    expect(canSendAlert('titulaire', 'free', 1)).toBe(false);
  });

  test('non-titulaire always returns true', () => {
    expect(canSendAlert('laboratoire', 'free', 999)).toBe(true);
  });
});

// ============================================
// canSuperLike
// ============================================

describe('canSuperLike', () => {
  test('free candidat with 0 super likes can use', () => {
    expect(canSuperLike('preparateur', 'free', 0)).toBe(true);
  });

  test('free candidat at limit cannot use', () => {
    expect(canSuperLike('preparateur', 'free', 1)).toBe(false);
  });

  test('business labo can always super like', () => {
    expect(canSuperLike('laboratoire', 'business', 999)).toBe(true);
  });
});

// ============================================
// getNextTier
// ============================================

describe('getNextTier', () => {
  test('free labo can upgrade to starter', () => {
    const next = getNextTier('laboratoire', 'free');
    expect(next.value).toBe('starter');
  });

  test('business labo has no next tier', () => {
    expect(getNextTier('laboratoire', 'business')).toBeNull();
  });

  test('pro titulaire can upgrade to business', () => {
    const next = getNextTier('titulaire', 'pro');
    expect(next.value).toBe('business');
  });

  test('nonexistent tier returns null', () => {
    expect(getNextTier('laboratoire', 'nonexistent')).toBeNull();
  });
});

// ============================================
// getMissionStatus
// ============================================

describe('getMissionStatus', () => {
  test('returns open status', () => {
    const status = getMissionStatus('open');
    expect(status.value).toBe('open');
    expect(status.label).toBe('Ouverte');
    expect(status.color).toBe('#4CAF50');
  });

  test('returns completed status', () => {
    const status = getMissionStatus('completed');
    expect(status.value).toBe('completed');
    expect(status.label).toBe('Terminée');
  });

  test('falls back to first status for unknown', () => {
    const status = getMissionStatus('unknown');
    expect(status.value).toBe('draft');
  });
});

// ============================================
// Category filters
// ============================================

describe('type category filters', () => {
  test('getCandidateTypes returns 3 items', () => {
    expect(getCandidateTypes()).toHaveLength(3);
  });

  test('getRecruiterTypes returns 1 item', () => {
    expect(getRecruiterTypes()).toHaveLength(1);
  });

  test('getFreelanceTypes returns 1 item', () => {
    expect(getFreelanceTypes()).toHaveLength(1);
  });

  test('getBusinessTypes returns 1 item', () => {
    expect(getBusinessTypes()).toHaveLength(1);
  });
});

// ============================================
// Lookup helpers
// ============================================

describe('lookup helpers', () => {
  test('getPharmacyGroupLabel returns label for valid group', () => {
    expect(getPharmacyGroupLabel('giphar')).toBe('Giphar');
  });

  test('getPharmacyGroupLabel returns raw value for unknown', () => {
    expect(getPharmacyGroupLabel('unknown')).toBe('unknown');
  });

  test('getPharmacyGroupsByType returns cooperative groups', () => {
    expect(getPharmacyGroupsByType('cooperative')).toHaveLength(7);
  });

  test('getPharmacyEnvironmentLabel returns label', () => {
    expect(getPharmacyEnvironmentLabel('urbaine')).toBe('Pharmacie urbaine');
  });

  test('getAnimationSpecialtyLabel returns label', () => {
    expect(getAnimationSpecialtyLabel('dermocosmetique')).toBe('Dermocosmétique');
  });

  test('getProductCategoryLabel returns label', () => {
    expect(getProductCategoryLabel('cosmetique')).toBe('Cosmétique');
  });

  test('getMissionTypeLabel returns label', () => {
    expect(getMissionTypeLabel('animation')).toBe('Animation commerciale');
  });

  test('getMissionStatusInfo works like getMissionStatus', () => {
    expect(getMissionStatusInfo('open').label).toBe('Ouverte');
  });
});

// ============================================
// Review criteria structure
// ============================================

describe('review criteria', () => {
  test('REVIEW_CRITERIA_ANIMATOR has 4 criteria', () => {
    expect(REVIEW_CRITERIA_ANIMATOR).toHaveLength(4);
  });

  test('REVIEW_CRITERIA_CLIENT has 3 criteria', () => {
    expect(REVIEW_CRITERIA_CLIENT).toHaveLength(3);
  });

  test('each criterion has key, label, icon', () => {
    REVIEW_CRITERIA_ANIMATOR.forEach(c => {
      expect(c).toHaveProperty('key');
      expect(c).toHaveProperty('label');
      expect(c).toHaveProperty('icon');
    });
  });
});
