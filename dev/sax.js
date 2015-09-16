'use strict';
var sax = require("sax");
var fs = require('fs');



fs.readFile('./index.html', function (err, file) {
	if (err) {return console.error(err);}

	var array = [];
	var stack = [];

	var passed_attr = null;
	var last = {
		pos: 0,
		end: 0
	};

	var opening = false;

	// parser.write('<xml>Hello, <who     	 name="world">world</who>!</xml>').close();
	var string = '<xml>Hello, <who     	 name="world"            	   track="22">world</who>!</xml>';

	var attributes = [];

	var parser = sax.parser({
		strict: false,
		trim: false,
		normalize: false
	});

	var getPos = function() {
		return parser.position;
	};

	parser.onerror = function (e) {
		console.log('sax error', e);
	  // an error happened.
	};
	parser.ondoctype = function(string) {
		array.push(last = {
			'type': 'doctype',
			'string': string,
			start: last.end,
			end: getPos()
		});

	};
	parser.ontext = function (t) {
		// console.log(last);
		var item = {
			'type': 'text',
			'string': t,
			start: last.end,
			end: {
				post: last.end + t.length
			}
			// end: getPos()
		};


		// console.log('TEXT', t, getPos());
		// console.log(last.pos);

		var cur = stack[stack.length - 1];
		cur.children.push(item);
		last = item;
	  // got some text.  t is the string of text.
	};
	parser.onopentag = function (node) {
		opening = false;
		var cur = stack[stack.length - 1];
		// console.log(parser);
		// if (!last.end) {
		// 	throw new Error('should be end');
		// }

		var item = {
			type: 'node',
			value: node,
			children: [],
			attrs: [],
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

		stack.push(item);
		last = item;

		// console.log(item.value.name, parser.line, parser.column, parser.position)
	  // opened a tag.  node has "name" and "attributes"
	};
	parser.closetag = function(name) {
		stack.pop();
	};

	parser.onattribute = function (attr) {

		var cur = stack[stack.length - 1];

		// console.log('prev', last);
		// console.log('attr', parser.line, parser.column, parser.position);
		console.log(attr);
		console.log(attr.name, attr.value, attr.startPosition, attr.endPosition);
		console.log(string.slice(attr.startPosition, attr.endPosition));


		var text_before;



		if (opening) {
			text_before = string.slice(passed_attr.value.endPosition, attr.startPosition);
			// ?onsole.log();
			// console.log('X', text_before, 'X');
			// console.log(passed_attr.openingEndPosition, attr.startPosition, attr.endPosition)
			// 
		} else {
			opening = true;
			text_before = string.slice(parser.tag.openingEndPosition, attr.startPosition);
			// console.log(parser.tag);
			// console.log(parser.tag.openingEndPosition, attr.startPosition, attr.endPosition)

			// console.log('X', text_before, 'X');
		}
		

		var data = {
			type: 'attr',
			value: attr,
			pos: getPos()
		};

		passed_attr = data;

		cur.attrs.push(last = data);
		
	  // an attribute.  attr has "name" and "value"
	};
	parser.onend = function () {
		// console.log(array[0].attrs);
	  // parser stream is done, and ready to have more stuff written to it.

	  output();
	};


	var doc = parser.write(string).close();

	function output() {
		var result = '';

		iterate(array);
	}

	function iterate(array) {
		
	}

	// fs.writeFile('./dev-dist/index.html', serializer.serialize(doc));
	// console.log($.html());
});