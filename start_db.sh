docker run -d -e POSTGRES_HOST_AUTH_METHOD=trust -p8080:5432 postgres && npx prisma migrate dev
