# Mises à jour RGPD - Traitement des données SIRET

## 📅 Date de mise à jour
**24 janvier 2026**

## 🎯 Objet
Mise à jour de la politique de confidentialité et des CGU pour refléter le nouveau traitement des données SIRET (numéros d'identification des établissements).

## 📝 Documents modifiés

### 1. Politique de Confidentialité
**Fichier**: `app/(screens)/legalDocument.jsx` - Section `privacy`

#### Modifications apportées:

**Section 1 - Collecte des données**
- ✅ Ajouté: "numéro SIRET (pour titulaires, animateurs et laboratoires)"

**Section 3 - Traitement du numéro SIRET** (NOUVELLE)
```
Finalité : Vérification du statut professionnel
Base légale : Consentement explicite
Traitement : Vérification via API Sirene (INSEE)
Stockage : Base de données UE (table verification_documents)
Partage : Affichage formaté sur profil, jamais vendu à des tiers
Pharmacies multiples : Stockage dans pharmacy_details
Suppression : Anonymisation immédiate à la suppression du compte
```

**Section 4 - Utilisation des données**
- ✅ Ajouté: "vérifier votre statut professionnel (RPPS/SIRET)"

**Section 5 - Partage des données**
- ✅ Ajouté: "l'API INSEE pour vérification SIRET"

**Section 6 - Protection des données**
- ✅ Ajouté: "stockage sécurisé des numéros RPPS/SIRET avec contraintes d'unicité"

**Section 7 - Conservation des données**
- ✅ Ajouté: "SIRET" dans la liste des données anonymisées
- ✅ Ajouté: "Données de vérification (RPPS/SIRET) : conservées dans verification_documents avec statut et date, anonymisées à la suppression du compte"

**Section 8 - Vos droits (RGPD)**
- ✅ Ajouté: "y compris RPPS/SIRET" pour le droit à l'effacement
- ✅ Ajouté: "notamment pour les vérifications RPPS et SIRET (supprime les badges)"

**Section 10 - Transferts hors UE**
- ✅ Ajouté: "Les vérifications RPPS (API ANS) et SIRET (API INSEE) sont effectuées via des API françaises"

### 2. Conditions Générales d'Utilisation (CGU)
**Fichier**: `app/(screens)/legalDocument.jsx` - Section `cgu`

#### Modifications apportées:

**Section 1 - Objet**
- ✅ Ajouté: "et de l'animation commerciale"

**Section 4 - Services proposés**
- ✅ Ajouté: "mettre en relation laboratoires et animateurs commerciaux"
- ✅ Ajouté: "Un marketplace dédié permet aux laboratoires de trouver des animateurs freelance vérifiés"

**Section 5 - Vérifications professionnelles** (MODIFIÉE)
- ✅ Renommée de "Vérification RPPS" à "Vérifications professionnelles"
- ✅ Ajouté sous-section "Vérification SIRET":
  ```
  Les titulaires de pharmacie, animateurs freelance et laboratoires
  peuvent soumettre leur numéro SIRET pour obtenir un badge de
  vérification professionnelle. Cette vérification renforce la
  confiance sur le marketplace et sécurise les transactions.
  ```

**Section 6 - Responsabilités**
- ✅ Ajouté: "y compris vos numéros RPPS et SIRET"
- ✅ Ajouté: "de retirer les badges de vérification en cas de signalement justifié ou d'informations frauduleuses"

### 3. Export de données RGPD
**Fichier**: `app/(screens)/exportData.jsx`

#### Ajouts au fichier d'export JSON:

**Nouvelles données incluses:**

1. **Vérification SIRET personnelle**
   ```json
   "siretVerification": {
     "siretNumber": "12345678901234",
     "status": "approved",
     "verificationData": { ... },
     "submittedAt": "2026-01-24T...",
     "verifiedAt": "2026-01-24T...",
     "rejectionReason": null
   }
   ```

2. **Pharmacies multiples** (pour titulaires)
   ```json
   "pharmacies": [
     {
       "name": "Pharmacie Centrale",
       "legalName": "SARL Pharmacie Centrale",
       "siret": "98765432109876",
       "siretVerified": true,
       "address": "12 rue de la Paix",
       "city": "Paris",
       "postalCode": "75001",
       "department": "Paris",
       "region": "Île-de-France",
       "phone": "0123456789",
       "email": "contact@pharmacie.fr",
       "pharmacyType": "officine",
       "finessNumber": "750000000",
       "createdAt": "2026-01-20T...",
       "verifiedAt": "2026-01-24T..."
     }
   ]
   ```

## 🔒 Conformité RGPD

### Principes respectés:

✅ **Transparence**
- Informations claires sur la collecte et l'utilisation du SIRET
- Finalités explicites

✅ **Consentement**
- Base légale: consentement explicite lors de la soumission
- Facultatif et révocable

✅ **Minimisation**
- Collecte uniquement pour vérification professionnelle
- Pas de traitement excessif

✅ **Exactitude**
- Vérification via API officielle INSEE
- Mise à jour possible

✅ **Limitation de conservation**
- Durée: pendant utilisation du service
- Anonymisation immédiate à la suppression

✅ **Intégrité et confidentialité**
- Stockage sécurisé (chiffrement, RLS)
- Hébergement UE

✅ **Responsabilité**
- Traçabilité complète (table verification_documents)
- Documentation exhaustive

### Droits des utilisateurs:

✅ **Droit d'accès**
- Export JSON complet incluant vérifications SIRET

✅ **Droit de rectification**
- Modification possible du SIRET via nouvelle soumission

✅ **Droit à l'effacement**
- Anonymisation immédiate du SIRET à la suppression du compte
- Suppression manuelle possible (retrait badge)

✅ **Droit à la portabilité**
- Format JSON structuré dans l'export

✅ **Droit de retirer son consentement**
- Suppression possible de la vérification SIRET
- Badge retiré automatiquement

## 📊 Données concernées

### Types d'utilisateurs affectés:

1. **Titulaires de pharmacie**
   - RPPS (existant) + SIRET personnel (nouveau) + Pharmacies multiples (nouveau)

2. **Animateurs freelance**
   - SIRET personnel (nouveau)

3. **Laboratoires**
   - SIRET personnel (nouveau)

4. **Préparateurs**
   - RPPS uniquement (existant)

5. **Candidats professionnels de santé**
   - RPPS facultatif (existant) - renforce la crédibilité

### Données SIRET stockées:

| Table | Champ | Description |
|-------|-------|-------------|
| `verification_documents` | `document_reference` | Numéro SIRET (14 chiffres) |
| `verification_documents` | `verification_data` | JSON: nom, activité, adresse INSEE |
| `verification_documents` | `status` | approved/rejected/pending |
| `pharmacy_details` | `siret` | Numéro SIRET de la pharmacie |
| `pharmacy_details` | `siret_verified` | Booléen de vérification |

## 🔗 API externes utilisées

### API Sirene (INSEE)
- **URL**: `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/{siret}`
- **Localisation**: France 🇫🇷
- **Données retournées**: Nom, adresse, activité (NAF), état administratif
- **Conformité**: API publique française, RGPD compliant

### Données transmises à l'API:
- Numéro SIRET uniquement (14 chiffres)

### Données reçues de l'API:
- Dénomination sociale
- Adresse complète
- Code NAF (activité)
- État administratif (actif/fermé)

## 📧 Communication aux utilisateurs

### Actions requises:

1. ✅ **Notification in-app** (à implémenter)
   - Popup "Mise à jour de notre politique de confidentialité"
   - Lien vers les nouvelles conditions

2. ✅ **Email** (optionnel)
   - "Nous avons mis à jour notre politique de confidentialité"
   - Résumé des changements

3. ✅ **Écrans de vérification**
   - Texte explicatif sur l'utilisation du SIRET
   - Consentement lors de la soumission

## ✅ Checklist de conformité

- [x] Politique de confidentialité mise à jour
- [x] CGU mises à jour
- [x] Date de mise à jour actualisée (24 janvier 2026)
- [x] Export RGPD inclut les données SIRET
- [x] Export RGPD inclut les pharmacies multiples
- [x] Base légale: consentement explicite
- [x] API utilisée: française et RGPD compliant
- [x] Stockage: Union Européenne
- [x] Droit à l'effacement: implémenté
- [x] Traçabilité: table verification_documents
- [ ] Notification utilisateurs (à planifier)
- [ ] Email notification (optionnel)

## 📞 Contact DPO

Pour toute question relative à ces modifications:
- **Email**: dpo@pharmalink.fr
- **Réclamation CNIL**: www.cnil.fr

## 📚 Références

- **RGPD**: Règlement (UE) 2016/679
- **API Sirene**: https://entreprise.data.gouv.fr
- **Table verification_documents**: Voir schéma base de données
- **Documentation technique**: Voir `docs/SIRET_VERIFICATION_SYSTEM.md`
