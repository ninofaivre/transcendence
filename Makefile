################################# Variables ###################################
MAKEFLAGS += --no-builtin-rules
MAKEFLAGS += --no-builtin-variables

SHELL						= bash

PROJECT_NAME 				= transcendence

DOCKER_COMPOSE_FILE			= ./compose.yaml

USER						= cassepipe

HOME						= /home/${USER}

#SUDO						= sudo -E

DOCKER_COMPOSE_COMMAND		= ${SUDO} docker compose \
							  -f ${DOCKER_COMPOSE_FILE} \
							  -p ${PROJECT_NAME}

################################### Rules #####################################

# Start the services
up:	
	${DOCKER_COMPOSE_COMMAND} up --build --detach
	$(MAKE) ps

# ** Basic docker compose commands **

ps:
	${DOCKER_COMPOSE_COMMAND} ps
	docker ps

# Removes stopped service containers (Can be running...)
rm:
	${DOCKER_COMPOSE_COMMAND} rm

down:
	${DOCKER_COMPOSE_COMMAND} down

images:
	${DOCKER_COMPOSE_COMMAND} images

pause:
	${DOCKER_COMPOSE_COMMAND} pause

unpause:
	${DOCKER_COMPOSE_COMMAND} unpause

start:
	${DOCKER_COMPOSE_COMMAND} start

stop:
	${DOCKER_COMPOSE_COMMAND} stop

restart:
	${DOCKER_COMPOSE_COMMAND} restart

logs:
	${DOCKER_COMPOSE_COMMAND} logs -f

# Cleanup 

clean: stop remove_exited_containers
	docker system prune -a --force

stop_all:
	-docker stop `docker ps -q`

remove_exited_containers:
	-docker rm `docker ps -a -q -f status=exited`

remove_all_containers:	stop_all
	-docker rm `docker ps -a -q`

# ** DEBUGGING **

# Run bash in a already running container

exec_postgres:
	${DOCKER_COMPOSE_COMMAND} exec postgres /bin/bash

exec_backend:
	${DOCKER_COMPOSE_COMMAND} exec backend /bin/bash

exec_frontend:
	${DOCKER_COMPOSE_COMMAND} exec frontend /bin/bash

# Run bash instead of entrypoint

debug_postgres:
	${DOCKER_COMPOSE_COMMAND} build
	${DOCKER_COMPOSE_COMMAND} run --rm -it --entrypoint ""  postgres /bin/bash

debug_backend:
	${DOCKER_COMPOSE_COMMAND} build
	${DOCKER_COMPOSE_COMMAND} run --rm -it --entrypoint "" backend /bin/zsh
	
debug_frontend:
	${DOCKER_COMPOSE_COMMAND} build
	${DOCKER_COMPOSE_COMMAND} run --rm -it --entrypoint "" backend /bin/bash

# Run services individually

run_postgres:
	${DOCKER_COMPOSE_COMMAND} build
	${DOCKER_COMPOSE_COMMAND} run --rm -d postgres

run_backend:
	${DOCKER_COMPOSE_COMMAND} build
	${DOCKER_COMPOSE_COMMAND} run --rm -d backend

run_frontend:
	${DOCKER_COMPOSE_COMMAND} build
	${DOCKER_COMPOSE_COMMAND} run --rm -d frontend

log_postgres:
	${DOCKER_COMPOSE_COMMAND} logs --follow postgres
	
log_backend:
	${DOCKER_COMPOSE_COMMAND} logs --follow backend

log_frontend:
	${DOCKER_COMPOSE_COMMAND} logs --follow frontend


top_postgres:
	${DOCKER_COMPOSE_COMMAND} top postgres

top_backend:
	${DOCKER_COMPOSE_COMMAND} top backend 

top_frontend:
	${DOCKER_COMPOSE_COMMAND} top frontend

list_containers:
	docker container ls

list_volumes:
	docker volume ls

list_network:
	docker network ls
