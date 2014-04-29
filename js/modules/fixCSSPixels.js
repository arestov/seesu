define(['app_serv', 'jquery', 'spv'], function(app_serv, $, spv) {
"use strict";
	var getTabsCount = function(sheet_string, cur) {
		var sel_prev_text = sheet_string.slice(0, cur.__starts);

		var sel_tabs = sel_prev_text.match(/\t+(?:$)/gi);
		var sel_tabs_count = sel_tabs && sel_tabs[0].length || 0;
		return sel_tabs_count;
	};
	var injectText = function(big_text, text, pos) {
		var big_start = big_text.slice(0, pos);
		var big_end = big_text.slice(pos);

		return big_start + text + big_end;
	};

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

				var sel_tabs_count = getTabsCount(sheet_string, cur);

				complects.push(rulll);
				if (rulll.px_props.length){


					var rules_string = '\n' +
						app_serv.getTabs(sel_tabs_count + 1) + '/* rem hack */\n' +
						app_serv.getRulesString(rulll.px_props, sel_tabs_count + 1);

					big_result = injectText(big_result, rules_string, cur.__ends -1 + pos_shift);
					pos_shift += rules_string.length;

				}
				
			}
			
		}

		return string ? big_result : complects;
	};

	var fixHoverSelector = function(selector_text, prefix) {
		prefix = prefix || '';
		var selectors = selector_text.split(/\s*\,\s*/);
		var fixed = [];

		for (var i = 0; i < selectors.length; i++) {
			var cur = selectors[i];
			if (cur.search(/[^\s]\.surf_nav/) != -1) {
				fixed.push(prefix + cur.replace('.surf_nav', ':hover'));
			}
			
		}
		return fixed;

	};
	

	var fixHovers = function(href, sheet_string, root_font_size, string) {
		var sheet = window.CSSOM.parse(sheet_string);
		href = href || sheet.href;
		var pos_shift = 0;

		var big_result = sheet_string;
		var simple_rules = app_serv.getSimpleCSSRules(sheet);
		var complects = [];


		for (var i = 0; i < simple_rules.length; i++) {
			var cur = simple_rules[i];
			if (!cur.selectorText) {

			} else if (cur.selectorText.indexOf(':hover') != -1) {

				if (cur.style && cur.style.cssText && cur.style.cssText.indexOf('background-image') != -1) {
					continue;
				}
				


				var sel_tabs_count = getTabsCount(sheet_string, cur);

				var rules_string = '\n' +
					app_serv.getTabs(sel_tabs_count + 1) + '/* bg hover hack */\n' +
					app_serv.getTabs(sel_tabs_count + 1) + 'background-color:' + '#000;' + '\n';

				//
				//#a82c53 - розовый

				big_result = injectText(big_result, rules_string, cur.__ends -1 + pos_shift);
				pos_shift += rules_string.length;
				//
				//debugger;
			} else if (cur.selectorText.search(/[^\s]\.surf_nav/) != -1) {
				//var sel_tabs_count = getTabsCount(sheet_string, cur);

				
				
				var selector = ', ' + fixHoverSelector(cur.selectorText, '.lg_smarttv_app ').join(', ');
				var selector_text_end = cur.__starts + cur.selectorText.length;

				big_result = injectText(big_result, selector, selector_text_end + pos_shift);
				pos_shift += selector.length;

				//var 
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
			var fixed_css;

			fixed_css = createStyleSheet(url, r, root_font_size, true);
			//console.log("url: " + url);
			//console.log(test);

			fixed_css = fixHovers(url, fixed_css, root_font_size, true);

			var file_name = url.split('/');
			file_name = file_name && file_name[file_name.length -1];
			window.open('data:text/plain;base64,' + btoa( '/*\n' + file_name + "\n*/ \n" + fixed_css));
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