test:
	@NODE_ENV=test ./node_modules/.bin/mocha -R spec -t 25s test/spec/unit/*.js
test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha -R spec -t 25s test/spec/unit/*.js
.PHONY: test test-unit test-server
