# This is designed to be included in the root Makefile

.PHONY: test-zod
test-zod:
	${Y} mocha --exit --require @swc/register './packages/zod/tests/**/*.spec.ts'
