import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import Icon from '../../assets/icons/Icon';

const CityAutocomplete = ({ value, onSelect, placeholder = "Rechercher une ville" }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      searchCities(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchCities = async (search) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(search)}&type=municipality&limit=5`
      );
      const data = await response.json();

      // Ajouter cette vérification
      if (!data.features || !Array.isArray(data.features)) {
        setSuggestions([]);
        return;
      }

      const cities = data.features.map((feature) => ({
        city: feature.properties.city || feature.properties.name,
        postcode: feature.properties.postcode,
        region: feature.properties.context.split(', ').pop(),
        department: feature.properties.context.split(', ')[1] || '',
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        label: `${feature.properties.city || feature.properties.name} - ${feature.properties.context.split(', ').pop()}`,
      }));

      setSuggestions(cities);
      setShowSuggestions(true);
    } catch (error) {
      console.error('City search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (city) => {
    setQuery(city.label);
    setShowSuggestions(false);
    onSelect(city);
  };

  const handleChangeText = (text) => {
    setQuery(text);
    if (text.length < 2) {
      setShowSuggestions(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Icon name="mapPin" size={22} color={theme.colors.textLight} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textLight}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        />
        {loading && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((city, index) => (
            <Pressable
              key={`${city.city}-${city.postcode}-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleSelect(city)}
            >
              <Icon name="mapPin" size={16} color={theme.colors.primary} />
              <View style={styles.suggestionText}>
                <Text style={styles.cityName}>{city.city}</Text>
                <Text style={styles.regionName}>{city.postcode} - {city.region}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default CityAutocomplete;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(7.2),
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    paddingHorizontal: 18,
    gap: 12,
    backgroundColor: theme.colors.card,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: hp(1.8),
  },
  suggestionsContainer: {
    position: 'absolute',
    top: hp(7.5),
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: wp(3),
  },
  suggestionText: {
    flex: 1,
  },
  cityName: {
    fontSize: hp(1.7),
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
  },
  regionName: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
});