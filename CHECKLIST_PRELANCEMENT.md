# Checklist Pré-Lancement PharmaLink

## 🔐 Authentification & Sécurité
- [ ] Inscription nouveau compte (email + mot de passe)
- [ ] Connexion compte existant
- [ ] Déconnexion
- [ ] Mot de passe oublié (email reçu ?)
- [ ] Suppression de compte
- [ ] Session persistante après fermeture app

## 👤 Profils (tester chaque type)
### Candidat (préparateur/pharmacien)
- [ ] Création profil complet
- [ ] Upload photo
- [ ] Modification infos
- [ ] Badge 100% affiché quand complet

### Titulaire
- [ ] Création profil pharmacie
- [ ] Vérification RPPS (valide + invalide)

### Laboratoire
- [ ] Création profil labo
- [ ] Vérification SIRET (valide + invalide)
- [ ] Upload logo

### Animateur
- [ ] Création profil animateur
- [ ] Spécialités et tarifs

## 💼 Offres & Matching
### Côté Employeur
- [ ] Créer une offre d'emploi
- [ ] Créer une offre de stage
- [ ] Modifier une offre
- [ ] Clôturer une offre
- [ ] Swiper sur des candidats
- [ ] Super Like

### Côté Candidat
- [ ] Voir les offres disponibles
- [ ] Swiper like/dislike
- [ ] Super Like
- [ ] Match créé quand mutuel ?

## 🎯 Animations (Labo ↔ Animateur)
- [ ] Créer une mission
- [ ] Postuler à une mission
- [ ] Accepter/refuser candidature
- [ ] Confirmer mission
- [ ] Terminer mission

## 💬 Messagerie
- [ ] Conversation après match
- [ ] Envoi de messages
- [ ] Réception en temps réel
- [ ] Signaler un message

## ⭐ Favoris
- [ ] Ajouter un favori
- [ ] Retirer un favori
- [ ] Limite atteinte (free tier)

## 🔔 Notifications
- [ ] Notification nouveau match
- [ ] Notification super like
- [ ] Notification nouveau message
- [ ] Annonces admin visibles
- [ ] Modal détail notification

## 💳 Abonnements
- [ ] Affichage plans disponibles
- [ ] Limites free tier respectées
- [ ] Upgrade vers plan payant (sandbox Stripe)
- [ ] Fonctionnalités premium débloquées

## 🚫 Blocage & Signalement
- [ ] Bloquer un utilisateur
- [ ] Utilisateur bloqué invisible dans le feed
- [ ] Signaler un profil
- [ ] Signaler un message

## 📝 Avis
- [ ] Laisser un avis après mission
- [ ] Voir les avis reçus
- [ ] Note moyenne affichée

## 🏪 Marketplace Pharmacies
- [ ] Voir les annonces
- [ ] Créer une annonce
- [ ] Contacter vendeur

## 📱 UX Générale
- [ ] Navigation fluide (pas de freeze)
- [ ] Pas de crash
- [ ] Messages d'erreur clairs
- [ ] Loading states affichés
- [ ] Pull-to-refresh fonctionne
- [ ] Clavier ne cache pas les inputs
- [ ] Retour arrière cohérent

## 🔧 Tests Techniques
- [ ] App fonctionne hors-ligne (mode dégradé)
- [ ] Reconnexion après perte réseau
- [ ] Images chargent correctement
- [ ] Pas de memory leak (usage prolongé)

## 📲 Spécifique iOS
- [ ] Notch/Dynamic Island bien gérés
- [ ] Safe areas respectées
- [ ] Clavier iOS ne bug pas

## 📲 Spécifique Android
- [ ] Bouton retour hardware fonctionne
- [ ] Permissions demandées (caméra, galerie)
- [ ] Pas de problème de clavier

---

## 🚀 Avant Soumission Store
- [ ] app.json : bundleIdentifier iOS configuré
- [ ] app.json : package Android configuré
- [ ] eas.json créé pour EAS Build
- [ ] Icônes et splash screen finaux
- [ ] Screenshots pour stores
- [ ] Description app rédigée
- [ ] Politique de confidentialité URL
- [ ] CGU URL

---

## 📊 Monitoring Post-Lancement
- [ ] Sentry ou équivalent configuré
- [ ] Dashboard Supabase accessible
- [ ] Alertes email si erreurs critiques
