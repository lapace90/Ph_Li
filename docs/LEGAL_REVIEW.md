# PharmaLink — Documents Légaux pour Examen Juridique

**Date de rédaction** : 28 janvier 2026
**Version** : 1.0.0
**Statut** : À valider par un avocat avant mise en production

---

## Contexte de l'application

### Description

PharmaLink est une application mobile (iOS/Android) de mise en relation entre professionnels du secteur pharmaceutique. Elle fonctionne sur un modèle de "matching" similaire aux applications de recrutement.

### Types d'utilisateurs

| Type | Description | Particularités |
|------|-------------|----------------|
| Préparateur | Préparateur en pharmacie (salarié) | Candidat, recherche emploi |
| Titulaire | Pharmacien titulaire d'officine | Employeur, publie des offres |
| Étudiant | Étudiant en pharmacie | Candidat, recherche stages |
| Animateur | Animateur commercial freelance | Indépendant, recherche missions |
| Laboratoire | Laboratoire pharmaceutique | Employeur, propose des missions d'animation |
| Conseiller | Conseiller (rôle spécial) | Rôle consultatif |

### Fonctionnalités principales

1. **Matching emploi** : Candidats ↔ Offres d'emploi/stage (swipe like/dislike)
2. **Matching missions** : Animateurs ↔ Laboratoires (missions d'animation commerciale)
3. **Messagerie** : Communication entre utilisateurs matchés
4. **CV** : Création et gestion de CV (structurés ou PDF)
5. **Alertes urgentes** : Besoins de remplacement urgent géolocalisés
6. **Marketplace** : Annonces de vente/cession de pharmacies
7. **Abonnements** : Modèle freemium avec plans payants (Stripe à venir)
8. **Vérifications** : RPPS (professionnels de santé) et SIRET (entreprises)

### Stack technique

- **Frontend** : React Native (Expo)
- **Backend** : Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Hébergement** : Union Européenne (Supabase eu-west)
- **Paiements** : Stripe (à implémenter)

### Données sensibles traitées

| Donnée | Sensibilité | Base légale |
|--------|-------------|-------------|
| Nom, prénom, email | Personnelle | Contrat |
| Téléphone | Personnelle | Consentement |
| Localisation | Personnelle | Consentement |
| RPPS | Professionnelle sensible | Consentement explicite |
| SIRET | Professionnelle | Consentement explicite |
| CV | Professionnelle | Consentement |
| Messages | Personnelle | Contrat |
| Signalements | Personnelle | Intérêt légitime |

---

## Conditions Générales d'Utilisation

**Dernière mise à jour** : 28 janvier 2026

### 1. Objet

Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application PharmaLink, plateforme de mise en relation entre professionnels du secteur pharmaceutique et de l'animation commerciale.

### 2. Acceptation des conditions

L'utilisation de l'application implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.

### 3. Inscription et compte

L'accès aux fonctionnalités de l'application nécessite la création d'un compte. Vous vous engagez à fournir des informations exactes et à jour, et à maintenir la confidentialité de vos identifiants.

### 4. Services proposés

PharmaLink permet aux professionnels de : créer un profil professionnel, rechercher des opportunités d'emploi, publier des offres d'emploi, mettre en relation laboratoires et animateurs commerciaux, et entrer en contact avec d'autres professionnels. Un marketplace dédié permet aux laboratoires de trouver des animateurs freelance vérifiés.

### 5. Vérifications professionnelles

**Vérification RPPS** : Les professionnels de santé (pharmaciens titulaires, préparateurs, candidats professionnels) peuvent soumettre leur numéro RPPS (Répertoire Partagé des Professionnels de Santé) pour obtenir un badge de vérification. Cette vérification est requise pour les titulaires souhaitant publier des offres d'emploi et renforce la crédibilité des candidats auprès des recruteurs.

**Vérification SIRET** : Les titulaires de pharmacie, animateurs freelance et laboratoires peuvent soumettre leur numéro SIRET pour obtenir un badge de vérification professionnelle. Cette vérification renforce la confiance sur le marketplace et sécurise les transactions.

Toutes ces vérifications sont facultatives mais fortement recommandées pour bénéficier de toutes les fonctionnalités de la plateforme.

### 6. Responsabilités

Vous êtes responsable du contenu que vous publiez et de l'exactitude des informations fournies, y compris vos numéros RPPS et SIRET. PharmaLink se réserve le droit de supprimer tout contenu inapproprié, de retirer les badges de vérification en cas de signalement justifié ou d'informations frauduleuses, et de suspendre les comptes contrevenant aux présentes CGU.

### 7. Signalement et modération

**Signalement** : Vous pouvez signaler tout utilisateur ou contenu que vous jugez inapproprié, frauduleux, offensant ou contraire aux présentes CGU. Les motifs de signalement incluent : spam, harcèlement, contenu inapproprié, faux profil, arnaque.

**Traitement** : Chaque signalement est examiné par notre équipe de modération. Nous pouvons prendre les mesures suivantes : avertissement, suppression de contenu, suspension temporaire ou permanente du compte signalé.

**Confidentialité** : L'identité des signaleurs n'est jamais communiquée aux utilisateurs signalés.

**Abus** : Les signalements abusifs ou de mauvaise foi peuvent entraîner la suspension du compte du signaleur.

### 8. Blocage d'utilisateurs

Vous pouvez bloquer tout utilisateur de votre choix. Conséquences du blocage :

- L'utilisateur bloqué ne pourra plus vous contacter par messagerie
- Vous ne verrez plus son profil, ses offres ou son contenu
- Il ne verra plus votre profil ni vos offres
- Les matchs existants avec cet utilisateur seront masqués

Vous pouvez débloquer un utilisateur à tout moment depuis Paramètres > Utilisateurs bloqués. Le blocage est une action privée : l'utilisateur bloqué n'est pas notifié.

### 9. Propriété intellectuelle

L'ensemble des éléments de l'application (textes, graphiques, logos, etc.) sont protégés par le droit de la propriété intellectuelle et appartiennent à PharmaLink.

### 10. Modification des CGU

PharmaLink se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle.

---

## Politique de Confidentialité

**Dernière mise à jour** : 28 janvier 2026

### 1. Collecte des données

Nous collectons les données que vous nous fournissez lors de votre inscription et utilisation de l'application : nom, prénom, email, téléphone, informations professionnelles, CV, données de localisation, numéro RPPS (pour professionnels de santé : pharmaciens titulaires, préparateurs, candidats professionnels), numéro SIRET (pour titulaires, animateurs et laboratoires), ainsi que les données liées à vos interactions (signalements effectués, utilisateurs bloqués).

### 2. Traitement du numéro RPPS

**Finalité** : Le numéro RPPS est collecté uniquement pour vérifier votre statut de professionnel de santé et attribuer un badge de confiance sur votre profil.

**Base légale** : Consentement explicite lors de la soumission volontaire du numéro.

**Traitement** : Votre numéro RPPS est vérifié via l'Annuaire Santé (API ANS) pour confirmer votre identité professionnelle. Nous comparons le nom associé au RPPS avec celui de votre profil.

**Stockage** : Le numéro RPPS est stocké de manière sécurisée dans notre base de données hébergée en Union Européenne. Seuls les 5 derniers chiffres peuvent être affichés partiellement sur votre profil.

**Partage** : Le numéro RPPS complet n'est jamais partagé avec d'autres utilisateurs ni des tiers. Seul le statut "vérifié" ou "non vérifié" est visible.

**Suppression** : En cas de suppression de compte, le numéro RPPS est anonymisé immédiatement avec l'ensemble de vos données personnelles.

### 3. Traitement du numéro SIRET

**Finalité** : Le numéro SIRET est collecté pour vérifier le statut professionnel des titulaires de pharmacie, animateurs freelance et laboratoires, et attribuer un badge de confiance sur leur profil.

**Base légale** : Consentement explicite lors de la soumission volontaire du numéro.

**Traitement** : Votre numéro SIRET est vérifié via l'API Sirene (INSEE) pour confirmer l'existence et l'état actif de votre établissement. Nous vérifions également la correspondance entre les informations de l'établissement et votre profil.

**Stockage** : Le numéro SIRET est stocké de manière sécurisée dans notre base de données (table verification_documents) hébergée en Union Européenne. Le numéro peut être affiché formaté (XXX XXX XXX XXXXX) sur votre profil.

**Partage** : Le numéro SIRET n'est jamais partagé avec des tiers commerciaux. Il peut être affiché sur votre profil public pour renforcer la confiance. Seul le statut "vérifié" ou "non vérifié" est obligatoirement visible.

**Pharmacies multiples** : Pour les titulaires gérant plusieurs pharmacies, chaque SIRET de pharmacie est stocké dans la table pharmacy_details avec vérification individuelle.

**Suppression** : En cas de suppression de compte, le numéro SIRET et toutes les données de vérification sont anonymisés immédiatement avec l'ensemble de vos données personnelles.

### 4. Données de signalement et blocage

**Signalements** : Lorsque vous signalez un utilisateur ou un contenu, nous collectons : votre identifiant, l'identifiant de la cible, le motif du signalement, et la description optionnelle. Ces données sont utilisées pour modérer la plateforme et ne sont accessibles qu'à notre équipe de modération.

**Blocages** : Lorsque vous bloquez un utilisateur, nous enregistrons uniquement les identifiants des deux parties et la date. Cette information est utilisée pour filtrer le contenu que vous voyez et empêcher les communications.

**Base légale** : Intérêt légitime (sécurité de la plateforme et des utilisateurs).

**Conservation** : Les signalements sont conservés 3 ans à des fins de traçabilité. Les blocages sont conservés tant que vous ne débloquez pas l'utilisateur ou que votre compte est actif.

**Confidentialité** : L'identité des signaleurs n'est jamais communiquée aux utilisateurs signalés. Les utilisateurs bloqués ne sont pas informés du blocage.

### 5. Utilisation des données

Vos données sont utilisées pour : fournir nos services, améliorer l'expérience utilisateur, vous mettre en relation avec des employeurs ou candidats, vérifier votre statut professionnel (RPPS/SIRET), assurer la sécurité de la plateforme (modération), et vous envoyer des communications relatives à nos services.

### 6. Partage des données

Vos données peuvent être partagées avec : les autres utilisateurs selon vos paramètres de confidentialité, nos prestataires techniques (hébergement Supabase en UE), l'API INSEE pour vérification SIRET, l'API ANS pour vérification RPPS, et les autorités si requis par la loi. Les données de signalement ne sont jamais partagées avec les utilisateurs signalés. Vos données ne sont jamais vendues à des tiers.

### 7. Protection des données

Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données : chiffrement en transit (TLS) et au repos, contrôle d'accès strict (Row Level Security), sauvegardes régulières, stockage sécurisé des numéros RPPS/SIRET avec contraintes d'unicité, et hébergement exclusif en Union Européenne.

### 8. Conservation des données

| Type de données | Durée de conservation |
|-----------------|----------------------|
| Données de compte | Durée d'utilisation du service |
| Après suppression du compte | Anonymisation immédiate |
| Données de vérification (RPPS/SIRET) | Anonymisées à la suppression du compte |
| Données de signalement | 3 ans (traçabilité et prévention des abus) |
| Données de blocage | Jusqu'au déblocage ou suppression du compte |
| Données de connexion | 12 mois (sécurité) |
| Messages | 1 an puis suppression automatique |

### 9. Vos droits (RGPD)

Conformément au RGPD, vous disposez des droits suivants :

- **Droit d'accès** : obtenir une copie de vos données (export JSON disponible dans l'app)
- **Droit de rectification** : modifier vos informations à tout moment
- **Droit à l'effacement** : supprimer votre compte et toutes vos données (y compris RPPS/SIRET)
- **Droit à la portabilité** : récupérer vos données dans un format structuré
- **Droit d'opposition** : refuser le matching automatique ou les communications marketing
- **Droit de retirer votre consentement** : notamment pour les vérifications RPPS et SIRET (supprime les badges)

Pour exercer ces droits, rendez-vous dans Paramètres > Données personnelles ou contactez-nous.

### 10. Cookies et traceurs

L'application mobile n'utilise pas de cookies. Des identifiants techniques sont utilisés uniquement pour le fonctionnement de l'authentification et des notifications push.

### 11. Transferts hors UE

Vos données sont exclusivement stockées et traitées au sein de l'Union Européenne (hébergement Supabase région eu-west). Les vérifications RPPS (API ANS) et SIRET (API INSEE) sont effectuées via des API françaises. Aucun transfert vers des pays tiers n'est effectué.

### 12. Contact DPO

Pour toute question relative à vos données personnelles ou pour exercer vos droits, contactez notre Délégué à la Protection des Données :

- **Email** : dpo@pharmalink.fr
- **Adresse** : [Adresse de l'entreprise]

Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).

---

## Annexes techniques

### A. Schéma des données personnelles

```
profiles
├── id (UUID)
├── first_name (TEXT)
├── last_name (TEXT)
├── email (via auth.users)
├── phone (TEXT)
├── photo_url (TEXT)
├── current_city (TEXT)
├── current_region (TEXT)
├── current_latitude (FLOAT)
├── current_longitude (FLOAT)
└── ...

verification_documents
├── user_id (UUID)
├── document_type ('rpps' | 'siret')
├── document_number (TEXT) -- RPPS ou SIRET
├── status ('pending' | 'verified' | 'rejected')
├── verified_at (TIMESTAMP)
└── ...

user_reports
├── reporter_id (UUID)
├── reported_user_id (UUID)
├── reported_content_type (TEXT)
├── reported_content_id (UUID)
├── reason (TEXT)
├── description (TEXT)
├── status ('pending' | 'reviewing' | 'resolved' | 'dismissed')
└── ...

user_blocks
├── blocker_id (UUID)
├── blocked_id (UUID)
└── created_at (TIMESTAMP)
```

### B. Sous-traitants

| Sous-traitant | Service | Localisation | DPA |
|---------------|---------|--------------|-----|
| Supabase | BDD, Auth, Storage | UE (eu-west) | À signer |
| Stripe | Paiements | UE | Standard |
| Expo (EAS) | Build & notifications | USA | À vérifier |
| INSEE | API Sirene (SIRET) | France | API publique |
| ANS | API Annuaire Santé (RPPS) | France | API publique |

### C. Mesures de sécurité

- Chiffrement TLS 1.3 en transit
- Chiffrement AES-256 au repos (Supabase)
- Row Level Security (RLS) sur toutes les tables
- Authentification JWT avec refresh tokens
- Rate limiting sur les API
- Logs d'accès conservés 12 mois

### D. Points à valider avec l'avocat

1. **Consentement RPPS** : Le numéro RPPS est-il considéré comme donnée de santé ? Faut-il un consentement renforcé ?

2. **Base légale signalements** : L'intérêt légitime est-il suffisant ou faut-il un consentement ?

3. **Conservation 3 ans signalements** : Cette durée est-elle justifiée juridiquement ?

4. **Transferts Expo** : Expo (notifications push) est basé aux USA. Faut-il des clauses contractuelles types ?

5. **Modération** : Les délais de traitement des signalements doivent-ils être précisés ?

6. **Marketplace** : Faut-il des CGV spécifiques pour les transactions de pharmacies ?

7. **Responsabilité vérifications** : Quelle est notre responsabilité si un RPPS/SIRET vérifié s'avère frauduleux ?

8. **Mineurs** : Faut-il explicitement interdire l'accès aux mineurs ?

9. **Abonnements** : Faut-il des mentions spécifiques pour le droit de rétractation (14 jours) ?

10. **Mentions légales** : Quelles mentions obligatoires pour l'éditeur de l'application ?

---

## Informations entreprise (à compléter)

- **Raison sociale** : [À compléter]
- **Forme juridique** : [À compléter]
- **Capital social** : [À compléter]
- **Siège social** : [À compléter]
- **RCS** : [À compléter]
- **SIRET** : [À compléter]
- **TVA intracommunautaire** : [À compléter]
- **Directeur de la publication** : [À compléter]
- **Hébergeur** : Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992
