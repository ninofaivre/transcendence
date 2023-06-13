#!/bin/bash

pnpm exec prisma studio --browser none &
if [ "$1" != "--watch" ]; then
    cd ../prisma  || exit 1 && pnpm build
    cd enums || exit 1 && pnpm build
    cd ../../contract || exit 1 && pnpm build
    cd ../backend || exit 1 && nest build && nest start
else
    cd ../prisma || exit 1 && pnpm build
    cd enums || exit 1 && pnpm build --watch &
    cd ../../contract || exit 1 && pnpm build --watch &
    cd ../backend || exit 1 && nest start --watch
fi
