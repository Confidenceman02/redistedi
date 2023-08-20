# This is designed to be included in the root Makefile

.PHONY: test-schema
test-schema:
	${Y} mocha --exit --require @swc/register './packages/schema/tests/**/*.spec.ts'
