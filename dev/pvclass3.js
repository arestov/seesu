'use strict';
var Parser = require('parse5').Parser;
// console.log(require('parse5'));
var Serializer = require('parse5').Serializer;

var serializer = new Serializer();
console.log(serializer);
//Instantiate parser
var parser = new Parser();
var fs = require('fs');


// var cheerio = require('cheerio');


// var DOMParser = require('xmldom').DOMParser;
// var XMLSerializer =  require('xmldom').XMLSerializer;
// console.log('here');

fs.readFile('./index.html', function (err, file) {
	if (err) {return console.error(err);}

	var doc = parser.parse(file.toString());



	fs.writeFile('./dev-dist/index.html', serializer.serialize(doc));
	// console.log($.html());
});



// $('h2.title').text('Hello there!');
// $('h2').addClass('welcome');

// $.html();