pattern = /\/\/ BEGIN\(BROWSER\)/,/\/\/ END\(BROWSER\)/
begin = /\/\/ BEGIN(BROWSER)/d
end = /\/\/ END(BROWSER)/d
modulePath = ./node_modules/.bin

build: src/base.js src/ast.js src/parser.js
	@echo 'Concatenating scripts...'
	@awk '$(pattern)' src/base.js > /tmp/strudel.js
	@awk '$(pattern)' src/ast.js >> /tmp/strudel.js
	@awk '$(pattern)' src/parser.js >> /tmp/strudel.js
	@sed '$(begin)' /tmp/strudel.js | sed '$(end)' > strudel.js
	@echo 'Minifying script...'
	@$(modulePath)/uglifyjs strudel.js > strudel.min.js
	@echo 'Build succeeded'

src/parser.js: src/l.pegjs
	@echo 'Generating parser...'
	@$(modulePath)/pegjs -e 'L.Parser' src/l.pegjs src/parser.js
	@echo "var L = {};\nL.AST = require('./ast');\n\n// BEGIN(BROWSER)" > /tmp/parser.js
	@unexpand -t 2 src/parser.js >> /tmp/parser.js
	@echo '\n// END(BROWSER)\n\nmodule.exports = L;\n' >> /tmp/parser.js
	@mv /tmp/parser.js src/parser.js
	@echo 'Parser generation succeeded'

parser: src/parser.js
	@:

test: src/parser.js test/tests.js
	@$(modulePath)/mocha -u bdd -R list -C test/*.js

clean:
	@rm -f strudel.js strudel.min.js src/parser.js

.PHONY: parser test clean
