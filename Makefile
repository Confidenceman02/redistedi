DOCKER_COMPOSE= docker compose -f ./ops/development/docker-compose.yml
Y=yarn


.PHONY: start-test-env
start-test-env:
	${DOCKER_COMPOSE} up -d redis-test

.PHONY: ci-test
ci-test: start-test-env
	make test

.PHONY: test
test:
	${Y} mocha --exit -r @swc/register 'tests/**/*.spec.ts'
