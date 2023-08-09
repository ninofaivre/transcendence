#!/bin/bash

script_location=$(dirname "$0")

source "$script_location/../../.env"

export PGHOST PGUSER PGPORT PGPASSWORD PGDATABASE

psql --file="$script_location/CUSTOM.sql"
