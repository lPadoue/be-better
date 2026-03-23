# Be Better — Design Spec
**Date:** 2026-03-23
**Status:** Approved

---

## 1. Vision

"Be Better" est une web app de gestion de rappels personnels organisés en groupes thématiques. L'objectif est de permettre à l'utilisateur de passer à l'action sur ses engagements personnels (être un meilleur fils, un meilleur parent de chat, avoir de meilleures habitudes) grâce à des rappels visuels, des compteurs à rebours, et des messages d'encouragement à la validation.

---

## 2. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | SSR, routing, API routes intégrées |
| Styling | Tailwind CSS | Rapidité, cohérence |
| Backend / BDD | Supabase (PostgreSQL) | Auth multi-provider, temps réel, gratuit jusqu'à une certaine échelle |
| Auth | Supabase Auth — Email/mdp + Google + Apple | Couverture complète sans développement custom |
| Notifications v1 | Email via Resend ou Supabase Edge Functions (cron) | Simple, sans push natif |
| Hébergement | Vercel (frontend) + Supabase cloud | Déploiement continu, free tier généreux |

---

## 3. Modèle de données

### `users`
| Champ | Type | Description |
|---|---|---|
| id | uuid | Clé primaire (géré par Supabase Auth) |
| email | text | Email de l'utilisateur |
| name | text | Nom affiché |
| avatar_url | text | URL avatar (optionnel) |
| created_at | timestamptz | Date de création |

### `groups`
| Champ | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| name | text | Nom du groupe (ex: "Be better son") |
| description | text | Description optionnelle |
| owner_id | uuid | Référence vers `users.id` |
| emoji | text | Emoji représentatif (optionnel) |
| created_at | timestamptz | Date de création |

### `group_members`
| Champ | Type | Description |
|---|---|---|
| group_id | uuid | Référence vers `groups.id` |
| user_id | uuid | Référence vers `users.id` |
| role | enum | `owner` ou `member` |
| joined_at | timestamptz | Date d'adhésion |

### `actions`
| Champ | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| group_id | uuid | Référence vers `groups.id` |
| name | text | Nom de l'action (ex: "Appeler mes parents") |
| emoji | text | Emoji (optionnel) |
| recurrence_type | enum | `relative` ou `fixed` |
| recurrence_value | integer | Ex: `3` (pour 3 semaines) — utilisé si `relative` |
| recurrence_unit | enum | `hours`, `days`, `weeks`, `months` — utilisé si `relative` |
| fixed_month | integer | Mois (1-12) — utilisé si `fixed` |
| fixed_day | integer | Jour du mois — utilisé si `fixed` |
| warning_days | integer | Nombre de jours avant échéance pour passer en "orange" (défaut: 20% de la période) |
| sync_mode | enum | `shared` (compteur commun) ou `individual` (compteur par membre) |
| created_at | timestamptz | Date de création |

### `action_completions`
| Champ | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| action_id | uuid | Référence vers `actions.id` |
| user_id | uuid | Qui a validé |
| completed_at | timestamptz | Quand |
| note | text | Note optionnelle |

### `encouragements`
| Champ | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| text | text | Phrase d'encouragement |
| author_id | uuid | Référence vers `users.id` (null si système) |
| status | enum | `active`, `pending`, `rejected` |
| created_at | timestamptz | Date de soumission |

### `group_invitations`
| Champ | Type | Description |
|---|---|---|
| id | uuid | Clé primaire |
| group_id | uuid | Groupe concerné |
| invited_by | uuid | Utilisateur invitant |
| email | text | Email invité (si non inscrit) |
| token | text | Token unique pour accepter |
| status | enum | `pending`, `accepted`, `expired` |
| expires_at | timestamptz | Expiration du lien |

---

## 4. Logique métier

### Calcul du statut d'une action

Le statut est calculé à la volée depuis `action_completions` :

**Mode `relative` :**
- `last_completion` = dernière `action_completion` pour cette action (selon `sync_mode`)
  - `shared` : la plus récente toutes personnes confondues
  - `individual` : la plus récente pour l'utilisateur courant
- `next_due` = `last_completion.completed_at + recurrence_value * recurrence_unit`
- Si aucune completion : statut `never_done` (gris)

**Mode `fixed` :**
- `next_due` = prochaine occurrence de `fixed_month/fixed_day` dans l'année courante ou suivante
- La validation marque l'action comme faite pour l'année en cours

**États visuels :**
| Statut | Condition | Couleur |
|---|---|---|
| `overdue` | `now > next_due` | Rouge |
| `warning` | `now > next_due - warning_days` | Orange |
| `ok` | Dans les temps | Vert |
| `never_done` | Aucune completion | Gris |

### Phrases d'encouragement

Au moment de la validation (création d'une `action_completion`), une phrase est sélectionnée aléatoirement depuis le pool `encouragements` avec `status = 'active'`. Elle s'affiche en toast/overlay pendant 2-3 secondes.

---

## 5. Structure de l'interface

### Navigation principale
- **Home** — liste de tous les groupes de l'utilisateur, avec aperçu des statuts des actions (badges colorés)
- **Groupe** — vue détaillée d'un groupe avec toutes ses actions et bouton "✓ Fait"
- **Paramètres** — profil, gestion des groupes, invitations en attente
- **Encouragements** (futur v2) — soumettre une phrase, voir le pool communautaire

### Composants clés

**GroupCard (Home)** : carte résumant un groupe avec son nom, emoji, et les badges d'actions urgentes/en retard.

**ActionCard (vue Groupe)** : carte d'action avec :
- Nom + emoji
- Barre de progression visuelle (temps écoulé vs période totale)
- Statut coloré + texte (ex: "Dans 3 jours", "En retard de 2 jours")
- Bouton "✓ Fait" bien visible
- Indicateur des membres (si groupe partagé) + qui a validé en dernier

**CompletionToast** : overlay animé à la validation avec la phrase d'encouragement.

### Gamification
- Phrases d'encouragement contextuelles à la validation (v1 : pool statique bien choisi)
- Soumission communautaire de phrases (v2)

---

## 6. Notifications (v1)

Un cron job quotidien (Supabase Edge Function ou Vercel Cron) :
1. Récupère toutes les actions dont `next_due <= now + 24h`
2. Groupe par utilisateur
3. Envoie un email récapitulatif via **Resend** listant les actions à faire

Format email : simple, lisible, avec un lien direct vers l'app.

---

## 7. Partage de groupes

1. Le owner d'un groupe génère un lien d'invitation (crée un `group_invitation` avec token unique)
2. Le lien est partagé par email ou copié
3. Le destinataire clique le lien → s'inscrit ou se connecte → rejoint le groupe comme `member`
4. Il voit immédiatement les actions du groupe avec leurs statuts
5. Le lien expire après 7 jours

---

## 8. Hors scope v1

- Push notifications (iOS/Android)
- Marketplace de templates de groupes
- Soumission communautaire de phrases d'encouragement
- App mobile native
- Streaks / points / leaderboard
- Commentaires sur les actions
- Historique complet des completions (au-delà du calcul du prochain rappel)

---

## 9. Prompt pour maquettes Stitch / outil de design

> **Brief design pour "Be Better"**
>
> Application web de rappels personnels organisés en groupes thématiques. Style : moderne, chaleureux, légèrement gamifié. Palette sombre (dark mode first) avec des accents colorés pour les statuts (rouge = en retard, orange = bientôt dû, vert = ok, gris = jamais fait).
>
> **Écran 1 — Home (liste des groupes)**
> Header avec avatar utilisateur + bouton "Nouveau groupe". Grille de cards de groupes, chacune avec : emoji + nom du groupe, badges colorés indiquant les actions urgentes (ex: "2 en retard", "1 bientôt dû"). Bouton flottant "+" pour créer un groupe.
>
> **Écran 2 — Vue groupe**
> Header avec emoji + nom du groupe, nombre de membres (avatars). Liste verticale de cartes d'action, chacune avec : emoji + nom, barre de progression horizontale, statut coloré + texte relatif ("Dans 3 jours", "En retard de 2 jours"), grand bouton "✓ Fait" à droite.
>
> **Écran 3 — Validation (toast/overlay)**
> Animation de validation en plein écran ou overlay : grand checkmark animé, phrase d'encouragement centrée (ex: "Tes parents sourient de loin ✨"), fond coloré festif pendant 2 secondes puis retour automatique.
>
> **Principes de design :**
> Dark mode first, typographie claire et lisible, beaucoup d'espace, micro-animations sur les boutons et les transitions, couleurs vives pour les statuts mais sans agressivité.
