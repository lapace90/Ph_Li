// constants/listingOptions.js
// Aligné sur les enums Supabase : listing_type, content_status

import { theme } from './theme';

// ============================================
// LISTING TYPES (enum listing_type)
// ============================================
export const LISTING_TYPES = [
  { value: 'vente', label: 'Vente', icon: 'briefcase', description: 'Vendre votre pharmacie' },
  { value: 'location', label: 'Location-gérance', icon: 'home', description: 'Mettre en location-gérance' },
  { value: 'association', label: 'Association', icon: 'heart', description: 'Trouver un associé' },
];

export const getListingTypeLabel = (value) => {
  return LISTING_TYPES.find(t => t.value === value)?.label || value;
};

export const getListingTypeColor = (value) => {
  const colors = {
    vente: theme.colors.primary,
    location: theme.colors.secondary,
    association: theme.colors.success,
  };
  return colors[value] || theme.colors.primary;
};

export const getListingTypeIcon = (value) => {
  return LISTING_TYPES.find(t => t.value === value)?.icon || 'briefcase';
};

// ============================================
// CONTENT STATUS (réutilisé de jobOptions)
// ============================================
export const LISTING_STATUS = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'sold', label: 'Vendue', color: 'primary' },
  { value: 'rented', label: 'Louée', color: 'secondary' },
  { value: 'closed', label: 'Clôturée', color: 'textLight' },
];

export const getListingStatusInfo = (status) => {
  return LISTING_STATUS.find(s => s.value === status) || { label: status, color: 'gray' };
};

// ============================================
// NEARBY OPTIONS
// ============================================
export const NEARBY_OPTIONS = [
  'Centre médical',
  'Hôpital',
  'EHPAD',
  'Centre commercial',
  'Parking',
  'Transport en commun',
  'École',
  'Zone piétonne',
  'Maison de retraite',
  'Cabinet médical',
];

// ============================================
// PRICE RANGES (pour filtres)
// ============================================
export const PRICE_RANGES = [
  { value: null, label: 'Tous les prix' },
  { value: 500000, label: 'Moins de 500k €' },
  { value: 1000000, label: 'Moins de 1M €' },
  { value: 2000000, label: 'Moins de 2M €' },
  { value: 5000000, label: 'Moins de 5M €' },
];

// ============================================
// SURFACE RANGES (pour filtres)
// ============================================
export const SURFACE_RANGES = [
  { value: null, label: 'Toutes surfaces' },
  { value: 100, label: 'Moins de 100 m²' },
  { value: 200, label: 'Moins de 200 m²' },
  { value: 500, label: 'Moins de 500 m²' },
];

// ============================================
// EMPTY LISTING STRUCTURE
// ============================================
export const EMPTY_LISTING = {
  type: null,
  title: '',
  description: '',
  price: null,
  negotiable: false,
  city: '',
  postal_code: '',
  region: '',
  department: '',
  latitude: null,
  longitude: null,
  characteristics: {
    // Commun
    surface_m2: null,
    staff_count: null,
    annual_revenue: null,
    parking: false,
    has_robot: false,
    has_lab: false,
    has_drive: false,
    nearby: [],
    // Vente
    annual_profit: null,
    // Location-gérance
    monthly_rent: null,
    lease_duration: null,
    deposit: null,
    lease_conditions: '',
    // Association
    shares_percentage: null,
    valuation: null,
    min_investment: null,
    partner_profile: '',
  },
  anonymized: true,
  photos: [],
  status: 'active',
};

// ============================================
// HELPERS
// ============================================
export const formatPrice = (price, anonymized = false, priceRange = null) => {
  if (anonymized && priceRange) {
    return `${formatNumber(priceRange.min)} - ${formatNumber(priceRange.max)} €`;
  }
  if (!price) return 'Prix sur demande';
  return `${formatNumber(price)} €`;
};

export const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

export const formatSurface = (surface) => {
  if (!surface) return null;
  return `${surface} m²`;
};

export const formatRevenue = (revenue) => {
  if (!revenue) return null;
  if (revenue >= 1000000) {
    return `${(revenue / 1000000).toFixed(1)}M €/an`;
  }
  return `${formatNumber(revenue)} €/an`;
};