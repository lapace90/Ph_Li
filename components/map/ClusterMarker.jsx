import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { theme } from '../../constants/theme';
import { hp } from '../../helpers/common';

/**
 * Marker pour un cluster d'annonces
 */
const ClusterMarker = ({ cluster, onPress }) => {
  const { coordinate, pointCount } = cluster;
  
  // Taille dynamique selon le nombre de points
  const size = Math.min(50, 30 + Math.log(pointCount) * 8);
  
  return (
    <Marker
      coordinate={coordinate}
      onPress={() => onPress?.(cluster)}
      tracksViewChanges={false}
    >
      <View style={[styles.cluster, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={[styles.clusterInner, { width: size - 6, height: size - 6, borderRadius: (size - 6) / 2 }]}>
          <Text style={[styles.clusterText, { fontSize: size > 40 ? hp(1.6) : hp(1.4) }]}>
            {pointCount > 99 ? '99+' : pointCount}
          </Text>
        </View>
      </View>
    </Marker>
  );
};

export default ClusterMarker;

const styles = StyleSheet.create({
  cluster: {
    backgroundColor: theme.colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterInner: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterText: {
    color: 'white',
    fontFamily: theme.fonts.bold,
  },
});