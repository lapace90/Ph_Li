import React from 'react';
import { Feather, MaterialIcons } from '@expo/vector-icons';

// Mapping dei nomi icone ai componenti Feather/MaterialIcons
const iconMap = {
  // Auth & User
  mail: { lib: 'feather', name: 'mail' },
  lock: { lib: 'feather', name: 'lock' },
  user: { lib: 'feather', name: 'user' },
  users: { lib: 'feather', name: 'users' },
  
  // Navigation
  arrowLeft: { lib: 'feather', name: 'arrow-left' },
  arrowRight: { lib: 'feather', name: 'arrow-right' },
  chevronLeft: { lib: 'feather', name: 'chevron-left' },
  chevronRight: { lib: 'feather', name: 'chevron-right' },
  
  // Actions
  check: { lib: 'feather', name: 'check' },
  x: { lib: 'feather', name: 'x' },
  plus: { lib: 'feather', name: 'plus' },
  edit: { lib: 'feather', name: 'edit-2' },
  trash: { lib: 'feather', name: 'trash-2' },
  send: { lib: 'feather', name: 'send' },
  search: { lib: 'feather', name: 'search' },
  
  // Status & Info
  info: { lib: 'feather', name: 'info' },
  alertCircle: { lib: 'feather', name: 'alert-circle' },
  checkCircle: { lib: 'feather', name: 'check-circle' },
  
  // Calendar
  calendar: { lib: 'feather', name: 'calendar' },
  clock: { lib: 'feather', name: 'clock' },
  
  // Chat
  messageCircle: { lib: 'feather', name: 'message-circle' },
  messageSquare: { lib: 'feather', name: 'message-square' },
  
  // Settings
  settings: { lib: 'feather', name: 'settings' },
  logout: { lib: 'feather', name: 'log-out' },
  
  // Misc
  home: { lib: 'feather', name: 'home' },
  book: { lib: 'feather', name: 'book' },
  bookOpen: { lib: 'feather', name: 'book-open' },
  bell: { lib: 'feather', name: 'bell' },
  bellRing: { lib: 'feather', name: 'bell' }, // Feather non ha bell-ring, usa bell
  mic: { lib: 'feather', name: 'mic' },
  clipboard: { lib: 'feather', name: 'clipboard' },
  file: { lib: 'feather', name: 'file' },
  fileText: { lib: 'feather', name: 'file-text' },
  chevronDown: { lib: 'feather', name: 'chevron-down' },
  chevronUp: { lib: 'feather', name: 'chevron-up' },
  camera: { lib: 'feather', name: 'camera' },
  image: { lib: 'feather', name: 'image' },
  globe: { lib: 'feather', name: 'globe' },
  hash: { lib: 'feather', name: 'hash' },
  briefcase: { lib: 'feather', name: 'briefcase' },
  refresh: { lib: 'feather', name: 'rotate-ccw' },
  
  // Material Icons (per icone non disponibili in Feather)
  school: { lib: 'material', name: 'school' },
  class: { lib: 'material', name: 'class' },
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