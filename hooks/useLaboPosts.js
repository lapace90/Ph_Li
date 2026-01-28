import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { laboratoryPostService } from '../services/laboratoryPostService';

/**
 * Hook pour charger les posts labos sur les home screens.
 * mode 'user' : forYouPosts (labos suivis) + featuredPosts
 * mode 'lab'  : laboPosts (propres au labo) + featuredPosts
 */
export function useLaboPosts({ mode = 'user' } = {}) {
  const { session, user, laboratoryProfile } = useAuth();

  const [forYouPosts, setForYouPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [laboPosts, setLaboPosts] = useState([]);

  const fetchLaboPosts = useCallback(async () => {
    try {
      // Posts principaux
      if (mode === 'lab') {
        if (!laboratoryProfile?.id) return;
        const data = await laboratoryPostService.getPostsByLab(laboratoryProfile.id, { isPublished: true, limit: 6 });
        setLaboPosts(data);
      } else {
        const userId = session?.user?.id;
        const userType = user?.user_type;
        if (userId && userType) {
          const forYou = await laboratoryPostService.getPostsForUser(userId, userType, 6);
          setForYouPosts(forYou);
        }
      }

      // A la une : sponsorisés, sinon récents
      const featured = await laboratoryPostService.getFeaturedPosts(6);
      if (featured.length > 0) {
        setFeaturedPosts(featured);
      } else {
        const recent = await laboratoryPostService.getRecentPosts(6);
        setFeaturedPosts(recent);
      }
    } catch (err) {
      console.error('Erreur posts labos:', err);
    }
  }, [mode, session?.user?.id, user?.user_type, laboratoryProfile?.id]);

  useEffect(() => {
    fetchLaboPosts();
  }, [fetchLaboPosts]);

  return { forYouPosts, featuredPosts, laboPosts, fetchLaboPosts };
}
