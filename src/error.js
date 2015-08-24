function toString() {
	return this.constructor.name + ': ' + this.message;
}

function NameError(msg) {
	this.message = msg;
}

NameError.prototype.toString = toString;

function MatchError(msg) {
	this.message = msg;
}

MatchError.prototype.toString = toString;

function TypeError(msg) {
	this.message = msg;
}

TypeError.prototype.toString = toString;

var error = {
	NameError: NameError,
	MatchError: MatchError,
	TypeError: TypeError
};

module.exports = error;
