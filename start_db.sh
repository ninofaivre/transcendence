docker run -d -v transcendance:/var/lib/postgresql/data -e POSTGRES_HOST_AUTH_METHOD=trust -p8080:5432 postgres
