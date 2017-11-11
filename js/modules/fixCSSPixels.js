define(function(require) {
'use strict';
var app_serv = require('app_serv');
var $ = require('jquery');
var spv = require('spv');

	var createStyleSheet = function(href, sheet_string, root_font_size, string) {
		var sheet = window.CSSOM.parse(sheet_string);
		href = href || sheet.href;
		if (href.indexOf('sizes.css') != -1){
			return '';
		}
		var pos_shift = 0;

		var big_result = sheet_string;


	//	var big_string = '/* path: ' + href.replace(location.origin, '') + '*/\n';
		var simple_rules = app_serv.getSimpleCSSRules(sheet);


		/*
		simple_rules.sort(function(a, b){
			return spv.sortByRules(a, b, [''])
		});*/

		var complects = [];
		for (var i = 0; i < simple_rules.length; i++) {
			var cur = simple_rules[i];
			//cur.selectorText
			if (cur.style && cur.style.cssText.indexOf('px') != -1){
				var rulll = app_serv.culculateRemRule(cur, root_font_size);

				var sel_prev_text = sheet_string.slice(0, rulll.rule_start);

				var sel_tabs = sel_prev_text.match(/\t+(?:$)/gi);
				var sel_tabs_count = sel_tabs && sel_tabs[0].length || 0;
				//sel_tabs_count += 1;

			//	console.log(sel_tabs_count);
				complects.push(rulll);
				if (rulll.px_props.length){
					rulll.full_string = '\n' +
						app_serv.getTabs(sel_tabs_count) + rulll.stretch_selector + '{\n' +
						app_serv.getTabs(sel_tabs_count + 1) + '/* rem hack */\n' +
						app_serv.getRulesString(rulll.px_props, sel_tabs_count + 1) +
						app_serv.getTabs(sel_tabs_count + 1) + '}\n';


					var rules_string = '\n' +
						app_serv.getTabs(sel_tabs_count + 1) + '/* rem hack */\n' +
						app_serv.getRulesString(rulll.px_props, sel_tabs_count + 1);

					var big_start = big_result.slice(0, rulll.rule_end -1 + pos_shift);
					var big_end = big_result.slice(rulll.rule_end -1 + pos_shift);

					big_result = big_start + rules_string + big_end;
					pos_shift += rules_string.length;

				//	big_string += rulll.full_string;

					//getRulesString
				//	big_string += rulll.stretch_selector + ' {\n' + '\t/* rem hack */\n' + rulll.string + '}\n\n';
				}

			}

		}

		return string ? big_result : complects;
	};
	var checkPX = function(url, root_font_size) {
		//var complects = [];





		var big_string = '';


		//var requests = [];

		$.ajax({
			url: url
		})
		.done(function(r) {
			var test = createStyleSheet(url, r, root_font_size, true);
			//console.log("url: " + url);
			//console.log(test);

			var file_name = url.split('/');
			file_name = file_name && file_name[file_name.length -1];
			window.open('data:text/plain;base64,' + btoa( '/*\n' + file_name + "\n*/ \n" + test));
		});

		return big_string;

	};







/*

jsLoadComplete(function() {
	yepnope({
		load: [ 'CSSOM/spec/utils.js', 'CSSOM/src/loader.js'],
		complete: function() {
			console.log('ddddd');
		}
	});
});



//checkPX('/css/search_results.css');



*/
return function(doc, link) {
	var root_font_size = $(doc.documentElement).css('font-size');
	root_font_size = parseFloat(root_font_size.replace('px'));

	var css = link ? [link] : spv.filter(document.styleSheets, 'href');
	for (var i = 0; i < css.length; i++) {
		css[i] = css[i].replace(location.origin, '').replace('css2', 'css');
		if (css[i].indexOf('/css/') != -1){
			checkPX(css[i], root_font_size);
		}
	}
};


});
