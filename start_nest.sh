#!/bin/bash

npx prisma studio &

nest start $@
