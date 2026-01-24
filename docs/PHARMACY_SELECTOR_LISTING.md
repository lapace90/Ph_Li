# Sélecteur de pharmacies pour création d'annonces

## 📋 Vue d'ensemble

Fonctionnalité permettant aux titulaires de pré-remplir rapidement le formulaire de création d'annonces marketplace en sélectionnant une de leurs pharmacies déjà enregistrées.

## 🎯 Objectif

Simplifier et accélérer la création d'annonces (vente, location-gérance, association) en évitant la saisie manuelle des informations déjà enregistrées.

## 🔧 Fichiers modifiés

### app/(screens)/listingCreate.jsx

**Imports ajoutés:**
- `Modal`, `ActivityIndicator` depuis react-native
- `usePharmacyDetails` hook

**États ajoutés:**
```javascript
const [showPharmacySelector, setShowPharmacySelector] = useState(false);
const [selectedPharmacy, setSelectedPharmacy] = useState(null);
const { pharmacies, loading: pharmaciesLoading } = usePharmacyDetails(session?.user?.id);
```

**Fonction principale:**
```javascript
const handlePharmacySelect = (pharmacy) => {
  // Génère un titre suggéré selon le type d'annonce
  // Pré-remplit ville, code postal, région, coordonnées GPS
  // Pré-remplit nombre d'employés
}
```

**Composants ajoutés:**
1. `PharmacySelectorModal` - Modal de sélection
2. Bouton de sélection dans `StepInfo`
3. Carte de pharmacie sélectionnée

## 🎨 Interface utilisateur

### Étape 1: Bouton de sélection

```
┌────────────────────────────────────────────┐
│ [🏢]  Choisir une pharmacie            >   │
│       Pré-remplir avec une de vos          │
│       pharmacies (3)                        │
└────────────────────────────────────────────┘
```

### Étape 2: Modal de sélection

```
┌────────────────────────────────────────────┐
│ Sélectionner une pharmacie            [X]  │
├────────────────────────────────────────────┤
│ [🏢] Pharmacie Centrale           ✓     >  │
│      12 rue de la Paix, Paris              │
│      SIRET: 123 456 789 01234              │
│                                            │
│ [🏢] Pharmacie du Marché               >  │
│      5 avenue Victor Hugo, Lyon            │
│      SIRET: 987 654 321 09876              │
└────────────────────────────────────────────┘
```

### Étape 3: Pharmacie sélectionnée

```
┌────────────────────────────────────────────┐
│ [✓] Pharmacie Centrale          [Changer]  │
│     Paris • Vérifié                        │
└────────────────────────────────────────────┘
```

## 🔄 Flux utilisateur

1. **Arrivée sur l'étape "Infos"**
   - Si le titulaire a des pharmacies enregistrées → Affiche le bouton
   - Sinon → Formulaire normal

2. **Clic sur "Choisir une pharmacie"**
   - Modal s'ouvre avec liste des pharmacies
   - Affiche nom, adresse, SIRET, badge vérifié

3. **Sélection d'une pharmacie**
   - Ferme la modal
   - Pré-remplit le formulaire:
     - Titre: "[Nom pharmacie] - [Type annonce]"
     - Ville, code postal, région, département
     - Coordonnées GPS (latitude, longitude)
     - Nombre d'employés
   - Affiche un alert de confirmation
   - Montre la carte verte de pharmacie sélectionnée

4. **Modification possible**
   - Bouton "Changer" pour choisir une autre pharmacie
   - Tous les champs pré-remplis sont modifiables manuellement

## 📊 Données pré-remplies

| Champ formulaire | Source (pharmacy_details) |
|------------------|---------------------------|
| `title` | Généré: `pharmacy.name` + type d'annonce |
| `city` | `pharmacy.city` |
| `postal_code` | `pharmacy.postal_code` |
| `region` | `pharmacy.region` |
| `department` | `pharmacy.department` |
| `latitude` | `pharmacy.latitude` |
| `longitude` | `pharmacy.longitude` |
| `characteristics.staff_count` | `pharmacy.employee_count` |

## 💡 Exemples de titres générés

### Vente
```
"Pharmacie Centrale - À vendre"
"Pharmacie du Marché - À vendre"
```

### Location-gérance
```
"Pharmacie Centrale - Location-gérance"
```

### Association
```
"Pharmacie Centrale - Recherche associé"
```

## ✨ Avantages

1. **Gain de temps**: Pas de re-saisie des informations
2. **Exactitude**: Données déjà vérifiées (SIRET validé)
3. **Cohérence**: Informations identiques entre pharmacies et annonces
4. **Expérience utilisateur**: Interface intuitive et fluide
5. **Flexibilité**: Modification manuelle toujours possible

## 🔐 Sécurité

- Seules les pharmacies du titulaire connecté sont affichées (via `owner_id`)
- Utilisation du hook `usePharmacyDetails` qui filtre par `session.user.id`
- Aucune fuite de données vers d'autres utilisateurs

## 📝 Cas d'usage

### Titulaire avec 3 pharmacies
- Veut vendre une des pharmacies
- Clique sur "Choisir une pharmacie"
- Sélectionne la pharmacie à vendre
- Le formulaire se pré-remplit avec les bonnes infos
- Ajoute le prix, les photos, et publie

### Titulaire sans pharmacie enregistrée
- Ne voit pas le bouton de sélection
- Remplit le formulaire manuellement (comportement normal)

## 🚀 Améliorations futures possibles

- [ ] Ajouter un filtre/recherche dans le modal si beaucoup de pharmacies
- [ ] Pré-remplir aussi la description avec des infos de la pharmacie
- [ ] Suggérer un prix basé sur le CA ou la surface
- [ ] Lier directement l'annonce à la pharmacie dans la base de données
- [ ] Permettre de créer une pharmacie depuis le modal si aucune n'existe

## 🔗 Fichiers liés

- `app/(screens)/listingCreate.jsx` - Formulaire modifié
- `hooks/usePharmacyDetails.js` - Hook de chargement des pharmacies
- `services/pharmacyDetailsService.js` - Service de gestion des pharmacies
- `app/(screens)/pharmacyManagement.jsx` - Gestion des pharmacies

## 🎯 Date d'implémentation

**24 janvier 2026**
