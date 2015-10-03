'use strict';
var sax = require("./lib/sax");
var fs = require('fs');
var getStruct = require('./pvstruc');


var SINGLE_TAGS = {};

['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen',
  'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'].forEach(function(name) {
  	SINGLE_TAGS[name] = true;
  });

fs.readFile('./index.html', function (err, file) {
	if (err) {return console.error(err);}

	var array = [];
	var stack = [];

	var passed_attr = null;
	var last = {
		pos: 0,
		end: 0
	};

	// parser.write('<xml>Hello, <who     	 name="world">world</who>!</xml>').close();
	var string = '<xml zi="55">Hello, <who     	 name="world"            	   track="22">world</who>!</xml>';
								//<xml             name"world"                       track"22">Hello, <who>world!</who></xml>
	var string = file.toString();

	var attributes = [];

	var parser = sax.parser(true , {
		trim: false,
		// normalize: false,
		strictEntities: true
	});

	var getPos = function() {
		return parser.position;
	};

	parser.onerror = function (e) {

		if (e.message.indexOf('Invalid character entity') === 0) {
			parser.error = null;

			// console.log("NOT Error")
		}
		
		
		// console.log('sax error', e);
		// console.log(string.slice(parser.position - 10, parser.position + 10))
	  // an error happened.
	};
	parser.ondoctype = function(string) {
		array.push(last = {
			type: 'doctype',
			'string': string,
			start: last.end,
			end: getPos()
		});

	};
	function textPart(type, pos) {
		return function(text) {
			var item = {
				type: type,
				'string': text,
				start: last.end,
				end: {
					post: last.end + pos(text)
				}
				// end: getPos()
			};

			var cur = stack[stack.length - 1];
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

		var item = {
			ending: string.slice(endStart, getPos()),
			isSelfClosing: node.isSelfClosing || SINGLE_TAGS[node.name],
			type: 'node',
			value: node,
			children: [],
			attrs: attrs,
			open: {
				start: parser.startTagPosition,
				end: getPos()
			},
			close: null
			// pos: getPos()
		};


		if (cur) {
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
	
	  output();
	};

	var doc;
	try {
		doc = parser.write(string);
		parser.close();
	} catch (e) {
		console.log(e);
		console.log(e.stack)
		console.log(string.slice(parser.position - 20, parser.position + 20))
	}
	



	function out(item, changeNode) {
		switch (item.type) {
			case 'doctype': {
				return '<!DOCTYPE' + item.string + '>';
			}
			case 'text': {
				return item.string;
			}
			case 'comment': {
				return '<!--' + item.string + '-->';
			}
			case 'node': {
				if (changeNode) {
						changeNode(item);
				}

				var result = '';
				result += '<' + item.value.name;
				
				for (var i = 0; i < item.attrs.length; i++) {
					var cur = item.attrs[i];
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
					result += item.ending;
				} else {					
					result += item.ending;

					result += iterate(item.children, changeNode);

					result += '</' + item.value.name + '>';
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

	function output() {
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

});