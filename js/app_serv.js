define(['spv', 'localizer', 'js/libs/w_storage', 'js/preloaded_nk', 'jquery'], function(spv, localizer, w_storage, preloaded_nk, $) {
"use strict";
var app_serv = {};

app_serv.getRemainTimeText = function(time_string, full){
	var d = new Date(time_string);
	var remain_desc = '';

	if (full){
		remain_desc += localize('wget-link') + ' ';
	}

	remain_desc += d.getDate() +
	" " + localize('m'+(d.getMonth()+1)) +
	" " + localize('attime') + ' ' + d.getHours() + ":" + d.getMinutes();

	return remain_desc;
};


app_serv.complexEach = function(items, callback, start) {
	if (!items) {return;}

	var length = 0;

	for (var i = 0; i < items.length; i++) {
		if (!items[i]) {continue;}
		
		if (items[i].length > length) {
			length = items[i].length;
		}
	}

	var start_result = start || [];
	var result;

	for (var bb = 0; bb < length; bb++) {
		var args = [start_result];
		for (var kk = 0; kk < items.length; kk++) {
			args.push(items[kk] && items[kk][bb]);
		}
		result = callback.apply(null, args);
	}

	return result;
};

(function(){

function isFileReady ( readyState ) {
	// Check to see if any of the ways a file can be ready are available as properties on the file's element
	return ( ! readyState || readyState == 'loaded' || readyState == 'complete' );
}

var p = document.getElementsByTagName('script');
p = p[p.length-1];
		
app_serv.loadJS = function(src, callback){
	var s = document.createElement('script'),
		done;
	s.onreadystatechange = s.onload = function () {

	if ( ! done && isFileReady( s.readyState ) ) {

		// Set done to prevent this function from being called twice.
		done = true;
		callback();

		// Handle memory leak in IE
		s.onload = s.onreadystatechange = null;
	}
	};
	s.src = src;
	p.parentNode.insertBefore(s, p);
};

})();

var getTagRegExp = function(tag_name, simple, flags){
	var reg_string = "<" + tag_name + "[\\s\\S]*?>";
	if (!simple){
		reg_string += "[\\s\\S]*?<\/" + tag_name + ">";
	}
	return new RegExp(reg_string, flags || "gi");
};

var getCleanDocumentBodyHTML = function(text) {
	var body = text.match(getTagRegExp("body"));
	body = body && body[0];
	if (body){
		var wrap = document.createElement("html");
		wrap.innerHTML = body
			.replace(getTagRegExp("script"), "")
			.replace(getTagRegExp("style"), "")
			.replace(getTagRegExp("img", true) , "")
			.replace(getTagRegExp("link", true) , "");
		return wrap;
	}
};
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
var loadImage = function(opts) {
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
app_serv.loadImage = loadImage;

app_serv.getInternetConnectionStatus = function(cb) {
	var img = new Image();
	img.onload = function() {
		cb(true);
	};
	img.onerror = function() {
		cb(false);
	};
	img.src = "http://www.google-analytics.com/__utm.gif?" + Math.random() + new Date();
};

app_serv.getHTMLText = function(text) {
	var safe_node = document.createElement('div');
	safe_node.innerHTML = text;
	return $(safe_node).text();
};




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

var dstates = new NodeClassStates(window.document.documentElement);


var get_url_parameters = function(str, decode_uri_c){
	var url_vars = str.replace(/^\?/,'').split('&');
	var full_url = {};
	for (var i=0; i < url_vars.length; i++) {
		var _h = url_vars[i].split('=');
		var prop_name = _h[0];
		var prop_value = _h[1];
		if (decode_uri_c){
			prop_name = decodeURIComponent(prop_name);
			prop_value = decodeURIComponent(prop_value);
		}

		
		full_url[prop_name] = prop_value;
	}
	return full_url;
};
app_serv.get_url_parameters = get_url_parameters;

var detectBrowser;
(function(w) {
	var
		rwebkit = /(webkit)[ \/]([\w.]+)/,
		ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
		rmsie = /(msie) ([\w.]+)/,
		rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,
		ua = w && w.navigator && w.navigator.userAgent;

	detectBrowser = function() {
		ua = ua.toLowerCase();

		var match = rwebkit.exec( ua ) ||
			ropera.exec( ua ) ||
			rmsie.exec( ua ) ||
			ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
			[];

		return { browser: match[1] || "", version: match[2] || "0" };
	};
	
})(window);
var xhr2_support = window.XMLHttpRequest && "withCredentials" in (new XMLHttpRequest());  //https://gist.github.com/1431660

var app_env = (function(wd){

	var bro = detectBrowser();

	var env = {
		bro: bro
	};
	env.url = get_url_parameters(wd.location.search, true);
	
	env.cross_domain_allowed = !wd.location.protocol.match(/(http\:)|(file\:)/);
	
	env.xhr2 = !!xhr2_support;

	
	var dom_style_obj = wd.document.body.style;
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
		env.transition = has_transition_prop;
	}

	if (has_transform_prop){
		env.transform = has_transform_prop;
	}
	if (typeof lg_smarttv_app != 'undefined' || (navigator.userAgent.search(/LG Browser/i) && (window.NetCastExit || window.NetCastBack))){
		env.deep_sanbdox = true;
		env.as_application = false;
		env.app_type = 'lg_smarttv_app';
	} else if (typeof process == 'object' && window.process.nextTick && typeof navigator == 'object'){
		env.app_type = 'nodewebkit';
		env.as_application = false;
		env.deep_sanbdox = true;
		env.needs_url_history = true;
		env.torrents_support = true;
		env.cross_domain_allowed = true;
	} else if (window.tizen){
		env.app_type = 'tizen_app';
		env.as_application = false;
		env.deep_sanbdox = true;
		env.needs_url_history = true;
	} else
	if (typeof widget == 'object' && !window.widget.fake_widget){
		if (bro.browser == 'opera'){
			if (window.opera.extension){
				env.app_type = 'opera_extension';
			} else{
				env.app_type = 'opera_widget';
				env.deep_sanbdox = true;
			}
			
		} else {
			env.app_type = 'apple_db_widget';
		}
		env.deep_sanbdox = true;
		env.as_application = true;
	} else
	if (typeof chrome === 'object' && wd.location.protocol == 'chrome-extension:'){
		
		var opera = navigator.userAgent.indexOf('OPR') != -1;
		if (wd.location.pathname == '/index.html'){
			env.app_type = opera ? 'opera_app' : 'chrome_app';
			env.as_application = false;
			env.needs_url_history = true;
			env.need_favicon = true;
		} else{
			env.chrome_like_ext = true;
			env.app_type = opera ? 'opera_extension' : 'chrome_extension';
			env.as_application = true;
		}
		
	} else
	if (wd.location.protocol.match(/http/)){
		
		if (wd.parent != wd && env.url.access_token && env.url.user_id){
			env.app_type = 'vkontakte';
			env.check_resize = true;
		} else{

			env.need_favicon = true;
			env.app_type = 'web_app';
			
		}
		env.as_application = false;
		env.needs_url_history = true;
		
	} else
	if (wd.pokki && wd.pokki.show){
		env.safe_data = true;
		env.app_type = 'pokki_app';
		env.cross_domain_allowed = true;
		env.deep_sanbdox = true;
		//env.as_application = true;
	} else
	if (typeof btapp == 'object'){
		env.app_type = 'utorrent_app';
		env.as_application = false;
		env.deep_sanbdox = true;
		
	} else
	if (bro.browser == 'mozilla'){
		env.app_type = 'firefox_widget';
		env.as_application = true;
	} else{
		env.app_type = false;
		env.unknown_app = true;
		env.needs_url_history = true;
	}
	try{
		if (wd.document.createEvent('TouchEvent')){
			env.touch_support = true;
		}
	} catch(e){}
	
	
	
	//env.needs_url_history = false; //TEMP
	
	if (!env.app_type){
		env.app_type = 'unknown_app_type' + (wd.navigator.userAgent && ': ' + wd.navigator.userAgent);
		env.unknown_app_type = true;
		env.deep_sanbdox = true;
	} else{
		env[env.app_type] = true;
	}
	

	env.iframe_support = !env.utorrent_app && (!env.unknown_app_type || wd.location.protocol == 'file:');
	
	
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
	
	if (env.transform){
		dstates.addState('yes-transform_support');
	} else {
		dstates.addState('no-transform_upport');
	}
	var getLang = function() {
		return (wd.navigator.language || wd.navigator.browserLanguage || 'en').slice(0,2).toLowerCase();
	};
	
	if (env.vkontakte){
		if (env.url.language === '0'){
			env.lang = 'ru';
		} else if (env.url.language === '3'){
			env.lang = 'en';
		} else{
			env.lang = getLang();
		}
	} else{
		env.lang = getLang();
	}
	
	
	
	
	return env;
})(window);
app_serv.app_env = app_env;

var is_nodewebkit = app_env.app_type == 'nodewebkit';

app_serv.getSafeIframe = function() {
	var iframe = document.createElement('iframe');
	if (is_nodewebkit) {
		iframe.setAttribute('nwdisable', true);
		iframe.setAttribute('nwfaketop', true);
	}

	return iframe;
};




(function(){
	var sensitive_keys = ['vk_token_info', 'dg_auth', 'lfm_scrobble_s', 'lfmsk', 'big_vk_cookie'];
	var parse = function(r_value){
		if (r_value === Object(r_value)){
			return r_value;
		} else if (typeof r_value == 'string'){
			var str_start = r_value.charAt(0),
				str_end   = r_value.charAt(r_value.length - 1);
			if ((str_start == '{' && str_end == '}') || (str_start == '[' && str_end == ']')){
				try {
					r_value = JSON.parse(r_value);
				} catch (e) {
					
				}
			}
			return r_value;
		} else{
			return r_value;
		}
	};
	app_serv.store = function(key, value, opts){
		var sensitive = !!key && sensitive_keys.indexOf(key) > -1;
		if (typeof value != 'undefined'){
			if (value && sensitive && app_env.pokki_app){
				value = pokki.scramble(value);
			}

			return w_storage(key, value, opts);
			
		} else{
			
			value =  w_storage(key, value, opts);
			if (sensitive && app_env.pokki_app){
				value = pokki.descramble(value);
			}
			
			return parse(value);
		}
	};
	app_serv.getPreloadedNK = window.getPreloadedNK = function(key){
		if (app_env.pokki_app){
			var rv = pokki.getScrambled(key);
			if (rv){
				return rv;
			}
		}
		var nk = preloaded_nk;
		if (nk && nk[key]){
			return nk[key];
		}
		
	};

})();

if (typeof widget != 'object'){
	window.widget = {
		fake_widget: true,
		identifier : 0,
		showNotification: function(){return false;},
		openURL: function(url){
			window.open(url);
		}
	};
}


(function(){
	var openURL;

	if (window.widget && !widget.fake_widget){
		if (widget.openURL){
			openURL = function(){
				return widget.openURL.apply(widget, arguments);
			};
		} else{
			openURL = function(url){
				var link_node = window.document.createElement('a');
					link_node.href = url;
					link_node.click();
			};
		}
		
	} else if (window.pokki && pokki.openURLInDefaultBrowser) {
		openURL = function(){
			return pokki.openURLInDefaultBrowser.apply(pokki, arguments);
		};
	} else if (app_env.tizen_app) {
		openURL = function(url) {
			var appControl = new window.tizen.ApplicationControl( "http://tizen.org/appcontrol/operation/view", url );
			window.tizen.application.launchAppControl(
				appControl,
				null,
				function(){console.log("launch appControl succeeded");},
				function(e){console.log("launch appControl failed. Reason: " + e && e.name);}
			);
			

		};
	} else {
		openURL = function(url){
			return window.open(url);
		};
	}
	app_env.openURL = openURL;

	if (window.pokki && pokki.showWebSheet){
		app_env.showWebPage = function(url, beforeLoadedCb, error, width, height){
			var errorCb = function(error_name){
				if (error) {
					error(error_name);
				}
				pokki.hideWebSheet();
			};
			var beforeLoaded = function(nurl){
				var done = beforeLoadedCb.apply(this, arguments);
				//beforeLoaded func must contain "return true" in it's body
				if (!done) {
					return true;
				} else{
					app_env.hideWebPages();
					return false;
				}
			};
			return pokki.showWebSheet(url, width || 640, height || 480, beforeLoaded, errorCb);
		};
		app_env.hideWebPages = function(){
			return pokki.hideWebSheet();
		};
		app_env.clearWebPageCookies = function(){
			return pokki.clearWebSheetCookies();
		};
	}
	

})();




if (typeof console != 'object'){
	var console = {};
	
	if  (window.navigator.userAgent.match(/Opera/)){
		console.log = function(){
				opera.postError.apply(opera, arguments);
			
		};
	} else if ((typeof System != "undefined") && System.Debug) {
		console.log = function(text){
			System.Debug.outputString(text);
		};
	} else {
		console.log = function(){};
	}
}

var replaceComplexSVGImages;

app_serv.handleDocument = function(d, tracking_opts) {
	var
		done,
		dom_opts,
		ui;

	var tryComplete = function() {


		if (!done && ui && dom_opts){
			done = true;
			ui.setDOM(dom_opts, tracking_opts);
		}
	};

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

		var lang = app_env.lang;

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

var sviga = {};

var localize= (function(){
	var lang = app_env.lang;
	return function(string, j){
		if (localizer[string]){
			return localizer[string][lang] || localizer[string].original;
		} else{
			if (j){
				sviga[string] ={
					original:j
				};
				return j;
			}
			
			return 'no this localization: ' + string;
		}
		
	};
})();
app_serv.localize = localize;






	;(function () {

	var
		object = typeof window != 'undefined' ? window : exports;
	if (object.btoa){
		return;
	}
	var
		chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
		INVALID_CHARACTER_ERR = (function () {
			// fabricate a suitable error object
			try { document.createElement('$'); }
			catch (error) { return error; }}());

		// encoder
		// [https://gist.github.com/999166] by [https://github.com/nignag]
		object.btoa || (
		object.btoa = function (input) {
		for (
			// initialize result and counter
			var block, charCode, idx = 0, map = chars, output = '';
			// if the next input index does not exist:
			//   change the mapping table to "="
			//   check if d has no fractional digits
			input.charAt(idx | 0) || (map = '=', idx % 1);
			// "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
			output += map.charAt(63 & block >> 8 - idx % 1 * 8)
		) {
			charCode = input.charCodeAt(idx += 3/4);
			if (charCode > 0xFF) throw INVALID_CHARACTER_ERR;
			block = block << 8 | charCode;
		}
		return output;
		});

		// decoder
		// [https://gist.github.com/1020396] by [https://github.com/atk]
		object.atob || (
		object.atob = function (input) {
		input = input.replace(/=+$/, '')
		if (input.length % 4 == 1) throw INVALID_CHARACTER_ERR;
		for (
			// initialize result and counters
			var bc = 0, bs, buffer, idx = 0, output = '';
			// get next character
			buffer = input.charAt(idx++);
			// character found in table? initialize bit storage and add its ascii value;
			~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
			// and if not first of each 4 characters,
			// convert the first 8 bits to one ascii character
			bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
		) {
			// try to find character in table (0-63, not found => -1)
			buffer = chars.indexOf(buffer);
		}
		return output;
		});

	}());

(function(global) {
	


	
	var getTabs = function(count) {
		var tabs_string = '';
		while (count){
			tabs_string += '\t';
			--count;
		}
		return tabs_string;
	};
	app_serv.getTabs = getTabs;
	
	var getRulesString = function(arr, tabs_count) {
		var string = '';
		for (var i = 0; i < arr.length; i++) {
			string += getTabs(tabs_count) + arr[i].name + ': ' + arr[i].new_values.join(' ') + ';\n';
		}
		return string;
	};

	app_serv.getRulesString = getRulesString;


	var getRemUnitValue = function(value, root_font_size) {
		return (value/root_font_size) + 'rem';
	};

	app_serv.getRemUnitValue = getRemUnitValue;

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
	app_serv.culculateRemRule = culculateRemRule;

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
	app_serv.getSimpleCSSRules = getSimpleRules;

	

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

		if (app_env.utorrent_app){
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
	

/*
var getAuString = function(user) {
	return 'API.audio.get({"uid": ' + user + '})';
};

var strings = []
for (var i = 0; i < fr.length; i++) {
	strings.push(getAuString(fr[i]));
};
*/


//var vkFunc = function() {
	/*
	var all = {};
	var friends = API.friends.get();
	var count_down = friends.length;
	
	while (count_down != 0) {
		
		
		count_down = count_down -1;
	};
	
	return friends;
	
	*/
//};
/*

return API.audio.get({"uid": friends[0]});

for (var i = 0; i < friends.length; i++) {
	all[friends[i]] = API.audio.get({"uid": friends[i]});
	
}



su.vk_api
.get('execute',{
	code: vkFunc.toString().match(/\/\*([\s\S]*?)\*\//)[1]
})
.done(function(r){console.log(r)});
*/
var parseArtistInfo = app_serv.parseArtistInfo = function(r){
	var ai = {};
	if (r && r.artist){
		var info = r.artist;

		
		ai.artist = spv.getTargetField(info, 'name');
		ai.bio = (ai.bio = spv.getTargetField(info, 'bio.summary')) && ai.bio.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
		ai.similars = (ai.similars = spv.getTargetField(info, 'similar.artist')) && spv.toRealArray(ai.similars);
		ai.tags = (ai.tags = spv.getTargetField(info, 'tags.tag')) && spv.toRealArray(ai.tags);
		ai.images = (ai.images = spv.getTargetField(info, 'image')) && (ai.images = spv.toRealArray(ai.images)) && spv.filter(ai.images, '#text');

	}
	return ai;
};




return app_serv;
});
