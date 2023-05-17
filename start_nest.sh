#!/bin/bash

# dirty but tmp
if [ "$1" != "--watch" ]; then
	nest build
fi

pnpm exec prisma studio &

nest start "$@"
