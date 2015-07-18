define(['spv', 'env', 'localizer', 'jquery'], function(spv, env, localizer, $) {
"use strict";
var serv = {};

(function() {
	var css = {};

	var dom_style_obj = window.document.body.style;
	var has_transform_prop;
	var has_transition_prop;

	var transition_props = {
		//https://github.com/ai/transition-events/blob/master/lib/transition-events.js
		// Webkit must be on bottom, because Opera try to use webkit
		// prefix.
		'transition':		'transitionend',
		'OTransition':		'oTransitionEnd',
		'WebkitTransition':	'webkitTransitionEnd',
		'MozTransition':	'transitionend'
	};

	for ( var prop in transition_props ) {
		if (prop in dom_style_obj){
			has_transition_prop = transition_props[prop];
			break;
		}
	}

	['transform', '-o-transform', '-webkit-transform', '-moz-transform'].forEach(function(el) {
		if (!has_transform_prop && el in dom_style_obj){
			has_transform_prop = el;
		}
	});

	if (has_transition_prop){
		css.transition = has_transition_prop;
	}

	if (has_transform_prop){
		css.transform = has_transform_prop;
	}

	serv.css = css;

})();

var addClass = function(old_c, cl){
	var add_c = cl.split(' ');
	var new_c = old_c;
	for (var i=0; i < add_c.length; i++) {
		var re = new RegExp("(^|\\s)" + add_c[i] + "(\\s|$)", "g");
		if (!old_c.match(re)){
		//	var b = (" " + add_c[i]);
			new_c = (new_c + " " + add_c[i]).replace(/\s+/g, " ").replace(/(^ | $)/g, "");
		}
	}
	return new_c;
};
 
var removeClass = function(old_c, add_c){
	var re = new RegExp("(^|\\s)" + add_c + "(\\s|$)", "g");
	return old_c.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "");
};
var toggleClass = function(old_c, toggle_class){
	if (old_c.indexOf(toggle_class) == -1){
		return addClass(old_c, toggle_class);
	} else{
		return removeClass(old_c, toggle_class);
	}
};

var NodeClassStates = function(node, init_state){
	this.node = node;
	this.html_el_state = init_state || node.className || '';

};
NodeClassStates.prototype = {
	addState: function(state){
		this.html_el_state = addClass(this.html_el_state, state);
	},
	toggleState: function(state){
		this.html_el_state = toggleClass(this.html_el_state, state);
	},
	removeState: function(state){
		this.html_el_state = removeClass(this.html_el_state, state);
	},
	applyStates: function(){
		this.node.className = this.html_el_state;
	},
	getFullState: function() {
		return this.html_el_state;
	}
};


serv.handleDocument = function(d, tracking_opts) {
	var dstates = new NodeClassStates(window.document.documentElement);

	if (env.touch_support){dstates.addState('touch-screen');}
	if (env.as_application){
		
		dstates.addState('as-application');
		dstates.removeState('not-as-application');
	} else{
		dstates.addState('not-as-application');
	}
	if (!env.unknown_app_type){
		if (env.chrome_like_ext){
			dstates.addState('chrome-extension');
		} else {
			dstates.addState(env.app_type.replace('_','-'));
		}
		

	}
	if (env.cross_domain_allowed) {dstates.addState('cross-domain-allowed');}

	if (serv.css.transform){
		dstates.addState('yes-transform_support');
	} else {
		dstates.addState('no-transform_upport');
	}

	spv.domReady(d, function() {
		var current_dst = new NodeClassStates(d.documentElement, dstates.getFullState());
		current_dst.applyStates();
	});
	

	spv.domReady(d, function() {
		if (!d.head){
			d.head = d.getElementsByTagName('head')[0];
		}

		var emptyNode = function(node) {
			var length = node && node.childNodes.length;
			for (var i = length - 1; i >= 0; i--) {
				node.removeChild( node.childNodes[i] );
			}
			/*while (node.firstChild){
				node.removeChild( node.firstChild );
			}*/
			return node;
		};

		var lang = env.lang;

		var nodes_array = d.getElementsByClassName('lang');
		var translatable = [];
		var translate = function(el) {
			var cn = el.className;
			var classes = cn.split(/\s/);
			for (var i = 0; i < classes.length; i++) {
				var cl = classes[i];
				if (cl.match(/localize/)){
					var term = localizer[cl.replace('localize-','')];
					var string = term && (term[lang] || term['original']);
					if (string){
						translatable.push([el, string]);
						//$(el).text();
						break;
					}
				}
			}
		};
		var i;
		for (i = 0; i < nodes_array.length; i++) {
			translate(nodes_array[i]);
		}
		for (i = 0; i < translatable.length; i++) {
			var cur = translatable[i];
			emptyNode(cur[0]).appendChild(d.createTextNode(cur[1]));
			
		}
	});
	requirejs(['jquery'], function($) {
		spv.domReady(d, function() {
			replaceComplexSVGImages(d, $);
		});
	});

};


var replaceComplexSVGImages;
(function(global) {
	


	
	var getTabs = function(count) {
		var tabs_string = '';
		while (count){
			tabs_string += '\t';
			--count;
		}
		return tabs_string;
	};
	
	var getRulesString = function(arr, tabs_count) {
		var string = '';
		for (var i = 0; i < arr.length; i++) {
			string += getTabs(tabs_count) + arr[i].name + ': ' + arr[i].new_values.join(' ') + ';\n';
		}
		return string;
	};

	var getRemUnitValue = function(value, root_font_size) {
		return (value/root_font_size) + 'rem';
	};

	var culculateRemRule = function(rule, root_font_size) {
		//var result = [];
		//var parsed_rule = {};

		var replaceFunc = function (str, p1) {
			var real_val = parseFloat(p1);
			if (real_val){
				return getRemUnitValue(real_val, root_font_size);
			} else {
				return 0;
			}



			return p1 + 'rem';
		};
		var lines = rule.style.cssText.split(/\;\n|\;/);
		var px_props = [];
		for (var i = 0; i < lines.length; i++) {
			var parts = lines[i] && lines[i].split(/\s?\:\s?/);
			if (parts && parts[1].indexOf('px') != -1){
				var values = parts[1].split(/\s/);
				var new_values = [];
				for (var j = 0; j < values.length; j++) {
					var cur_val = values[j];
					if (cur_val.indexOf('px') == -1){
						new_values[j] = cur_val;
					} else {
						new_values[j] =  cur_val.replace(/(\d+)px/gi, replaceFunc);
						
					}
					
				}
				if (new_values.join(' ') != 0){
					px_props.push({
						name: parts[0].replace(/^\s*/,''),
						original: parts[1],
						value: values,
						new_values: new_values
					});
				}


				
			}

		}

		var original_selector = rule.selectorText;
		var selector_parts = original_selector.split(',');
		for (var i = 0; i < selector_parts.length; i++) {
			selector_parts[i] = '.stretch-all ' + selector_parts[i];
		}

		var rule_start = rule.__starts,
			rule_end = rule.__ends,
			style_start = rule.style.__starts;



		return {
			px_props: px_props,
			rule_start: rule_start,
			rule_end: rule_end,
			style_start: style_start,

			selector: original_selector,
			stretch_selector: selector_parts.join(', '),
			rule: rule,

			string: px_props.length ? getRulesString(px_props) : ''
		};

	};

	var getSimpleRules = function(sheet){
		var simple_rules = [];

		var iterating_rules = sheet.cssRules && [].concat(Array.prototype.slice.call(sheet.cssRules));
		while (iterating_rules && iterating_rules.length){
			var cur = iterating_rules.shift();
			if (cur.cssRules){
				iterating_rules = [].concat(Array.prototype.slice.call(cur.cssRules), iterating_rules);
			} else {
				simple_rules.push(cur);
			}
		}
		return simple_rules;
	};

	

	var replaceSVGHImage = function(rule, style, $){

		var bgIString = rule.style.backgroundImage;
		bgIString = bgIString
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
		 
		//console.log(structure);
		var file_url = structure.file;

		if (env.utorrent_app){
			file_url = 'http://seesu.me/apps_resources/v4.2/' + file_url;
		}

		$.ajax({
			url: file_url,
			dataType: 'xml'
		}).done(function(r){
			//$(r).find('#states-switcher')
			//console.log(r);
			//r = $(r).clone()[0];

			if (structure.viewBox){
				$(r.documentElement).attr('viewBox', structure.viewBox);
			}
			if (structure.state){
				$(r).find('#states-switcher').attr('class', structure.state);
			}
			if (structure.part){
				$(r).find('#parts-switcher').attr('xlink:href', '#' + structure.part);
			}
			var xml_text;
			try {
				xml_text = new XMLSerializer().serializeToString(r);
			} catch (e){
				if (r.xml){
					xml_text = r.xml;
				}
			}
			if (!xml_text){
				return;
			}

			var bg_image_string = 'url(\'data:image/svg+xml;base64,' + btoa(xml_text) + '\')';

			var new_rule_text = '\n' +
				rule.selectorText +
				' {\n' + 'background-image:' + bg_image_string +
				';\n}';



			$(style).append(document.createTextNode(new_rule_text));

			
			
		});
		//var target
	};

	replaceComplexSVGImages = function(doc, $){

		var big_list = [];
		for (var i = 0; i < doc.styleSheets.length; i++) {
			big_list = big_list.concat(getSimpleRules(doc.styleSheets[i]));
			
		}
		var svg_hacked = spv.filter(big_list, 'style.backgroundImage', function(value){
			return value && value.indexOf('data:text/plain;utf8,svg-hack,') !== -1;
		});
		var style = doc.createElement('style');
		$(doc.documentElement.firstChild).append(style);
		//console.log(svg_hacked);
		$.each(svg_hacked, function(i, el){
			replaceSVGHImage(el, style, $);
		});
	};
	
})(this);

var loadImage = (function() {
	var loaded_images = {};
	var images_callbacks = {};
	var addImageLoadCallback = function(url, cb) {
		if (!images_callbacks[url]){
			images_callbacks[url] = [];
		}
		images_callbacks[url].push(cb);
	};
	var removeImageLoadCallback = function(url, cb) {
		if (images_callbacks[url]){
			images_callbacks[url] = spv.arrayExclude(images_callbacks[url], cb);
		}
	};

	var triggerImagesCallback = function(url) {
		var array = images_callbacks[url];
		if (array){
			while (array.length){
				var cb = array.shift();
				cb.call();
			}
		}
	};

	return function(opts) {
		if (typeof opts.cache_allowed != 'boolean'){
			throw new Error('cache_allowed must be true or false');
		}
		//queue
		var stop = '';

		var done, accomplished, url = opts.url;
		var node = opts.node || new Image();
		var deferred = $.Deferred();

		var async_obj = deferred.promise({
			abort: function() {
				if (node){
					node.src = '';
				}
				
				if (this.queued){
					this.queued.abort();
				}
				unbindEvents();

				node = null;
				opts = null;
				stop = 'abort';
			}
		});
		var imageLoadCallback = function(){
			accomplishLoad();
		};

		var unbindEvents = function() {
			if (node) {
				spv.removeEvent(node, "load", loadCb);
				spv.removeEvent(node, "error", errorCb);
			}

			removeImageLoadCallback(url, imageLoadCallback);
		};
		var loadCb = function(e) {
			if (done){
				return;
			}
			done = true;
			deferred.resolve(node);
			unbindEvents();
			if (async_obj && async_obj.queued){
				async_obj.queued.abort();
			}
			if (async_obj.timeout_num){
				clearTimeout(async_obj.timeout_num);
			}
			if (e && e.type == 'load'){
				triggerImagesCallback(opts.url);
			}

			node = null;
			opts = null;
			stop = 'loaded';
		};
		var errorCb = function() {
			deferred.reject(node);
			unbindEvents();

			node = null;
			opts = null;
			stop = 'error';
		};

		spv.addEvent(node, "load", loadCb);
		spv.addEvent(node, "error", errorCb);


		var accomplishLoad = function() {
			if (accomplished){
				return;
			}
			accomplished = true;
			
			node.src = opts.url;
			if (node.complete){
				if (opts.cache_allowed){
					loaded_images[opts.url] = true;
				}
				loadCb();
			} else {
				if (opts.timeout){
					async_obj.timeout_num = setTimeout(function() {
						deferred.reject(node, 'timeout');
						unbindEvents();

						node = null;
						opts = null;

						stop = 'timeout';
					}, opts.timeout);
				}
			}
		};
		if (opts.queue && !loaded_images[opts.url]){
			addImageLoadCallback(opts.url, imageLoadCallback);
			async_obj.queued = opts.queue.add(accomplishLoad);
			
		} else {
			accomplishLoad();
		}
		return async_obj;
	};
})();

serv.loadImage = loadImage;	

return serv;
});