const { TypeError } = require('./error');

function dispatch(table) {
	return (function() {
		let args = Array.prototype.slice.call(arguments);
		let other_type = args.map(function(x) { return x._name; }).join(',');
		
		if (other_type in table && table[other_type].apply) {
			return table[other_type].apply(this, args);
		} else {
			throw new TypeError('Could not find an implementation of the correct type');
		}
	});
}

module.exports = dispatch;
