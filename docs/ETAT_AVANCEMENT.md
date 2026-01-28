# Ph_Li — État d'avancement du projet

**Date** : 28 janvier 2026
**Version** : 1.0.0
**Stack** : React Native (Expo SDK 54) + Expo Router + Supabase

---

## Chiffres clés

| Métrique | Valeur |
|----------|--------|
| Lignes de code (hors node_modules/tests) | ~64 000 |
| Services backend | 23 fichiers / ~7 000 lignes |
| Hooks React | 22 fichiers / ~3 800 lignes |
| Écrans (screens + tabs) | 70+ fichiers / ~31 000 lignes |
| Composants | 55+ fichiers / ~14 000 lignes |
| Constants / Helpers / Utils | ~5 000 lignes |
| Tables Supabase | 36 |
| Tests unitaires | 9 fichiers |

---

## 1. Authentification & Onboarding

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Login / Signup email | Fait | `app/(auth)/login.jsx`, `signUp.jsx` |
| Onboarding profil standard | Fait | `app/(auth)/onboarding/index.jsx`, `form.jsx`, `privacy.jsx` |
| Onboarding animateur | Fait | `app/(auth)/onboarding/animator.jsx` |
| Onboarding laboratoire | Fait | `app/(auth)/onboarding/laboratory.jsx` |
| Gestion session + refresh | Fait | `contexts/AuthContext.jsx` |
| 6 types utilisateur | Fait | preparateur, titulaire, etudiant, animateur, laboratoire, conseiller |

---

## 2. Profils

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Édition profil candidat | Fait | `editProfile.jsx` |
| Photo de profil (upload) | Fait | `ImagePickerBox.jsx`, `storageService.js` |
| Pseudo / nickname | Fait | Dans editProfile |
| Bio | Fait | Dans editProfile |
| Localisation + rayon de recherche | Fait | `CityAutocomplete.jsx`, `RadiusSlider.jsx` |
| Spécialisations | Fait | Chips dans editProfile |
| Disponibilité | Fait | `AvailabilityPicker.jsx` |
| Types de contrat | Fait | `ContractTypePicker.jsx` |
| Mobilité | Fait | `RelocationToggle.jsx` |
| Page profil (tab) | Fait | `app/(tabs)/profile.jsx` (746 lignes) |
| Profil animateur (édition) | Fait | `editAnimatorProfile.jsx` (803 lignes) |
| Profil animateur (vue) | Fait | `viewAnimatorProfile.jsx` (637 lignes) |
| Profil laboratoire (édition) | Fait | `editLaboratoryProfile.jsx` (542 lignes) |
| Profil laboratoire (vue) | Fait | `viewLaboratoryProfile.jsx` (545 lignes) |

---

## 3. Paramètres de confidentialité

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Visibilité profil (anonyme/public) | Fait | `privacySettings.jsx`, `privacyService.js` |
| Contrôle nom / photo / localisation / employeur | Fait | `privacy_settings` table |
| Hook dédié | Fait | `usePrivacy.js` |

---

## 4. Système de CV

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Liste des CV + quotas | Fait | `cvList.jsx` |
| Création CV structuré (formulaire) | Fait | `cvCreate.jsx` (1055 lignes) |
| Création CV animateur | Fait | `cvAnimatorCreate.jsx` (1578 lignes) |
| Upload PDF | Fait | `cvAdd.jsx` |
| Visualisation CV structuré | Fait | `cvView.jsx` |
| Visualisation PDF | Fait | `cvPdfView.jsx` |
| Suppression CV | Fait | Dans useCVs + cvService |
| CV par défaut | Fait | `useCVs.js` → `setDefaultCV` |
| Quotas (generate / upload) | Fait | `cvService.canGenerateCV`, `canUploadCV` |
| Anonymisation CV | Fait | `cvService.anonymizeCV`, `utils/cvAnonymizer.js` |
| Afficher CV sur carte de matching | Fait | `show_cv_on_card` dans cvList + SwipeCard |
| Tracking vues CV | Fait | `cvService.recordCvView`, `getCvViewsCount`, table `cv_views` |
| Composants CV | Fait | `CVPreview`, `CVFormExperience`, `CVFormFormation`, `CVAnimatorPreview`, etc. |

---

## 5. Offres d'emploi

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Création offre | Fait | `jobOfferCreate.jsx` (961 lignes) |
| Détail (vue employeur) | Fait | `jobOfferDetail.jsx` |
| Détail (vue candidat) | Fait | `jobOfferDetailCandidate.jsx` |
| Service CRUD | Fait | `jobOfferService.js` (232 lignes) |
| Hook avec filtres | Fait | `useJobOffers.js` (212 lignes) |
| Recherche | Fait | `useJobSearch.js` (213 lignes) |
| Mode discret | Fait | Champ `discrete_mode` |
| Rattachement pharmacie + SIRET | Fait | `pharmacy_id`, `pharmacy_siret` |

---

## 6. Offres de stage

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Création offre de stage | Fait | `internshipOfferCreate.jsx` (1020 lignes) |
| Détail (vue employeur) | Fait | `internshipOfferDetail.jsx` |
| Détail (vue candidat) | Fait | `internshipOfferDetailCandidate.jsx` |
| Service CRUD | Fait | `internshipOfferService.js` (165 lignes) |
| Hook avec filtres | Fait | `useInternshipOffers.js` (194 lignes) |
| Rattachement pharmacie | Fait | `pharmacy_id` |

---

## 7. Matching / Swipe

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Pile de cartes (swipe stack) | Fait | `SwipeStack.jsx`, `SwipeCard.jsx` (1146 lignes) |
| Like / Dislike / Super Like | Fait | Gestes + boutons dans SwipeStack |
| Algorithme de score | Fait | `matchingService.js` → `calculateMatchScore` |
| Gestion des matchs | Fait | `matchingService.js` (671 lignes) |
| Hook matching | Fait | `useMatching.js` (266 lignes) |
| Modal de match | Fait | `MatchModal.jsx` |
| Liste des matchs | Fait | `matches.jsx` (444 lignes) |
| Swipe animateurs | Fait | `swipeAnimators.jsx` |
| Swipe missions | Fait | `swipeMissions.jsx` |
| Matching animateur | Fait | `animatorMatchingService.js` (423 lignes), `useAnimatorMatching.js` (349 lignes) |
| Conflits de match | Fait | `useMatchConflicts.js`, `MatchConflictModal.jsx` |
| Candidatures avec CV | Fait | `ApplyModal.jsx`, table `applications` avec `cv_id` |
| Preview de sa propre carte | Fait | `previewMyCard.jsx` (562 lignes) |

---

## 8. Messagerie

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Liste conversations | Fait | `app/(tabs)/messages.jsx` (360 lignes) |
| Écran conversation | Fait | `conversation.jsx` |
| Service complet | Fait | `messagingService.js` (313 lignes) |
| Messages temps réel (Supabase Realtime) | Fait | `subscribeToMessages`, `subscribeToReadReceipts` |
| Hook dédié | Fait | `useMessaging.js` (186 lignes) |
| Support pièces jointes | Fait | Champ `attachments` (jsonb) |
| Accusés de lecture | Fait | `markAsRead`, `subscribeToReadReceipts` |

---

## 9. Favoris

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Ajouter / retirer | Fait | `favoritesService.js` (387 lignes) |
| Quotas par tier | Fait | `canAddFavorite` dans favoritesService |
| Hook complet | Fait | `useFavorites.js` (228 lignes) |
| Hook quota | Fait | `useFavQuota.js` |
| Composant bouton | Fait | `FavoriteButton.jsx` |
| Bannière quota | Fait | `FavQuotaBanner.jsx` |
| Favoris animateurs | Fait | `animatorFavorites.jsx` |

---

## 10. Dashboard

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Home candidat | Fait | `app/(tabs)/home.jsx` (488 lignes) |
| Home animateur | Fait | `app/(tabs)/homeAnimator.jsx` (217 lignes) |
| Home laboratoire | Fait | `app/(tabs)/homeLaboratory.jsx` (237 lignes) |
| Dashboard recruteur (titulaire) | Fait | `recruiterDashboard.jsx` (549 lignes) |
| Hook dashboard | Fait | `useDashboard.js` (458 lignes) |
| Stats candidat (matchs, candidatures, vues CV) | Fait | `loadCandidatStats` |
| Stats titulaire (matchs, offres actives) | Fait | `loadTitulaireStats` |
| Offres recommandées | Fait | `loadRecommendedOffers` |
| Activités récentes | Fait | `loadActivities` |
| Composants (StatsCard, JobCard, ActivityItem, HomeHeader) | Fait | `components/home/` |
| Carrousel laboratoires | Fait | `LaboCarousel.jsx` |

---

## 11. Notifications

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Notifications in-app (BDD) | Fait | `notificationService.js` (272 lignes) |
| Écran liste notifications | Fait | `notifications.jsx` (345 lignes) |
| Préférences notifications | Fait | `notificationSettings.jsx`, table `notification_preferences` |
| Hook complet | Fait | `useNotifications.js` (155 lignes) |
| Toast composant | Fait | `NotificationToast.jsx` |
| Table push_tokens | Fait | Table existe en BDD |
| Push notifications natives (Expo) | **Non fait** | `expo-notifications` non installé, hook a un stub |

---

## 12. Alertes urgentes

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Création alerte | Fait | `createUrgentAlert.jsx` (331 lignes) |
| Détail alerte (employeur) | Fait | `alertDetail.jsx` (434 lignes) |
| Détail alerte (candidat) | Fait | `alertDetailCandidate.jsx` (426 lignes) |
| Mes alertes | Fait | `myAlerts.jsx` (346 lignes) |
| Alertes disponibles | Fait | `availableAlerts.jsx` (293 lignes) |
| Service complet | Fait | `urgentAlertService.js` (504 lignes) |
| Hook dédié | Fait | `useUrgentAlerts.js` (313 lignes) |
| Géo-ciblage | Fait | Filtrage par rayon + latitude/longitude |
| Réponses candidats | Fait | Table `urgent_alert_responses` |

---

## 13. Missions d'animation

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Création mission | Fait | `createMission.jsx` (245 lignes) |
| Détail mission | Fait | `missionDetail.jsx` (545 lignes) |
| Proposition mission | Fait | `missionProposal.jsx` (312 lignes) |
| Réponse à proposition | Fait | `missionResponse.jsx` (397 lignes) |
| Confirmation mission | Fait | `missionConfirm.jsx` (403 lignes) |
| Avis / Review | Fait | `missionReview.jsx` (402 lignes) |
| Mes missions | Fait | `myMissions.jsx` |
| Missions labo | Fait | `laboratoryMissions.jsx` (493 lignes) |
| Service complet | Fait | `missionService.js` (803 lignes) |
| Hook dédié | Fait | `useMissions.js` (280 lignes) |
| Frais de mission | Fait | `mission_fees` table + `createFee()` |
| Reviews | Fait | `reviewService.js`, `StarRatingInput.jsx` |
| Timeline mission | Fait | `MissionTimeline.jsx` |
| Modal frais | Fait | `MissionFeeModal.jsx` |
| Tab missions | Fait | `app/(tabs)/missions.jsx` |
| Disponibilité animateur | Fait | Table `animator_availability` |

---

## 14. Laboratoires

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Profil laboratoire (édition) | Fait | `editLaboratoryProfile.jsx` |
| Profil laboratoire (vue publique) | Fait | `viewLaboratoryProfile.jsx` |
| Service labo | Fait | `laboratoryService.js` (413 lignes) |
| Hook profil labo | Fait | `useLaboratoryProfile.js` (134 lignes) |
| Posts / Actualités | Fait | `laboratoryPostService.js` (491 lignes) |
| CRUD posts | Fait | `createPost.jsx` (715 lignes), `laboratoryPosts.jsx`, `postDetail.jsx` |
| Hook posts | Fait | `useLaboPosts.js` |
| Followers | Fait | `FollowButton.jsx`, table `laboratory_followers` |
| Photos galerie | Fait | Table `laboratory_photos` |
| Carte labo | Fait | `LaboratoryCard.jsx` |

---

## 15. Pharmacies

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Gestion pharmacie | Fait | `pharmacyManagement.jsx` (337 lignes) |
| Service détails | Fait | `pharmacyDetailsService.js` (261 lignes) |
| Hook dédié | Fait | `usePharmacyDetails.js` (126 lignes) |
| Vérification SIRET | Fait | `siretVerification.jsx`, `siretVerificationService.js` (257 lignes) |
| Vérification RPPS | Fait | `rppsVerification.jsx`, `rppsService.js` (204 lignes) |
| Badges SIRET / RPPS | Fait | `SiretBadge.jsx`, `RppsBadge.jsx` |

---

## 16. Marketplace (Annonces pharmacies)

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Tab marketplace | Fait | `app/(tabs)/marketplace.jsx` (202 lignes) |
| Création annonce | Fait | `listingCreate.jsx` (1079 lignes) |
| Détail annonce | Fait | `listingDetail.jsx` (451 lignes) |
| Édition annonce | Fait | `listingEdit.jsx` (597 lignes) |
| Mes annonces | Fait | `myListing.jsx` (325 lignes) |
| Service annonces | Fait | `pharmacyListingService.js` |
| Hook dédié | Fait | `usePharmacyListings.js` (112 lignes) |
| Carte annonce | Fait | `ListingCard.jsx` |

---

## 17. Abonnements

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Page abonnement | Fait | `subscription.jsx` (536 lignes) |
| Plans détaillés | Fait | `subscriptionPlans.jsx` (702 lignes) |
| Service complet | Fait | `subscriptionService.js` (362 lignes) |
| Tiers (free, starter, pro, business) | Fait | Définis dans `profileOptions.js` |
| Limites par tier et type utilisateur | Fait | `getSubscriptionLimits`, `checkLimit` |
| Suivi d'usage mensuel | Fait | Table `subscription_usage` |
| Table abonnements | Fait | Table `subscriptions` |
| Quotas favoris / super likes / missions | Fait | `canAddFavorite`, `canSuperLike`, `canPublishMission` |
| Paiement Stripe | **Non fait** | Aucun code Stripe — upgrade simulé localement |

---

## 18. Carte & Recherche

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Tab recherche | Fait | `app/(tabs)/search.jsx` (504 lignes) |
| Carte de France SVG | Fait | `FranceMap.jsx`, `francePaths.js` |
| Marqueurs offres | Fait | `JobMarker.jsx`, `ClusterMarker.jsx` |
| Filtres carte | Fait | `FilterModal.jsx` |
| Sélecteur de région | Fait | `RegionSelector.jsx` |
| Liste résultats | Fait | `JobListItem.jsx` |
| Zones de recherche | Fait | Table `user_search_zones` |
| expo-location | Fait | Installé et utilisé |
| react-native-maps | Fait | Installé et utilisé |

---

## 19. Réglages

| Fonctionnalité | Statut | Fichiers |
|---|---|---|
| Page réglages | Fait | `settings.jsx` |
| Confidentialité | Fait | `privacySettings.jsx` |
| Notifications | Fait | `notificationSettings.jsx` |
| Changer email | Fait | `changeEmail.jsx` |
| Changer mot de passe | Fait | `changePassword.jsx` |
| Export données (RGPD) | Fait | `exportData.jsx` (312 lignes) |
| Documents légaux | Fait | `legalDocument.jsx` |
| À propos | Fait | `about.jsx` |

---

## 20. Tests unitaires

| Élément | Statut | Fichiers |
|---|---|---|
| Infrastructure Jest | Fait | `jest.config.js`, `jest.setup.js` |
| Tests helpers (dateUtils, displayName, roleLabel, dateHelpers, common) | Fait | 5 fichiers dans `__tests__/helpers/` |
| Tests constants (profileOptions) | Fait | `__tests__/constants/profileOptions.test.js` |
| Tests services (review, favorites, matching) | Fait | 3 fichiers dans `__tests__/services/` |

---

## 21. Infrastructure & Outillage

| Élément | Statut |
|---|---|
| Supabase (Auth, DB, Storage, Realtime) | Fait |
| RPC (fonctions SQL) | Fait — 7+ services utilisent `.rpc()` |
| Realtime (messagerie) | Fait |
| Seeds de démo | Fait — `scripts/seedDemoData.js`, `seedAnimatorsLabs.js`, `seedOffersOnly.js` |
| Expo Router (file-based routing) | Fait |
| expo-image (optimisé) | Fait |
| TypeScript config | Fait — `tsconfig.json` présent |

---

## Ce qui reste à faire

### Priorité haute (pré-lancement)

| Tâche | Détail |
|---|---|
| Push notifications natives | Installer `expo-notifications`, configurer EAS + certificats APNs/FCM, implémenter l'envoi réel |
| Paiement Stripe | Intégrer Stripe SDK, créer les Edge Functions Supabase pour webhooks, connecter aux plans d'abonnement |
| Tests E2E / QA | Tester tous les parcours critiques sur device réel (iOS + Android) |
| App Store / Play Store | Configurer EAS Build, screenshots, fiches store |

### Priorité moyenne (post-lancement v1)

| Tâche | Détail |
|---|---|
| Supabase Edge Functions | Centraliser la logique côté serveur (matching, notifications push, webhooks Stripe) |
| Migrations SQL versionnées | Le dossier `supabase/migrations/` existe mais est vide — les tables ont été créées manuellement |
| Admin panel | Modération des signalements, gestion utilisateurs, dashboard analytics |
| Couverture de tests | Ajouter tests pour les hooks et composants (React Testing Library) |

### Priorité basse (v2+)

| Tâche | Détail |
|---|---|
| OAuth (Google, Apple Sign-In) | Alternatives au login email |
| Chat enrichi | GIFs, réactions, messages vocaux |
| Analytics avancées | Tableaux de bord détaillés pour labos et pharmacies |
| Mode hors-ligne | Cache local + synchronisation |

---

## Résumé

Le projet est **fonctionnellement complet à ~90%** pour un MVP. L'ensemble des parcours utilisateur (6 profils) est implémenté : inscription, profil, CV, offres, matching, messagerie temps réel, missions, alertes urgentes, favoris, abonnements (sans paiement réel), marketplace, laboratoires, carte.

Les deux manques bloquants pour la mise en production sont :
1. **Push notifications** (pas d'`expo-notifications` installé)
2. **Paiement Stripe** (aucun code)

Le reste est du polish, de la QA, et de l'infrastructure serveur.
