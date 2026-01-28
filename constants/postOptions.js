import { theme } from './theme';

// Configuration des types de publications laboratoire
// label : forme longue (détail, formulaires)
// shortLabel : forme courte (badges, carousels)
export const POST_TYPE_CONFIG = {
  news: { label: 'Actualité', shortLabel: 'News', icon: 'bell', color: theme.colors.primary },
  formation: { label: 'Formation', shortLabel: 'Formation', icon: 'bookOpen', color: theme.colors.secondary },
  event: { label: 'Événement', shortLabel: 'Event', icon: 'calendar', color: theme.colors.warning },
  video: { label: 'Vidéo', shortLabel: 'Vidéo', icon: 'play', color: theme.colors.rose },
};
