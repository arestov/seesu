window.addEvent = window.addEventListener ? 
	function(elem, evType, fn){
		elem.addEventListener(evType, fn, false);
		return fn;
	}:
	function(elem, evType, fn){
		elem.attachEvent('on' + evType, fn);
		return fn;
	};
window.removeEvent = window.addEventListener ?
	function(elem, evType, fn){
		elem.removeEventListener(evType, fn, false);
	}:
	function(elem, evType, fn){
		elem.detachEvent('on' + evType, fn)
	};
	
(function(){
	var jsonp_counter = 0;
	window.create_jsonp_callback = function(func){
		var func_name = 'jsonp_callback_' + (++jsonp_counter);
		window[func_name] = func;
		
		
		
		return func_name;
	}	
})()

window.app_env = (function(){
	var env = {};
	if (typeof widget == 'object' && !widget.fake_widget){
		if ($.browser.opera){
			env.app_type = 'opera_widget';
		} else {
			env.app_type = 'apple_db_widget';
		}
		env.as_application = true;
	} else
	if (typeof chrome === 'object' && location.protocol == 'chrome-extension:'){
		env.app_type = 'chrome_extension';
		env.as_application = false;
	} else
	if (location.protocol.match(/http/)){
		env.app_type = 'web_app';
		env.as_application = false;
	} else 
	if (typeof btapp == 'object'){
		env.app_type = 'utorrent_app';
		env.as_application = false;
	} else
	if ($.browser.mozilla){
		env.app_type = 'firefox_widget';
		env.as_application = true;
	}  
	 else{
		env.app_type = false;
		env.unknown_app = true;
	}
	
	
	if (env.as_application){$(document.documentElement).addClass('as-application')}
	if (env.app_type){$(document.documentElement).addClass(env.app_type.replace('_','-'))}
	
	if (!env.app_type){
		env.app_type = 'unknown_app_type' + (navigator.userAgent && ': ' + navigator.userAgent); 
	} else{
		env[env.app_type] = true
	}
	
	
	
	return env;
})();



if (typeof widget != 'object'){
	window.widget = {
		fake_widget: true,
		identifier : 0,
		openURL: function(url){
			window.open(url);
		}
	}
}

// Forcing Opera full page reflow/repaint to fix page draw bugs
var forceOperaRepaint = function() {
	if (window.opera) {
		var bs = document.body.style;
		bs.position = 'relative';
		setTimeout(function() {
			bs.position = 'static';
		}, 1);
	}
}


var hard_testing = false;

if (typeof console != 'object'){
	
	
	if  (navigator.userAgent.match(/Opera/)){
		window.log = function(){
				opera.postError.apply(opera, arguments)
			
		}
	} else {
		if (hard_testing) {
			document.addEventListener('DOMContentLoaded', function(){
				var h = document.getElementsByTagName('head')[0];
				var _s = document.createElement('script');
					_s.src = "http://userscripts.ru/js/nice-alert/nice_alert.js";
				h.appendChild(_s)
			}, false);
		}
		
	
		log = function(text){
			if (!hard_testing) {return false;}
			alert(text)	
		}
	}
	
	
	console = {};
	console.log = function(text){
		window.log(text)
	}	
} else {
	window.log = function(text){
		console.log(text)
	}
}
if (typeof System != "undefined") {
	window.log = function(text){
		System.Debug.outputString(text);
	}
}