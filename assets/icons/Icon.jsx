import React from 'react';
import { Feather, MaterialIcons } from '@expo/vector-icons';

// Mapping dei nomi icone ai componenti Feather/MaterialIcons
const iconMap = {
  // Auth & User
  mail: { lib: 'feather', name: 'mail' },
  lock: { lib: 'feather', name: 'lock' },
  user: { lib: 'feather', name: 'user' },
  users: { lib: 'feather', name: 'users' },
  phone: { lib: 'feather', name: 'phone' },
  atSign: { lib: 'feather', name: 'at-sign' },

  // Navigation
  arrowLeft: { lib: 'feather', name: 'arrow-left' },
  arrowRight: { lib: 'feather', name: 'arrow-right' },
  chevronLeft: { lib: 'feather', name: 'chevron-left' },
  chevronRight: { lib: 'feather', name: 'chevron-right' },
  chevronDown: { lib: 'feather', name: 'chevron-down' },
  chevronUp: { lib: 'feather', name: 'chevron-up' },

  // Actions
  check: { lib: 'feather', name: 'check' },
  x: { lib: 'feather', name: 'x' },
  plus: { lib: 'feather', name: 'plus' },
  minus: { lib: 'feather', name: 'minus' },
  edit: { lib: 'feather', name: 'edit-2' },
  trash: { lib: 'feather', name: 'trash-2' },
  send: { lib: 'feather', name: 'send' },
  search: { lib: 'feather', name: 'search' },

  // Status & Info
  info: { lib: 'feather', name: 'info' },
  alertCircle: { lib: 'feather', name: 'alert-circle' },
  checkCircle: { lib: 'feather', name: 'check-circle' },

  // Alertes urgentes
  'alert-triangle': { lib: 'feather', name: 'alert-triangle' },
  zap: { lib: 'feather', name: 'zap' },

  // Calendar & Time
  calendar: { lib: 'feather', name: 'calendar' },
  clock: { lib: 'feather', name: 'clock' },

  // Chat & Messages
  messageCircle: { lib: 'feather', name: 'message-circle' },
  messageSquare: { lib: 'feather', name: 'message-square' },

  // Settings
  settings: { lib: 'feather', name: 'settings' },
  logout: { lib: 'feather', name: 'log-out' },

  // Location
  location: { lib: 'feather', name: 'map-pin' },
  mapPin: { lib: 'feather', name: 'map-pin' },
  map: { lib: 'feather', name: 'map' },

  // Matching & Social
  heart: { lib: 'feather', name: 'heart' },
  thumbsUp: { lib: 'feather', name: 'thumbs-up' },
  thumbsDown: { lib: 'feather', name: 'thumbs-down' },
  star: { lib: 'feather', name: 'star' },
  starHalf: { lib: 'feather', name: 'star-half' },
  starOff: { lib: 'feather', name: 'star-off' },
  smile: { lib: 'feather', name: 'smile' },
  frown: { lib: 'feather', name: 'frown' },
  close: { lib: 'feather', name: 'x' },
  bookmark: { lib: 'feather', name: 'bookmark' },

  // Missions / Animation
  target: { lib: 'feather', name: 'target' },
  grid: { lib: 'feather', name: 'grid' }, // merchandising

  // Transport (pour animateurs)
  car: { lib: 'material', name: 'directions-car' },  // Feather n'a pas 'car', on utilise 'truck'
  truck: { lib: 'feather', name: 'truck' },
  navigation: { lib: 'feather', name: 'navigation' },

  // Stats / Analytics
  'trending-up': { lib: 'feather', name: 'trending-up' },
  'bar-chart': { lib: 'feather', name: 'bar-chart-2' },

  // Disponibilité
  'calendar-check': { lib: 'material', name: 'event-available' },

  // Vérification
  verified: { lib: 'material', name: 'verified' },

  // Business / Buildings" :
  building: { lib: 'material', name: 'business' },
  pharmacy: { lib: 'material', name: 'local-pharmacy' },
  laboratory: { lib: 'material', name: 'science' },
  hospital: { lib: 'material', name: 'local-hospital' },
  store: { lib: 'material', name: 'store' },
  cart: { lib: 'feather', name: 'shopping-cart' },
  creditCard: { lib: 'feather', name: 'credit-card' },
  dollarSign: { lib: 'feather', name: 'dollar-sign' },
  briefcaseAlt: { lib: 'material', name: 'work' },

  // Files & Documents
  file: { lib: 'feather', name: 'file' },
  fileText: { lib: 'feather', name: 'file-text' },
  clipboard: { lib: 'feather', name: 'clipboard' },
  tag: { lib: 'feather', name: 'tag' },

  // Media
  camera: { lib: 'feather', name: 'camera' },
  image: { lib: 'feather', name: 'image' },
  mic: { lib: 'feather', name: 'mic' },

  // Misc
  home: { lib: 'feather', name: 'home' },
  book: { lib: 'feather', name: 'book' },
  bookOpen: { lib: 'feather', name: 'book-open' },
  bell: { lib: 'feather', name: 'bell' },
  bellRing: { lib: 'feather', name: 'bell' },
  briefcase: { lib: 'feather', name: 'briefcase' },
  globe: { lib: 'feather', name: 'globe' },
  hash: { lib: 'feather', name: 'hash' },
  refresh: { lib: 'feather', name: 'rotate-ccw' },
  filter: { lib: 'feather', name: 'filter' },
  sliders: { lib: 'feather', name: 'sliders' },
  eye: { lib: 'feather', name: 'eye' },
  clock: { lib: 'feather', name: 'clock' },

  monitor: { lib: 'feather', name: 'monitor' },
  eyeOff: { lib: 'feather', name: 'eye-off' },
  download: { lib: 'feather', name: 'download' },
  shield: { lib: 'feather', name: 'shield' },
  award: { lib: 'feather', name: 'award' },
  maximize: { lib: 'feather', name: 'maximize' },

  // Material Icons (when not available in Feather)
  school: { lib: 'material', name: 'school' },
  class: { lib: 'material', name: 'class' },
  work: { lib: 'material', name: 'work' },
  laptop: { lib: 'material', name: 'laptop' },
  list: { lib: 'material', name: 'list' },
  navigation: { lib: 'material', name: 'navigation' },
  key: { lib: 'material', name: 'key' },

  // Filled variants (MaterialIcons)
  'star-filled': { lib: 'material', name: 'star' },
  'bookmark-filled': { lib: 'material', name: 'bookmark' },
  'heart-filled': { lib: 'material', name: 'favorite' },
};

const Icon = ({ name, size = 24, color = '#000', style }) => {
  const iconConfig = iconMap[name];

  if (!iconConfig) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  if (iconConfig.lib === 'material') {
    return (
      <MaterialIcons
        name={iconConfig.name}
        size={size}
        color={color}
        style={style}
      />
    );
  }

  return (
    <Feather
      name={iconConfig.name}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default Icon;