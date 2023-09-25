DOCKER_COMPOSE= docker compose -f ./ops/development/docker-compose.yml
Y=yarn

include packages/schema/schema.mk
include packages/model/model.mk
include packages/zod/zod.mk

.PHONY: start-test-env
start-test-env:
	${DOCKER_COMPOSE} up -d redis-test

.PHONY: ci-test
ci-test: start-test-env test-schema test-model test-zod
	make test

.PHONY: test
test:
	${Y} mocha --exit -r @swc/register 'tests/**/*.spec.ts'
