'use strict';
var sax = require("./lib/sax");
var select = require('css-select');
// var fs = require('fs');
// var getStruct = require('./pvstruc');
module.exports = function(string, options, callback) {
	var array = [];
	var stack = [];

	var passed_attr = null;
	var last = {
		pos: 0,
		end: 0
	};

	var attributes = [];
	var strict = typeof options.strict === 'boolean' ? options.strict : true;

	var parser = sax.parser(strict , {
		isSelfClosing: isSelfClosing,
		trim: false,
		// normalize: false,
		strictEntities: true
	});

	var getPos = function() {
		return parser.position;
	};

	var skip = [
		'Attribute without value',
		'Invalid character entity'
	];

	parser.onerror = function (err) {
		for (var i = 0; i < skip.length; i++) {
			if (err.message.indexOf(skip[i]) === 0) {
				parser.error = null;
				return;
				// console.log("NOT Error")
			}
		}



		callback(err);
		// console.log('sax error', e);
		// console.log(string.slice(parser.position - 10, parser.position + 10))
	  // an error happened.
	};
	parser.ondoctype = function(string) {
		array.push(last = {
			type: "directive",
			name: '!doctype',
			// type: 'doctype',
			data: '!DOCTYPE' + string,
			o: {
				type: 'doctype',
				data: string,
				start: last.end,
				end: getPos()
			}

		});

	};
	function textPart(type, pos) {
		return function(text) {
			var cur = stack[stack.length - 1];

			var item = {
				type: type,
				data: text,
				parent: cur || null,
				o: {
					type: type,
					start: last.end,
					end: {
						post: last.end + pos(text)
					}
				}
				// end: getPos()
			};

			if (cur) {
				cur.children.push(item);
			} else {
				array.push(item);
			}

			last = item;
		  // got some text.  t is the string of text.
		};
	}
	parser.oncomment = textPart('comment', function(t) {
		return t.length + 7;
	});
	parser.ontext = textPart('text', function(t) {
		return t.length;
	});

	parser.onopentag = function (node) {
		var cur = stack[stack.length - 1];

		var attrs = attributes.slice();
		attributes.length = 0;

		for (var i = 0; i < attrs.length; i++) {

			var text_before;
			var cur_attr = attrs[i];

			var attr = cur_attr.value;
			if (i === 0) {
				text_before = string.slice(node.openingEndPosition, attr.startPosition);
			} else {
				text_before = string.slice(attrs[i-1].value.endPosition, attr.startPosition);
			}
			cur_attr.text_before = text_before;
		}

		var last_attr = attrs[attrs.length - 1];

		var endStart = last_attr ? last_attr.value.endPosition : node.openingEndPosition;

		var index = {};

		for (var i = 0; i < attrs.length; i++) {
			index[attrs[i].value.name] = attrs[i].value.value;
		}

		var type = 'tag';

		if (node.name == 'style') {
			type = 'style';
		} else if (node.name =='script') {
			type = 'script';
		}

		var item = {
			parent: cur || null,
			next: null,
			prev: null,
			isSelfClosing: node.isSelfClosing || isSelfClosing(node.name),
			type: 'tag',
			name: node.name,
			children: [],
			attribs: index,
			o: {
				type: 'node',
				name: node.name,
				attrs: attrs,
				open: {
					start: parser.startTagPosition,
					end: getPos()
				},
				close: null,
				ending: string.slice(endStart, getPos()),
				value: node,
			}
			// pos: getPos()
		};


		if (cur) {
			var last = cur.children[cur.children.length -1];
			if (last) {
				cur.prev = last;
				last.next = cur;
			}

			cur.children.push(item);
		} else {
			array.push(item);
		}

		if (SINGLE_TAGS[node.name] && !node.isSelfClosing) {
			parser.tags.pop();
		} else {
			stack.push(item);
		}

		last = item;

	  // opened a tag.  node has "name" and "attributes"
	};
	parser.onclosetag = function(name) {
		// console.log("CLOSING", name);
		stack.pop();
	};

	parser.onattribute = function (attr) {

		var quoter;
		var beforeValue;
		if (attr.value !== null) {
			quoter = string.charAt(attr.startValuePosition);
			beforeValue = string.slice(attr.startPosition + attr.name.length + 1, attr.startValuePosition);
		}

		var data = {
			type: 'attr',
			text_before: null,
			value: attr,
			quoter: quoter,
			pos: getPos(),
			beforeValue: beforeValue
		};

		passed_attr = data;

		attributes.push(data);

		// cur.attrs.push(last = data);

	  // an attribute.  attr has "name" and "value"
	};
	parser.onend = function () {

	  callback(null, array);
	};

	parser.write(string);
	parser.close();

	return;
};

module.exports.select = select;

function out(item, changeNode) {
	switch (item.o.type) {
		case 'doctype': {
			return '<!DOCTYPE' + item.o.data + '>';
		}
		case 'text': {
			return item.data;
		}
		case 'comment': {
			return '<!--' + item.data + '-->';
		}
		case 'node': {
			if (changeNode) {
					changeNode(item);
			}

			var result = '';
			result += '<' + item.name;

			for (var i = 0; i < item.o.attrs.length; i++) {
				var cur = item.o.attrs[i];
				if (cur.removed) {
					continue;
				}

				result += cur.text_before;
				result += cur.value.name;

				if (cur.value.value !== null) {
					result += '=';
					result += cur.beforeValue || '';
					result += cur.quoter || '';
					result += cur.value.value;
					result += cur.quoter || '';
				}
			}

			if (item.isSelfClosing) {
				result += item.o.ending;
			} else {
				result += item.o.ending;

				result += iterate(item.children, changeNode);

				result += '</' + item.name + '>';
			}


			return result;
		}
	}
// 		doctype
// text
// node
// attr
}

function iterate(array, changeNode) {
	var result = '';
	for (var i = 0; i < array.length; i++) {
		result += out(array[i], changeNode);
	}
	return result;

}

module.exports.stringify = iterate;

var SINGLE_TAGS = {};

['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen',
  'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'].forEach(function(name) {
  	SINGLE_TAGS[name] = true;
  });

function isSelfClosing(name) {
	return SINGLE_TAGS[name];
}

function handleIndexHTML (err, file) {
	if (err) {return console.error(err);}
	// parser.write('<xml>Hello, <who     	 name="world">world</who>!</xml>').close();
	var string = '<xml zi="55">Hello, <who     	 name="world"            	   track="22">world</who>!</xml>';
								//<xml             name"world"                       track"22">Hello, <who>world!</who></xml>
	var string = file.toString();




	var doc;
	try {
		doc = parser.write(string);
		parser.close();
	} catch (e) {
		console.log(e);
		console.log(e.stack)
		console.log(string.slice(parser.position - 20, parser.position + 20))
	}

	function output(array) {
		var result = iterate(array, function(node) {
			return;

			var index = {};
			node.attrs.forEach(function(attr) {
				index[attr.value.name] = attr;
			});
			// console.log(attr);
			if (index['pv-class']) {
				var attr = index['pv-class'];
				if (attr.value.name !== 'pv-class') {return;}

				if (!attr.value.value) {return;}

				var struct = getStruct(attr.value.value);

				if (struct.value) {
					attr.value.value = struct.value;
				} else {
					attr.removed = true;
				}

				if (struct.array.length) {
					if (!index['class']) {
						node.attrs.push({
							text_before: ' ',
							quoter: '\"',
							value: {
								name: 'class',
								value: struct.array.join(' ')
							}
						});
					} else {
						var attr = index['class'];
						var classes = (attr.value.value || '').split(/\s+/gi);
						struct.array.forEach(function(class_name) {
							if (classes.indexOf(class_name) !== -1) {return;}
							attr.value.value += ' ' + class_name;
						});
					}
					// var attr =
					// forEach()
				}
			}


			// node.attr('pv-class', struct.value);
		});

		fs.writeFile('./dev-dist/hello.xml', result);

	}

	module.exports(string, {}, output);
}
