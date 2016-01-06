function dispatch(table) {
	return (function() {
		var args = Array.prototype.slice.call(arguments);
		console.log('args');
		console.log(args);
		var other_type = args.map(function(x) { return x._name; }).join(',');
		return table[other_type].apply(this, args);
	});
}

module.exports = dispatch;
