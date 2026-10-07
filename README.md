# Krazy Dart App (KDA)

Application web statique, légère et en français pour compter les points aux fléchettes. Elle fonctionne sans compte, serveur applicatif, dépendance JavaScript ni base de données : les parties restent dans la mémoire de l'onglet et ne sont pas envoyées ailleurs. Son identité visuelle met en avant le trigramme **KDA** et le bleu cyan.

## Modes et saisie des lancers

- **301** avec options double in et double out.
- **101** pour les parties rapides, avec les mêmes options.
- De 2 à 8 joueurs, saisie des fléchettes, volées et historique récent.
- Annulation du dernier lancer (fonction disponible pendant une partie, pas un mode de jeu).
- Résumé des règles qui s'adapte au mode et aux options sélectionnés.
- Saisissez directement le score de chaque fléchette (0 à 60). Cochez « Ce lancer est un double » pour les règles double in/out ; le score double doit être pair entre 2 et 40, ou 50 pour le bull intérieur.
- À la fin d'une partie, génération locale d'une image PNG des scores et statistiques (ratés, dépassements, moyenne des touches, meilleures volées, volées de 100+ et doubles), partageable via le navigateur ou téléchargeable.

La moyenne est le score moyen des fléchettes non nulles. Les dépassements comptent les lancers qui font passer sous zéro ; les busts incluent également les fins à zéro sans double lorsque double out est activé.

## Lancer en local

Ouvrez `index.html` dans un navigateur. Aucun build ou installation n'est nécessaire.

## Déployer sur GitHub Pages

Le workflow `.github/workflows/pages.yml` publie automatiquement le site sur GitHub Pages lorsqu'un commit est poussé sur `main` ou `master`.

Dans le dépôt GitHub, choisissez **Settings → Pages → Build and deployment → Source → GitHub Actions**. Une fois le workflow terminé, GitHub affiche l'adresse du site dans cette même page.
