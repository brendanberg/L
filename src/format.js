

let Style = function(open, close) {
    this.prefix = '\u001b[';
    this.suffix = 'm';
    this.start = open;
    this.end = close;
};

Style.prototype.prefix = '\u001b[';
Style.prototype.suffix = 'm';

Style.prototype.wrap = function(str) {
    return this.open() + str + this.close();
};

Style.prototype.open = function() {
    return this.prefix + this.start + this.suffix;
};

Style.prototype.close = function() {
    return this.prefix + this.end + this.suffix;
};

let styles = {
	'bold' : new Style(1, 22),
	'italic' : new Style(3, 23),
	'underline' : new Style(4, 24),
	'inverse' : new Style(7, 27),
	'white' : new Style(37, 39),
	'grey' : new Style(90, 39),
	'black' : new Style(30, 39),
	'blue' : new Style(34, 39),
	'cyan' : new Style(36, 39),
	'green' : new Style(32, 39),
	'magenta' : new Style(35, 39),
	'red' : new Style(31, 39),
	'yellow' : new Style(33, 39),
};

let colors = {
    'number': 'yellow',
    'string': 'green',
    'boolean': 'yellow',
    'operator': 'magenta',
    'name': 'blue',
    'delimiter': 'cyan',
    'error': 'red',
    'comment': 'grey',
    'important': 'white',
};


let stylize = function(type) {
    let style = type && styles[colors[type]];

    return function(str) {
        return style ? style.wrap(str) : str;
    };
};


let style = {
    'number': stylize('number'),
    'string': stylize('string'),
    'boolean': stylize('boolean'),
    'operator': stylize('operator'),
    'name': stylize('name'),
    'delimiter': stylize('delimiter'),
    'error': stylize('error'),
    'comment': stylize('comment'),
    'important': stylize('important'),
};


module.exports = style;

