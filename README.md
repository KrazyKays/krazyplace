# Krazy Dart App (KDA)

Application web statique, légère et en français pour compter les points aux fléchettes. Elle fonctionne sans compte, serveur applicatif, dépendance JavaScript ni base de données : les parties restent dans la mémoire de l'onglet et ne sont pas envoyées ailleurs. Son identité visuelle met en avant le trigramme **KDA** et le bleu cyan.

## Modes

- **301 et 501** avec options double in et double out.
- **Cricket** avec les cibles 15 à 20 et le bull.
- De 2 à 8 joueurs, saisie des fléchettes, volées et historique récent.
- Annulation du dernier lancer (fonction disponible pendant une partie, pas un mode de jeu).
- À la fin d'une partie, génération locale d'une image PNG du résultat, partageable via le navigateur ou téléchargeable.

## Lancer en local

Ouvrez `index.html` dans un navigateur. Aucun build ou installation n'est nécessaire.

## Déployer sur GitHub Pages

Le workflow `.github/workflows/pages.yml` publie automatiquement le site sur GitHub Pages lorsqu'un commit est poussé sur `main` ou `master`.

Dans le dépôt GitHub, choisissez **Settings → Pages → Build and deployment → Source → GitHub Actions**. Une fois le workflow terminé, GitHub affiche l'adresse du site dans cette même page.
