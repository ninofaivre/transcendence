#!/bin/bash

source ".env"
export PGHOST PGUSER PGPORT PGPASSWORD PGDATABASE

psql --file="prisma-dummy/customSql/CUSTOM.sql"
