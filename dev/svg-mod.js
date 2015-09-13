'use strict';
var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
var XMLSerializer =  require('xmldom').XMLSerializer;
var postcss = require('postcss');

module.exports = postcss.plugin('svg-mod', function (opts) {
		opts = opts || {};

		// Work with options here

		return function (css, result) {
			var items = [];

			css.walkDecls(function(decl) {
				if (decl.prop !== 'background-image') {return;}
				if (decl.value.indexOf('svg-hack') === -1) {return;}

				// console.log(decl.value);

				var structure = getStructure(decl.value);
				// console.log(structure);

				items.push(fetchSVG(structure.file, structure, decl));

			});

			if (!items.length) {return;}

			return Promise.all(items);
			// Transform CSS AST here

		};
});

function btoa(string) {
	return new Buffer(string).toString('base64')
}

function fetchSVG(file_url, structure, decl) {
	return new Promise(function(resolve, reject) {
		fs.readFile(file_url, function (err, svg) {
		  if (err) {return reject(err);}

		  var doc = new DOMParser().parseFromString(svg.toString(), 'image/svg+xml');

			if (structure.viewBox) {
				doc.documentElement.setAttribute('viewBox', structure.viewBox);
			}


			if (structure.state) {
				doc.getElementById('states-switcher').setAttribute('class', structure.state);
			}

			if (structure.part) {
				doc.getElementById('parts-switcher').setAttribute('xlink:href', '#' + structure.part);
			}

			decl.value = 'url(\'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(doc)) + '\')';

		  resolve();
		});
	});
}

function getStructure(string) {
	var bgIString = string
		.replace(/^url\(\s*[\"\']?/, '')
		.replace('data:text/plain;utf8,svg-hack,', '')
		.replace(/[\"\']?\s*\)$/, '');

	/*
		.replace('url(\'', '')
		.replace('}\'\)','}')
		.replace('url(data:text/plain;utf8,svg-hack,', '')
		.replace('}\)','}')
		.replace('url(\"data:text/plain;utf8,svg-hack,', '')
		.replace('}\"\)','}');
*/
	var structure;
	var errors = [];
	try {
		structure = JSON.parse(bgIString);
	} catch (e){
		errors.push(e);
	}
	if (!structure){
		try {
			structure = JSON.parse(decodeURI(bgIString));
		} catch (e){
			errors.push(e);
		}
	}
	if (!structure){
		try {
			structure = JSON.parse(bgIString.replace(/\\([\s\S])/gi, '$1'));
		} catch (e) {
			errors.push(e);
		}
	}
	if (!structure){
		console.log(errors);
		return;
	}
	return structure;
}
