#!/usr/bin/env sh
BLUE=$(tput setaf 4)
NC=$(tput sgr0)

cd ..

printf "%40s\n" "${BLUE}deleting old custom migration...${NC}"
rm -rf ./prisma/migrations/*custom*

printf "\n%40s\n\n" "${BLUE}generating custom migration...${NC}"
sleep 3 && echo "y" | pnpm prisma migrate dev --create-only --name "custom"

printf "\n%40s\n" "${BLUE}inserting CUSTOM.sql in custom migration...${NC}"
cp ./custom_migrations/CUSTOM.sql ./prisma/migrations/*custom*/migration.sql
