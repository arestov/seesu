'use strict';
var fs = require('fs');
var cheerio = require('cheerio');
var postcss = require('postcss');


var css_parser = (function() {
	var CssSelectorParser = require('css-selector-parser').CssSelectorParser;
	var css_parser = new CssSelectorParser();
	css_parser.registerSelectorPseudos('has');
	css_parser.registerNestingOperators('>', '+', '~');
	css_parser.registerAttrEqualityMods('^', '$', '*', '~');
	css_parser.enableSubstitutes();
	return css_parser;
})();

fs.readFile('./dev/css-source.html', function (err, file) {
	if (err) { console.log(err); }
	var $ = cheerio.load(file.toString());

	var to_remove = [];
	$('style[scoped]').each(function(i, node) {

		// console.log($(node).text());
		var css_root = postcss.parse($(node).text());

		css_root.walk(function(rule) {
			// console.log(rule);
			if (!rule.selector) {return;}

			var selector = css_parser.parse(rule.selector);

			var selectors = selector.selectors || [selector];

			

			selectors.forEach(function(selector) {
				var list = [];
				var cur = selector;
				while (cur.rule) {
					list.push(cur.rule);
					cur = cur.rule;
				}
				// var tree_steps;
				var last = list.pop();
				// var rest = list;

				var prefix = random(6);
				if (!last.classNames) {
					console.warn('you should use `class` to style');
					return;
				}

				var first = $(node).parent().find('.' + last.classNames.join('.'));

				// var results =  [];
				// console.log(first);

				first.each(function(i, node) {
					
					$(node).addClass( prefix + '-' + last.classNames.join('-'));
					// results.push({
					// 	// selector: last,
					// 	rest: rest,
					// 	item: node,
					// 	next: null
					// });
					to_remove.push({
						node: node,
						name: last.classNames
					});
				});

				// var root = {
				// 	selector: last,
				// 	next: results
				// };

				// function parents(cur) {
				// 	if (!cur.rest.length) {return;}
				// 	var rest = cur.rest.slice();
				// 	var last = rest.pop();
				// 	// if ()
				// 	cur.parents = (cur.item).parents('.' + last.classNames[0]);
				// }

				// parents(root);

				// // for (var i = list.length - 1; i >= 0; i--) {
				// // 	list[i]
				// // }
				// console.log('GOT', first);
			});


			


		});
		// node.
	});
	

	to_remove.forEach(function(data) {
		console.log(data.name);
		data['name'].forEach(function(name) {
			$(data.node).removeClass(name);
		});
		
	});

	console.log($.html());

	// fs.writeFile('./dev-dist/cssm.html', $.html());
});

function random(num) {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var text = "";
    for( var i=0; i < num; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}