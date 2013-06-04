


var Runtime = function () {
	this.context = {};
}

Runtime.prototype.eval = function (ast) {
	ast.eval(this, this.context);
}

module.exports = Runtime;

