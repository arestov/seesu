define(function(require) {
'use strict';
var localizer = require('localizer');

var sviga = {};
var localize= function(lang){
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
};

if (typeof window === 'undefined' && typeof process !== 'undefined') {
	return {
		bro: {},
		app_type: 'node',
		node: true,
		localize: localize()
	};
}

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

var env = (function(wd){

	var bro = detectBrowser();

	var env = {
		bro: bro,
		get_url_parameters: get_url_parameters
	};

	var url = get_url_parameters(wd.location.search, true);

	env.cross_domain_allowed = !wd.location.protocol.match(/(http\:)|(file\:)/);

	env.xhr2 = !!xhr2_support;

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

	} else if (typeof widget == 'object' && !window.widget.fake_widget){
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

	} else if (typeof chrome === 'object' && wd.location.protocol == 'chrome-extension:'){

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

	} else if (wd.location.protocol.match(/http/)){

		if (wd.parent != wd && url.access_token && url.user_id){
			env.app_type = 'vkontakte';
			env.check_resize = true;
		} else{

			env.need_favicon = true;
			env.app_type = 'web_app';

		}

		env.as_application = false;
		env.needs_url_history = true;

	} else if (wd.pokki && wd.pokki.show){
		env.safe_data = true;
		env.app_type = 'pokki_app';
		env.cross_domain_allowed = true;
		env.deep_sanbdox = true;
		//env.as_application = true;
	} else if (typeof btapp == 'object'){
		env.app_type = 'utorrent_app';
		env.as_application = false;
		env.deep_sanbdox = true;

	} else if (bro.browser == 'mozilla'){
		env.app_type = 'firefox_widget';
		env.as_application = true;

	} else{
		env.app_type = false;
		env.unknown_app = true;
		env.needs_url_history = true;
	}

	try {
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

	var getLang = function() {
		return (wd.navigator.language || wd.navigator.browserLanguage || 'en').slice(0,2).toLowerCase();
	};

	if (env.vkontakte){
		if (url.language === '0'){
			env.lang = 'ru';
		} else if (url.language === '3'){
			env.lang = 'en';
		} else{
			env.lang = getLang();
		}
	} else{
		env.lang = getLang();
	}




	return env;
})(window);


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

	if (window.widget && !window.widget.fake_widget){
		if (window.widget.openURL){
			openURL = function(){
				return window.widget.openURL.apply(window.widget, arguments);
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
	} else if (env.tizen_app) {
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
	env.openURL = openURL;

	if (window.pokki && pokki.showWebSheet){
		env.showWebPage = function(url, beforeLoadedCb, error, width, height){
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
					env.hideWebPages();
					return false;
				}
			};
			return pokki.showWebSheet(url, width || 640, height || 480, beforeLoaded, errorCb);
		};
		env.hideWebPages = function(){
			return pokki.hideWebSheet();
		};
		env.clearWebPageCookies = function(){
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
			if (charCode > 0xFF) {throw INVALID_CHARACTER_ERR;}
			block = block << 8 | charCode;
		}
		return output;
		});

		// decoder
		// [https://gist.github.com/1020396] by [https://github.com/atk]
		object.atob || (
		object.atob = function (input) {
		input = input.replace(/=+$/, '')
		if (input.length % 4 == 1) {throw INVALID_CHARACTER_ERR;}
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

env.localize = localize(env.lang);


var states = {};
for (var prop in env) {
	if (typeof env[prop] != 'function') {
		states[prop] = env[prop];
	}
}
env.states = states;

return env;
});
