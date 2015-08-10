function dispatch(table) {
	return (function() {
		var args = Array.prototype.slice.call(arguments);
		var other_type = args.map(function(x) { return x.type; }).join(',');
		return table[other_type].apply(this, args);
	});
}

module.exports = dispatch;
