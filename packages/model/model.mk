
# This is designed to be included in the root Makefile

.PHONY: test-model
test-model:
	${Y} mocha --exit --require @swc/register './packages/model/tests/**/*.spec.ts'
