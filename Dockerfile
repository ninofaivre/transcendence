FROM node:20 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client && apt clean
RUN mkdir /app/backend/pictures
RUN rm /app/pnpm-lock.yaml
RUN pnpm run build

EXPOSE 3000

CMD [ "pnpm", "start:prod" ]
