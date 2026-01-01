import { StyleSheet, Text, View, Pressable, Modal, ScrollView } from 'react-native';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { hp, wp } from '../../helpers/common';
import { REGION_OPTIONS } from '../../constants/regions';
import Icon from '../../assets/icons/Icon';

/**
 * Sélecteur de région (France métro / DOM-TOM)
 */
const RegionSelector = ({ selectedRegion, onSelect, visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Sélectionner une région</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Icon name="x" size={22} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {REGION_OPTIONS.map((region) => (
              <Pressable
                key={region.key}
                style={[
                  styles.regionItem,
                  selectedRegion === region.key && styles.regionItemActive
                ]}
                onPress={() => {
                  onSelect(region);
                  onClose();
                }}
              >
                <View style={styles.regionInfo}>
                  <Text style={[
                    styles.regionName,
                    selectedRegion === region.key && styles.regionNameActive
                  ]}>
                    {region.name}
                  </Text>
                  {region.key !== 'metro' && (
                    <Text style={styles.regionCode}>Code: {region.code}</Text>
                  )}
                </View>
                {selectedRegion === region.key && (
                  <Icon name="check" size={20} color={theme.colors.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
};

/**
 * Bouton compact pour ouvrir le sélecteur
 */
export const RegionButton = ({ selectedRegion, onPress, jobCount }) => {
  const region = REGION_OPTIONS.find(r => r.key === selectedRegion) || REGION_OPTIONS[0];
  
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Icon name="map" size={16} color={theme.colors.primary} />
      <Text style={styles.buttonText} numberOfLines={1}>
        {region.name}
      </Text>
      {jobCount !== undefined && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{jobCount}</Text>
        </View>
      )}
      <Icon name="chevronDown" size={14} color={theme.colors.textLight} />
    </Pressable>
  );
};

export default RegionSelector;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xxl,
    borderTopRightRadius: theme.radius.xxl,
    maxHeight: '70%',
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: hp(2),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gray + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  regionItemActive: {
    backgroundColor: theme.colors.primary + '10',
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
  },
  regionNameActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold,
  },
  regionCode: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  // Button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    gap: wp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.medium,
    color: theme.colors.text,
    maxWidth: wp(30),
  },
  countBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.2),
    borderRadius: theme.radius.sm,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: hp(1.2),
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
});