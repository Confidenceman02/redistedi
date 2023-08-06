DOCKER_COMPOSE= docker compose -f ./ops/development/docker-compose.yml

.PHONY: start-test-environment
start-test-environment:
	${DOCKER_COMPOSE} up -d redis-test
