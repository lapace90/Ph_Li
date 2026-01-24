# Utilisation du système de détection de conflits de matches

## 📋 Vue d'ensemble

Le système détecte les conflits de dates entre une nouvelle mission et les **matches confirmés** existants (avec accès au chat), pas les simples likes unilatéraux.

## 🎯 Composants créés

1. **`missionService.checkMatchConflicts()`** - Fonction de vérification des conflits
2. **`MatchConflictModal`** - Modal d'avertissement visuel
3. **`useMatchConflicts`** - Hook React pour gérer la logique

## 💻 Intégration dans une vue de mission

### Exemple : Page de détail de mission (où l'animateur peut liker)

```javascript
// Dans app/(screens)/missionDetail.jsx ou similaire

import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { animatorMatchingService } from '../../services/animatorMatchingService';
import { useMatchConflicts } from '../../hooks/useMatchConflicts';
import MatchConflictModal from '../../components/common/MatchConflictModal';
import Button from '../../components/common/Button';

export default function MissionDetail({ route }) {
  const { mission } = route.params;
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  // Hook de gestion des conflits
  const {
    conflicts,
    showModal,
    checkAndProceed,
    handleContinue,
    handleCancel
  } = useMatchConflicts();

  // Fonction de swipe
  const handleSwipe = async (action) => {
    if (action === 'pass') {
      // Simple pass - pas besoin de vérifier les conflits
      await animatorMatchingService.animatorSwipeMission(
        session.user.id,
        mission.id,
        'pass'
      );
      return;
    }

    // Pour 'like' ou 'superlike' - vérifier les conflits
    setLoading(true);

    await checkAndProceed(
      session.user.id,
      mission.start_date,
      mission.end_date,
      async () => {
        // Cette fonction sera exécutée si pas de conflit
        // OU si l'utilisateur confirme malgré le conflit
        try {
          const result = await animatorMatchingService.animatorSwipeMission(
            session.user.id,
            mission.id,
            action
          );

          if (result.match?.status === 'matched') {
            Alert.alert('Match!', 'Vous pouvez maintenant discuter avec le laboratoire');
          }
        } catch (error) {
          Alert.alert('Erreur', error.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <View>
      {/* ... Contenu de la mission ... */}

      <View style={styles.actions}>
        <Button
          title="Passer"
          onPress={() => handleSwipe('pass')}
          disabled={loading}
        />
        <Button
          title="Liker"
          onPress={() => handleSwipe('like')}
          loading={loading}
        />
      </View>

      {/* Modal de conflit */}
      <MatchConflictModal
        visible={showModal}
        conflicts={conflicts}
        onContinue={handleContinue}
        onCancel={handleCancel}
      />
    </View>
  );
}
```

## 🔍 Détails techniques

### Logique de détection

```javascript
// Dans missionService.js
async checkMatchConflicts(animatorId, startDate, endDate) {
  // Cherche dans animator_matches
  const { data } = await supabase
    .from('animator_matches')
    .select('...')
    .eq('animator_id', animatorId)
    .eq('status', 'matched')  // ⭐ Seulement les matches confirmés!
    .gte('mission.end_date', startDate)
    .lte('mission.start_date', endDate);

  return data || [];
}
```

### Statuts des matches

| Statut | Description | Warning? |
|--------|-------------|----------|
| `'pending'` | Un seul a liké (pas de chat) | ❌ Non |
| `'matched'` | Les deux ont liké (chat ouvert) | ✅ Oui |

## 🎨 Personnalisation

### Modifier le message du modal

Éditez `components/common/MatchConflictModal.jsx`:

```javascript
<Text style={styles.message}>
  Vous avez déjà un match confirmé... // Modifier ce texte
</Text>
```

### Ajouter des actions supplémentaires

Dans le hook `useMatchConflicts.js`:

```javascript
const handleViewConflict = (conflictId) => {
  // Naviguer vers la mission en conflit
  router.push(`/mission/${conflictId}`);
};
```

## ✅ Tests recommandés

1. **Scénario simple** : Liker une mission sans conflits → OK direct
2. **Scénario conflit** : Avoir un match 15-20 janv, liker mission 17-22 janv → Modal
3. **Scénario like simple** : Liker sans que le labo ait liké → Pas de modal
4. **Scénario confirmation** : Continuer malgré le conflit → Mission likée

## 🚀 Prochaines améliorations possibles

- [ ] Afficher les conflits dans le calendrier (optionnel)
- [ ] Notification si un conflit se résout (mission acceptée)
- [ ] Statistiques de conflits évités
- [ ] Suggestion de dates alternatives
