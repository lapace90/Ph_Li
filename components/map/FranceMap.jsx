// components/map/FranceMap.jsx
import { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { METRO_REGIONS, DOM_TOM_REGIONS, FRANCE_VIEWBOX } from '../../constants/francePaths';

const FranceMap = ({ 
  jobCounts = {},
  selectedRegion = null,
  onRegionPress,
  showDomTom = true,
}) => {
  const [pressedRegion, setPressedRegion] = useState(null);

  const getRegionFill = (regionId) => {
    const count = jobCounts[regionId] || 0;
    const isSelected = selectedRegion === regionId;
    const isPressed = pressedRegion === regionId;
    
    if (isSelected) return theme.colors.primary;
    if (isPressed) return theme.colors.primary + '50';
    if (count > 0) return '#B8E8D8';
    return '#ECECEC';
  };

  const renderMetroRegion = (region) => {
    const count = jobCounts[region.id] || 0;
    const hasJobs = count > 0;
    const isSelected = selectedRegion === region.id;
    
    return (
      <G key={region.id}>
        <Path
          d={region.path}
          fill={getRegionFill(region.id)}
          stroke="#FFFFFF"
          strokeWidth={isSelected ? 3 : 2}
          strokeLinejoin="round"
          onPressIn={() => setPressedRegion(region.id)}
          onPressOut={() => {
            setPressedRegion(null);
            onRegionPress?.(region);
          }}
        />
        {hasJobs && (
          <G>
            <Circle
              cx={region.center.x}
              cy={region.center.y}
              r={15}
              fill={isSelected ? '#FFFFFF' : theme.colors.primary}
              stroke={isSelected ? theme.colors.primary : '#FFFFFF'}
              strokeWidth={2}
            />
            <SvgText
              x={region.center.x}
              y={region.center.y + 5}
              fill={isSelected ? theme.colors.primary : '#FFFFFF'}
              fontSize={12}
              fontWeight="bold"
              textAnchor="middle"
            >
              {count > 99 ? '99+' : count}
            </SvgText>
          </G>
        )}
      </G>
    );
  };

  const renderDomTomRegion = (region) => {
    const count = jobCounts[region.id] || 0;
    const hasJobs = count > 0;
    const isSelected = selectedRegion === region.id;
    
    return (
      <G key={region.id}>
        <Path
          d={region.path}
          fill={getRegionFill(region.id)}
          stroke="#FFFFFF"
          strokeWidth={isSelected ? 2 : 1.5}
          strokeLinejoin="round"
          onPressIn={() => setPressedRegion(region.id)}
          onPressOut={() => {
            setPressedRegion(null);
            onRegionPress?.(region);
          }}
        />
        {hasJobs && (
          <G>
            <Circle
              cx={region.center.x}
              cy={region.center.y}
              r={11}
              fill={isSelected ? '#FFFFFF' : theme.colors.primary}
              stroke={isSelected ? theme.colors.primary : '#FFFFFF'}
              strokeWidth={1.5}
            />
            <SvgText
              x={region.center.x}
              y={region.center.y + 4}
              fill={isSelected ? theme.colors.primary : '#FFFFFF'}
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
            >
              {count}
            </SvgText>
          </G>
        )}
        <SvgText
          x={region.center.x}
          y={region.center.y + 32}
          fill="#888888"
          fontSize={9}
          textAnchor="middle"
        >
          {region.name}
        </SvgText>
      </G>
    );
  };

  // ViewBox ajusté selon si on affiche les DOM-TOM ou pas
  const viewBox = showDomTom ? FRANCE_VIEWBOX : "15 -1 598 586";

  return (
    <View style={styles.container}>
      <View style={[styles.mapWrapper, !showDomTom && styles.mapWrapperSmall]}>
        <Svg
          width="100%"
          height="100%"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Régions métropolitaines */}
          <G>
            {METRO_REGIONS.map(region => renderMetroRegion(region))}
          </G>
          
          {/* Séparateur et DOM-TOM */}
          {showDomTom && (
            <>
              <Path
                d="M30,595 L580,595"
                stroke="#DDDDDD"
                strokeWidth={1}
                strokeDasharray="6,4"
                fill="none"
              />
              <SvgText
                x="305"
                y="612"
                fill="#AAAAAA"
                fontSize={10}
                textAnchor="middle"
              >
                Outre-mer
              </SvgText>
              <G>
                {DOM_TOM_REGIONS.map(region => renderDomTomRegion(region))}
              </G>
            </>
          )}
        </Svg>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#B8E8D8' }]} />
          <Text style={styles.legendText}>Offres disponibles</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={styles.legendText}>Région sélectionnée</Text>
        </View>
      </View>
    </View>
  );
};

export default FranceMap;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  mapWrapper: {
    width: '100%',
    aspectRatio: 0.88,
  },
  mapWrapperSmall: {
    aspectRatio: 1.02,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(5),
    paddingVertical: hp(1),
    marginTop: hp(0.5),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
  },
});