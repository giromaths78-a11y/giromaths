# GiroMaths

Cours de mathématiques au collège (6ème, 5ème, 4ème, 3ème) : cours professeur, cours élève, fiches d'exercices, vidéos et outils interactifs, rangés séquence par séquence.

Ce dépôt est à la fois **le site** (à ouvrir avec `index.html`, publié sur Netlify) et **une arborescence de fichiers** que l'on peut parcourir directement sur GitHub.

## Les niveaux

| Niveau | Séquences |
|---|---|
| [6ème](6eme/README.md) | 21 séquences (progression 2026-2027) |
| [5ème](5eme/README.md) | à venir |
| [4ème](4eme/README.md) | à venir |
| [3ème](3eme/README.md) | 18 séquences (progression 2026-2027) |

## Organisation d'une séquence

Chaque séquence a son répertoire `<niveau>/<NN-nom-de-la-sequence>/` :

```
3eme/04-fonctions-1-3-notions/
├── README.md              sommaire de la séquence (affiché par GitHub)
├── index.html             page de la séquence sur le site
├── cours-prof/            cours complet, carte mentale, diaporama…
├── cours-eleve/           cours à compléter, images à coller…
├── exercices/             fiches d'exercices et leurs corrigés
├── videos/                README.md avec les liens vers les vidéos
└── outils-interactifs/    exercices interactifs (.html) et liens en ligne
```

Chaque sous-répertoire contient un `README.md` qui liste ses fichiers et ses liens (« Bientôt disponible » quand il est encore vide).

## Le reste du site

| Fichier ou dossier | Contenu |
|---|---|
| `index.html` | page d'accueil |
| `6eme.html` … `3eme.html` | liste des séquences d'un niveau |
| `brevet.html`, `ressources/brevet/` | annales du brevet et automatismes |
| `podcasts.html`, `culture.html`, `enigmes.html`, `methode.html`, `concours.html` | rubriques pour tous les niveaux |
| `admin.html`, `visibilite.js` | ouvrir ou masquer les séquences au fil de l'année |
| `ressources/` | fichiers des rubriques hors séquences |
| `style.css` | design du site |

## Mise en ligne : Netlify

Le site reste hébergé sur **Netlify**. GitHub sert de rangement des fichiers.

- **Le plus simple** : relier ce dépôt à Netlify (Netlify → *Add new site* → *Import an existing project* → GitHub → ce dépôt ; *Build command* vide, *Publish directory* `/`). À chaque modification envoyée sur GitHub, Netlify remet le site à jour tout seul.
- **Sans relier** : continuer à déposer le dossier du site sur Netlify comme avant (glisser-déposer).

## Ajouter une fiche

Déposer le fichier dans le bon sous-répertoire de la séquence (par exemple `exercices/`), puis ajouter une ligne dans le `README.md` de ce sous-répertoire. Pour que le lien apparaisse aussi sur la page du site, l'ajouter dans `index.html` de la séquence (ou, plus simplement, déclarer la fiche dans `resources.py` du dossier source et régénérer le site).

---

© 2026 GiroMaths. Les vidéos et outils en ligne appartiennent à leurs auteurs (crédités sur chaque page).
