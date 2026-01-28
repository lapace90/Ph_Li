import {
  getRoleLabel,
  getRoleLabelShort,
  getRoleDescription,
  getRoleIcon,
  isCandidate,
  isRecruiter,
  isFreelance,
  isBusiness,
  isLaboratory,
  canReceiveUrgentAlerts,
  canCreateMissions,
  canAcceptMissions,
  requiresRPPS,
  requiresSIRET,
} from '../../helpers/roleLabel';

// ============================================
// LABEL FUNCTIONS
// ============================================

describe('getRoleLabel', () => {
  test('returns full label for preparateur', () => {
    expect(getRoleLabel('preparateur')).toBe('Préparateur(trice)');
  });

  test('returns full label for laboratoire', () => {
    expect(getRoleLabel('laboratoire')).toBe('Laboratoire');
  });

  test('returns raw string for unknown role', () => {
    expect(getRoleLabel('unknown')).toBe('unknown');
  });
});

describe('getRoleLabelShort', () => {
  test('returns short label for preparateur', () => {
    expect(getRoleLabelShort('preparateur')).toBe('Préparateur');
  });

  test('returns raw string for unknown role', () => {
    expect(getRoleLabelShort('unknown')).toBe('unknown');
  });
});

describe('getRoleDescription', () => {
  test('returns description for preparateur', () => {
    expect(getRoleDescription('preparateur')).toBe('Diplômé(e) BP ou DEUST');
  });

  test('returns empty string for unknown role', () => {
    expect(getRoleDescription('unknown')).toBe('');
  });
});

describe('getRoleIcon', () => {
  test('returns icon for preparateur', () => {
    expect(getRoleIcon('preparateur')).toBe('briefcase');
  });

  test('returns user fallback for unknown role', () => {
    expect(getRoleIcon('unknown')).toBe('user');
  });
});

// ============================================
// BOOLEAN FUNCTIONS (test.each matrix)
// ============================================

describe('isCandidate', () => {
  test.each([
    ['preparateur', true],
    ['titulaire', false],
    ['conseiller', true],
    ['etudiant', true],
    ['animateur', false],
    ['laboratoire', false],
    ['unknown', false],
  ])('isCandidate(%s) => %s', (role, expected) => {
    expect(isCandidate(role)).toBe(expected);
  });
});

describe('isRecruiter', () => {
  test.each([
    ['preparateur', false],
    ['titulaire', true],
    ['conseiller', false],
    ['etudiant', false],
    ['animateur', false],
    ['laboratoire', true],
    ['unknown', false],
  ])('isRecruiter(%s) => %s', (role, expected) => {
    expect(isRecruiter(role)).toBe(expected);
  });
});

describe('isFreelance', () => {
  test.each([
    ['preparateur', false],
    ['titulaire', false],
    ['conseiller', false],
    ['etudiant', false],
    ['animateur', true],
    ['laboratoire', false],
    ['unknown', false],
  ])('isFreelance(%s) => %s', (role, expected) => {
    expect(isFreelance(role)).toBe(expected);
  });
});

describe('isBusiness', () => {
  test.each([
    ['preparateur', false],
    ['titulaire', false],
    ['conseiller', false],
    ['etudiant', false],
    ['animateur', false],
    ['laboratoire', true],
    ['unknown', false],
  ])('isBusiness(%s) => %s', (role, expected) => {
    expect(isBusiness(role)).toBe(expected);
  });
});

describe('isLaboratory', () => {
  test('is alias for isBusiness', () => {
    expect(isLaboratory('laboratoire')).toBe(true);
    expect(isLaboratory('titulaire')).toBe(false);
  });
});

describe('canReceiveUrgentAlerts', () => {
  test.each([
    ['preparateur', true],
    ['titulaire', false],
    ['conseiller', true],
    ['etudiant', true],
    ['animateur', true],
    ['laboratoire', false],
    ['unknown', false],
  ])('canReceiveUrgentAlerts(%s) => %s', (role, expected) => {
    expect(canReceiveUrgentAlerts(role)).toBe(expected);
  });
});

describe('canCreateMissions', () => {
  test.each([
    ['preparateur', false],
    ['titulaire', true],
    ['conseiller', false],
    ['etudiant', false],
    ['animateur', false],
    ['laboratoire', true],
    ['unknown', false],
  ])('canCreateMissions(%s) => %s', (role, expected) => {
    expect(canCreateMissions(role)).toBe(expected);
  });
});

describe('canAcceptMissions', () => {
  test.each([
    ['preparateur', false],
    ['titulaire', false],
    ['conseiller', false],
    ['etudiant', false],
    ['animateur', true],
    ['laboratoire', false],
    ['unknown', false],
  ])('canAcceptMissions(%s) => %s', (role, expected) => {
    expect(canAcceptMissions(role)).toBe(expected);
  });
});

describe('requiresRPPS', () => {
  test.each([
    ['preparateur', true],
    ['titulaire', true],
    ['conseiller', false],
    ['etudiant', false],
    ['animateur', false],
    ['laboratoire', false],
    ['unknown', false],
  ])('requiresRPPS(%s) => %s', (role, expected) => {
    expect(requiresRPPS(role)).toBe(expected);
  });
});

describe('requiresSIRET', () => {
  test.each([
    ['preparateur', false],
    ['titulaire', false],
    ['conseiller', false],
    ['etudiant', false],
    ['animateur', true],
    ['laboratoire', true],
    ['unknown', false],
  ])('requiresSIRET(%s) => %s', (role, expected) => {
    expect(requiresSIRET(role)).toBe(expected);
  });
});
