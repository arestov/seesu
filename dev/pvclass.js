'use strict';

var fs = require('fs');


var cheerio = require('cheerio');


// var DOMParser = require('xmldom').DOMParser;
// var XMLSerializer =  require('xmldom').XMLSerializer;
console.log('here');

fs.readFile('./index.html', function (err, file) {
	if (err) {return console.error(err);}


	var $ = cheerio.load(file.toString(), { decodeEntities: false });


	
	// var doc = new DOMParser().parseFromString(file.toString(), 'image/svg+xml');

	$('*').each(function() {
		var node = $(this);
		// console.log(node);
		var pv_class =  node.attr('pv-class');
		if (!pv_class) { return; }

		var struct = getStruct(pv_class);

		node.attr('pv-class', struct.value);

	});


	fs.writeFile('./dev-dist/index.html', $.html());
	// console.log($.html());
});

(function() {
	[].forEach.call(document.querySelectorAll('*'), function(el) {
		var pv_class = el.getAttribute('pv-class');
		if (!pv_class) {return;}

		var struct = getStruct(pv_class);

		el.setAttribute('pv-class', struct.value);
	});
})();
	



function getStruct(value) {
	var simple_classes = [];
	var result = value.replace(/\{\{.+?\}\}|\S+/gi, function(part) {
		var calculable = part.charAt(0) == '{';
		if (!calculable) {
			simple_classes.push(part);
			return '';
		} else {
			return replace(part) || '';
		}

	});
	return {
		array: simple_classes,
		value: result
	};
}

function replace(string) {
	var value = string.replace(/^\{\{|\}\}$/gi,'');
	// console.log('VALUE', value);

	var struct = value.match(/(.+?)\s?\&\&\s?\'(.+?)\'$/);
	if (!struct || !struct.length) {
		console.warn('WRONG', value);
		return;
	}

	// console.log()

	var cond = struct[1];
	var result = struct[2];

	return result + ': ' + (cond.match(/\s/) ? ['{{', cond, '}}'].join(' ') : cond);

}


// $('h2.title').text('Hello there!');
// $('h2').addClass('welcome');

// $.html();