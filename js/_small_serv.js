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
		elem.detachEvent('on' + evType, fn);
	};
	
(function(){
	var jsonp_counter = 0;
	window.create_jsonp_callback = function(func){
		var func_name = 'jsonp_callback_' + (++jsonp_counter);
		window[func_name] = func;
		
		
		
		return func_name;
	};	
})();

var addClass = function(old_c, cl){
	
	var add_c = cl.split(' ');
	var new_c = old_c;
	for (var i=0; i < add_c.length; i++) {
		var re = new RegExp("(^|\\s)" + add_c[i] + "(\\s|$)", "g");
		if (!old_c.match(re)){
			var b = (" " + add_c[i]);
			new_c = (new_c + " " + add_c[i]).replace(/\s+/g, " ").replace(/(^ | $)/g, "");
		}
	};
	return new_c;
}
 
var removeClass = function(old_c, add_c){
	var re = new RegExp("(^|\\s)" + add_c + "(\\s|$)", "g");
	return old_c.replace(re, "$1").replace(/\s+/g, " ").replace(/(^ | $)/g, "");
}

var document_states = function(d){
	this.ui = {
		d: d
	};
	this.html_el_state= d.documentElement.className || '';
	this.body_state= (d.body && d.body.className) || '';

};
document_states.prototype = {
	add_state: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = addClass(this.html_el_state, state);
			if (this.ui.d) {
				this.ui.d.documentElement.className = this.html_el_state;
			}
			
		} else if (state_of == 'body'){
			this.body_state = addClass(this.body_state, state);
			if (this.ui.d && this.ui.d.body) {
				this.ui.d.body.className = this.body_state;
			}
		}
	},
	remove_state: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = removeClass(this.html_el_state, state);
			if (this.ui.d) {
				this.ui.d.documentElement.className  = this.html_el_state;
			}
			
		} else if (state_of == 'body'){
			this.body_state = removeClass(this.body_state, state);
			if (this.ui.d && this.ui.d.body) {
				this.ui.d.body.className = this.body_state;
			}
		}
	}, 
	connect_ui: function(ui){
		if (ui.d){
			if (ui.d.documentElement){
				ui.d.documentElement.className =  this.html_el_state;
			}
			if (ui.d.body){
				ui.d.body.className = this.body_state;
			}
			
		}
		this.ui = ui;
	}
};

window.dstates = new document_states(document);

window.app_env = (function(){
	var env = {};
	env.cross_domain_allowed = !location.protocol.match(/http/);
	
	
	if (typeof widget == 'object' && !widget.fake_widget){
		if ($.browser.opera){
			env.app_type = 'opera_widget';
		} else {
			env.app_type = 'apple_db_widget';
		}
		env.as_application = true;
	} else
	if (typeof chrome === 'object' && location.protocol == 'chrome-extension:'){
		if (location.pathname == '/index.html'){
			env.app_type = 'chrome_app';
			env.as_application = false;
		} else{
			env.app_type = 'chrome_extension';
			env.as_application = true;
		}
		
	} else
	if (location.protocol.match(/http/)){
		env.app_type = 'web_app';
		if (window.parent != window){
			env.as_application = true;
		} else{
			env.as_application = false;
		}
		
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
	try{
		if (document.createEvent('TouchEvent')){
			env.touch_support = true;
		}
	} catch(e){}
	
	
	
	
	
	if (!env.app_type){
		env.app_type = 'unknown_app_type' + (navigator.userAgent && ': ' + navigator.userAgent);
		env.unknown_app_type = true;
	} else{
		env[env.app_type] = true;
	}
	
	
	
	if (env.touch_support){dstates.add_state('html_el', 'touch-screen');}
	if (env.as_application){
		
		dstates.add_state('html_el', 'as-application');
	} else{
		dstates.add_state('html_el', 'not-as-application');
	}
	if (!env.unknown_app_type){dstates.add_state('html_el', env.app_type.replace('_','-'));}
	if (env.cross_domain_allowed) {dstates.add_state('html_el', 'cross-domain-allowed')}
	
	
	return env;
})();

window.open_url = (window.widget && window.widget.openURL) ? 
	function(){
		return widget.openURL.apply(widget, arguments);
	} :
	function(){
		return window.open.apply(window, arguments);
	};

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

// Forcing Opera full page reflow/repaint to fix page draw bugs
var forceOperaRepaint = function() {
	if (window.opera) {
		var bs = document.body.style;
		bs.position = 'relative';
		setTimeout(function() {
			bs.position = 'static';
		}, 1);
	}
};


var hard_testing = false;

if (typeof console != 'object'){
	var console = {};
	
	if  (navigator.userAgent.match(/Opera/)){
		console.log = function(){
				opera.postError.apply(opera, arguments);
			
		};
	} else if ((typeof System != "undefined") && System.Debug) {
		console.log = function(text){
			System.Debug.outputString(text);
		};
	} else {
		if (hard_testing) {
			document.addEventListener('DOMContentLoaded', function(){
				var h = document.getElementsByTagName('head')[0];
				var _s = document.createElement('script');
					_s.src = "http://userscripts.ru/js/nice-alert/nice_alert.js";
				h.appendChild(_s);
			}, false);
		}
		
	
		console.log = function(text){
			if (!hard_testing) {return false;}
			alert(text);
		};
	}	
}