import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const STEPS = [
  { key: 'open', label: 'Publiée', icon: 'eye' },
  { key: 'proposal_sent', label: 'Proposition envoyée', icon: 'send' },
  { key: 'animator_accepted', label: 'Acceptée', icon: 'userCheck' },
  { key: 'confirmed', label: 'Confirmée', icon: 'checkCircle' },
];

const STATUS_ORDER = ['open', 'proposal_sent', 'animator_accepted', 'confirmed', 'in_progress', 'completed'];

const getStepState = (stepKey, currentStatus) => {
  if (currentStatus === 'cancelled') return 'cancelled';
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  if (stepIdx < 0 || currentIdx < 0) return 'pending';
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
};

const MissionTimeline = ({ status }) => {
  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const state = getStepState(step.key, status);
        const isLast = index === STEPS.length - 1;

        return (
          <View key={step.key} style={styles.stepRow}>
            {/* Dot + Line */}
            <View style={styles.dotColumn}>
              <View style={[
                styles.dot,
                state === 'completed' && styles.dotCompleted,
                state === 'active' && styles.dotActive,
                state === 'cancelled' && styles.dotCancelled,
              ]}>
                {state === 'completed' ? (
                  <Icon name="check" size={12} color="white" />
                ) : (
                  <Icon
                    name={step.icon}
                    size={12}
                    color={
                      state === 'active' ? 'white'
                        : state === 'cancelled' ? theme.colors.rose
                        : theme.colors.textLight
                    }
                  />
                )}
              </View>
              {!isLast && (
                <View style={[
                  styles.line,
                  state === 'completed' && styles.lineCompleted,
                ]} />
              )}
            </View>

            {/* Label */}
            <Text style={[
              styles.label,
              state === 'completed' && styles.labelCompleted,
              state === 'active' && styles.labelActive,
              state === 'cancelled' && styles.labelCancelled,
            ]}>
              {step.label}
            </Text>
          </View>
        );
      })}

      {/* Statuts terminaux */}
      {(status === 'in_progress' || status === 'completed' || status === 'cancelled') && (
        <View style={styles.stepRow}>
          <View style={styles.dotColumn}>
            <View style={[
              styles.dot,
              status === 'completed' && styles.dotCompleted,
              status === 'in_progress' && styles.dotActive,
              status === 'cancelled' && styles.dotCancelled,
            ]}>
              <Icon
                name={status === 'completed' ? 'check' : status === 'cancelled' ? 'x' : 'play'}
                size={12}
                color={status === 'in_progress' || status === 'completed' ? 'white' : theme.colors.rose}
              />
            </View>
          </View>
          <Text style={[
            styles.label,
            status === 'completed' && styles.labelCompleted,
            status === 'in_progress' && styles.labelActive,
            status === 'cancelled' && styles.labelCancelled,
          ]}>
            {status === 'in_progress' ? 'En cours' : status === 'completed' ? 'Terminée' : 'Annulée'}
          </Text>
        </View>
      )}
    </View>
  );
};

export default MissionTimeline;

const styles = StyleSheet.create({
  container: {
    paddingVertical: hp(1),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: wp(3),
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dotCancelled: {
    backgroundColor: theme.colors.rose + '20',
    borderColor: theme.colors.rose,
  },
  line: {
    width: 2,
    height: hp(3),
    backgroundColor: theme.colors.border,
  },
  lineCompleted: {
    backgroundColor: theme.colors.success,
  },
  label: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
    paddingTop: hp(0.5),
    paddingBottom: hp(2.5),
  },
  labelCompleted: {
    color: theme.colors.success,
    fontWeight: '600',
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  labelCancelled: {
    color: theme.colors.rose,
    fontWeight: '600',
  },
});
