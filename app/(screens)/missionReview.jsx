// Ecran de soumission d'avis apres mission completee

import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import { commonStyles } from '../../constants/styles';
import { useAuth } from '../../contexts/AuthContext';
import { missionService } from '../../services/missionService';
import { reviewService } from '../../services/reviewService';
import { REVIEW_CRITERIA_ANIMATOR, REVIEW_CRITERIA_CLIENT } from '../../constants/profileOptions';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import BackButton from '../../components/common/BackButton';
import Button from '../../components/common/Button';
import Icon from '../../assets/icons/Icon';
import StarRatingInput from '../../components/missions/StarRatingInput';

export default function MissionReview() {
  const router = useRouter();
  const { missionId } = useLocalSearchParams();
  const { session, profile } = useAuth();
  const userId = session?.user?.id;
  const isAnimator = profile?.user_type === 'animateur';

  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');

  // Criteres selon le role
  const criteria = isAnimator ? REVIEW_CRITERIA_CLIENT : REVIEW_CRITERIA_ANIMATOR;

  useEffect(() => {
    loadData();
  }, [missionId]);

  const loadData = async () => {
    try {
      const [missionData, existing] = await Promise.all([
        missionService.getById(missionId),
        reviewService.getExistingReview(missionId, userId),
      ]);
      setMission(missionData);

      if (existing) {
        setExistingReview(existing);
        const existingRatings = {};
        criteria.forEach(c => { existingRatings[c.key] = existing[c.key] || 0; });
        setRatings(existingRatings);
        setComment(existing.comment || '');
      } else {
        const init = {};
        criteria.forEach(c => { init[c.key] = 0; });
        setRatings(init);
      }
    } catch (err) {
      console.error('Erreur chargement review:', err);
      Alert.alert('Erreur', 'Impossible de charger la mission');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const allRated = criteria.every(c => ratings[c.key] > 0);
  const overallRating = allRated
    ? criteria.reduce((sum, c) => sum + ratings[c.key], 0) / criteria.length
    : 0;

  const handleSubmit = async () => {
    if (!allRated) {
      Alert.alert('Avis incomplet', 'Veuillez noter tous les criteres.');
      return;
    }

    setSubmitting(true);
    try {
      const revieweeId = isAnimator ? mission.client_id : mission.animator_id;

      await reviewService.submitReview({
        mission_id: missionId,
        reviewer_id: userId,
        reviewee_id: revieweeId,
        rating_overall: Math.round(overallRating * 10) / 10,
        comment: comment.trim() || null,
        criteria: ratings,
      });

      Alert.alert(
        'Merci !',
        'Votre avis a bien ete enregistre.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Erreur', err.message || 'Impossible de soumettre l\'avis.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Laisser un avis</Text>
          <View style={commonStyles.headerSpacer} />
        </View>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!mission) return null;

  const revieweeName = isAnimator
    ? (mission.client_profile?.brand_name || mission.client_profile?.company_name || mission.client_profile?.first_name || 'le client')
    : (mission.animator?.profile?.first_name || 'l\'animateur');

  // Deja note → lecture seule
  if (existingReview) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={commonStyles.header}>
          <BackButton router={router} />
          <Text style={commonStyles.headerTitle}>Mon avis</Text>
          <View style={commonStyles.headerSpacer} />
        </View>

        <ScrollView style={commonStyles.flex1} contentContainerStyle={styles.content}>
          {/* Bandeau deja note */}
          <View style={styles.alreadyBanner}>
            <Icon name="checkCircle" size={20} color={theme.colors.success} />
            <Text style={styles.alreadyText}>Vous avez deja laisse un avis pour cette mission</Text>
          </View>

          {/* Recap mission */}
          <View style={styles.recapCard}>
            <Text style={styles.recapTitle}>{mission.title}</Text>
            <Text style={styles.recapSubtitle}>Avis sur {revieweeName}</Text>
          </View>

          {/* Notes en lecture seule */}
          <View style={styles.criteriaCard}>
            {criteria.map(c => (
              <StarRatingInput
                key={c.key}
                label={c.label}
                iconName={c.icon}
                value={ratings[c.key]}
                readOnly
              />
            ))}
          </View>

          {/* Note globale */}
          <View style={styles.overallCard}>
            <Text style={styles.overallLabel}>Note globale</Text>
            <View style={styles.overallRow}>
              <Icon name="star-filled" size={24} color={theme.colors.warning} />
              <Text style={styles.overallValue}>{existingReview.rating_overall?.toFixed(1)}</Text>
              <Text style={styles.overallMax}> / 5</Text>
            </View>
          </View>

          {/* Commentaire */}
          {existingReview.comment && (
            <View style={styles.commentCard}>
              <Text style={styles.commentLabel}>Commentaire</Text>
              <Text style={styles.commentText}>{existingReview.comment}</Text>
            </View>
          )}
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // Formulaire de notation
  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={commonStyles.header}>
        <BackButton router={router} />
        <Text style={commonStyles.headerTitle}>Laisser un avis</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={commonStyles.flex1}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recap mission */}
        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>{mission.title}</Text>
          <Text style={styles.recapSubtitle}>
            Evaluez {revieweeName}
          </Text>
          {mission.start_date && (
            <Text style={styles.recapDates}>
              {new Date(mission.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              {mission.end_date && ` - ${new Date(mission.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
            </Text>
          )}
        </View>

        {/* Criteres */}
        <View style={styles.criteriaCard}>
          <Text style={styles.sectionTitle}>Votre evaluation</Text>
          {criteria.map(c => (
            <StarRatingInput
              key={c.key}
              label={c.label}
              iconName={c.icon}
              value={ratings[c.key]}
              onChange={(val) => setRatings(prev => ({ ...prev, [c.key]: val }))}
            />
          ))}
        </View>

        {/* Note globale */}
        {allRated && (
          <View style={styles.overallCard}>
            <Text style={styles.overallLabel}>Note globale</Text>
            <View style={styles.overallRow}>
              <Icon name="star-filled" size={24} color={theme.colors.warning} />
              <Text style={styles.overallValue}>{overallRating.toFixed(1)}</Text>
              <Text style={styles.overallMax}> / 5</Text>
            </View>
          </View>
        )}

        {/* Commentaire */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Partagez votre experience..."
            placeholderTextColor={theme.colors.textLight}
            value={comment}
            onChangeText={setComment}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Bouton soumettre */}
        <Button
          title="Envoyer mon avis"
          onPress={handleSubmit}
          loading={submitting}
          buttonStyle={[styles.submitButton, !allRated && styles.buttonDisabled]}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  recapCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recapTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
    marginBottom: hp(0.3),
  },
  recapSubtitle: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  recapDates: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginTop: hp(0.5),
  },
  criteriaCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hp(0.5),
  },
  overallCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  overallLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginBottom: hp(0.5),
  },
  overallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1),
  },
  overallValue: {
    fontSize: hp(2.8),
    fontFamily: theme.fonts.bold,
    color: theme.colors.text,
  },
  overallMax: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  commentSection: {
    marginBottom: hp(2),
  },
  textArea: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    minHeight: hp(12),
    fontSize: hp(1.5),
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: hp(0.5),
  },
  charCount: {
    fontSize: hp(1.2),
    color: theme.colors.textLight,
    textAlign: 'right',
    marginTop: hp(0.5),
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    marginBottom: hp(2),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  alreadyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: theme.colors.success + '12',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  alreadyText: {
    flex: 1,
    fontSize: hp(1.4),
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.success,
  },
  commentCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  commentLabel: {
    fontSize: hp(1.3),
    color: theme.colors.textLight,
    marginBottom: hp(0.5),
  },
  commentText: {
    fontSize: hp(1.5),
    fontFamily: theme.fonts.regular,
    color: theme.colors.text,
    lineHeight: hp(2.2),
  },
});
