#!/bin/bash

nest build

pnpm exec prisma studio &

nest start $@
