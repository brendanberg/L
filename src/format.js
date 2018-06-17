

const color = (open, close) => {
	return (str) => {
		return `\u001b[${open}m${str}\u001b[${close}m`;
	};
};

let styles = {
	'bold' : color(1, 22),
	'italic' : color(3, 23),
	'underline' : color(4, 24),
	'inverse' : color(7, 27),
	'white' : color(37, 39),
	'grey' : color(90, 39),
	'black' : color(30, 39),
	'blue' : color(34, 39),
	'cyan' : color(36, 39),
	'green' : color(32, 39),
	'magenta' : color(35, 39),
	'red' : color(31, 39),
	'yellow' : color(33, 39),
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


let stylize = (type) => {
    let style = type && styles[colors[type]] || function(str) { return str; };

    return (str) => {
        return style(str);
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

