DOCKER_COMPOSE= docker compose -f ./ops/development/docker-compose.yml
Y=yarn


.PHONY: start-test-environment
start-test-environment:
	${DOCKER_COMPOSE} up -d redis-test

.PHONY: test
test:
	${Y} mocha --exit -r @swc/register 'tests/**/*.spec.ts'
