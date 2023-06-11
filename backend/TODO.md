# Backend :

-   [x] Finir la transition en mode strict
-   [x] Finir le refacto du module chan
-   [x] Finir la transition à zod
-   [x] Passer en transaction ce qui doit l'être avec prisma
-   [ ] Testing against regression
-   [x] Connexion multiple d'un même utilisateur au sse
-   [ ] status avec le sse (quand un user se log il doit savoir qui de sa liste d'amis est logged-in)
-   [ ] sse notif quand un user se login ou se logout à sa liste d'amis
-   [ ] refactor user pour avoir /me (mes infos) et /:username profil public d'un utilisateur
-   [ ] login redirect sur /me (peut-être pas possible de redirect une requête POST sur une requête GET)
-   [x] route pour GET un dmElement par Id pour les relatedTo
-   [x] route pour update un message
-   [ ] dans les contrats, mettre les params redondant sous forme de var (example : content de msg: z.string().nonempty().max(150))
-   [ ] pour ce qui est des bans n'exposer la liste des bans dans les chans qu'aux users ayant la perm de ban (format chan)
-   [ ] faire les bans / kick avec une raison
-   [x] régler la confusion entre message et element aussi bien dans le code du backend que dans les routes exposée dans l'api
-   [x] remove toute les dépendances pnpm qui ne sont plus nécéssaires