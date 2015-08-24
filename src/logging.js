function write(x) {
	if (typeof x === 'function') {
		console.log(x());
	} else {
		console.log(x);
	}
}

var Logging = function(level) {
	this.levels = ['info', 'warn', 'error'];
	this._level = 'error';
	this.setLevel(level);
};

Logging.prototype.isEnabled = function(level) {
	return (this.levels.indexOf(level) >= this.levels.indexOf(this._level));
};

Logging.prototype.setLevel = function(level) {
	if (this.levels.indexOf(level) !== -1) {
		this._level = level;
	}
};

Logging.prototype.info = function(msg) {
	if (this.isEnabled('info')) {
		write(msg);
	}
};

Logging.prototype.warn = function(msg) {
	if (this.isEnabled('warn')) {
		write(msg);
	}
};

Logging.prototype.warn = function(msg) {
	if (this.isEnabled('error')) {
		write(msg);
	}
};

module.exports = Logging;
