(function() {
	var ready = false;
	jsLoadComplete(function(){
		$(function(){
			ready = true;
		});
	})
	window.suReady = function(callback){
		if (ready){
			setTimeout(callback, 30);
		} else{
			jsLoadComplete(function(){
				$(callback);
			})
		}
		
	};
	
})();

(function(){
	var jsonp_counter = 0;
	window.create_jsonp_callback = function(func){
		var func_name = 'jsonp_callback_' + (++jsonp_counter);
		window[func_name] = func;
		
		
		
		return func_name;
	};	
})();
function getSomething(array){
	return array[(Math.random()*(array.length-1)).toFixed(0)]
};

function extCarefully(target, donor, white_list){
	for (var prop in donor) {
		if (!white_list || bN(white_list.indexOf(prop))){
			target[prop] = donor[prop];
		}
	}
};


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
var toggleClass = function(old_c, toggle_class){
	if (bN(old_c.indexOf(toggle_class))){
		return removeClass(old_c, toggle_class);
	} else{
		return addClass(old_c, toggle_class);
	}
};
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
	toggleState: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = toggleClass(this.html_el_state, state);
			if (this.ui.d) {
				this.ui.d.documentElement.className  = this.html_el_state;
			}
			
		} else if (state_of == 'body'){
			this.body_state = toggleClass(this.body_state, state);
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


function get_url_parameters(str){
	var url_vars = str.replace(/^\?/,'').split('&');
	var full_url = {};
	for (var i=0; i < url_vars.length; i++) {
		var _h = url_vars[i].split('=');
		full_url[_h[0]] = _h[1];
	};
	return full_url;
};
function getFakeURLParameters(str){
	var divider = str.indexOf('/');
	if (bN(divider)){
		var search_part = str.slice(0, divider);
		var path_part = str.slice(divider + 1);
	} else{
		var search_part = str;
	}
	var params = (search_part && get_url_parameters(search_part)) || {};
	
	var sp = [];
	var query = params.q ? '?q=' + params.q : '';
	if (query) {
		sp.push(query)
	}
	if (path_part){
		sp = sp.concat(sp, path_part.replace(/^\//,'').split('/'));
	}
	
	
	return {params:params || {}, path: path_part || '', supported_path: sp};
	
	
};
window.app_env = (function(){
	var env = {};
	env.url = get_url_parameters(location.search);
	
	env.cross_domain_allowed = !location.protocol.match(/(http\:)|(file\:)/);
	
	
	if (typeof widget == 'object' && !widget.fake_widget){
		if ($.browser.opera){
			if (opera.extension){
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
	if (typeof chrome === 'object' && location.protocol == 'chrome-extension:'){
		if (location.pathname == '/index.html'){
			env.app_type = 'chrome_app';
			env.as_application = false;
			env.needs_url_history = true;
		} else{
			env.app_type = 'chrome_extension';
			env.as_application = true;
		}
		
	} else
	if (location.protocol.match(/http/)){
		
		if (window.parent != window && env.url.access_token && env.url.user_id){
			env.app_type = 'vkontakte';
			env.check_resize = true;
		} else{
			env.app_type = 'web_app';
		}
		env.as_application = false;
		env.needs_url_history = true;
		
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
		env.needs_url_history = true;
	}
	try{
		if (document.createEvent('TouchEvent')){
			env.touch_support = true;
		}
	} catch(e){}
	
	
	
	env.needs_url_history = false; //TEMP
	
	if (!env.app_type){
		env.app_type = 'unknown_app_type' + (navigator.userAgent && ': ' + navigator.userAgent);
		env.unknown_app_type = true;
	} else{
		env[env.app_type] = true;
	}
	
	
	
	if (env.touch_support){dstates.add_state('html_el', 'touch-screen');}
	if (env.as_application){
		
		dstates.add_state('html_el', 'as-application');
		dstates.remove_state('html_el', 'not-as-application');
	} else{
		dstates.add_state('html_el', 'not-as-application');
	}
	if (!env.unknown_app_type){dstates.add_state('html_el', env.app_type.replace('_','-'));}
	if (env.cross_domain_allowed) {dstates.add_state('html_el', 'cross-domain-allowed')}
	
	
	if (env.vkontakte){
		if (env.url.language === '0'){
			env.lang = 'ru';
		} else if (env.url.language === '3'){
			env.lang = 'en';
		} else{
			env.lang = (navigator.language || navigator.browserLanguage).slice(0,2).toLowerCase();
		}
	} else{
		env.lang = (navigator.language || navigator.browserLanguage).slice(0,2).toLowerCase();
	}
	
	if (env.check_resize){
		var detectSize = function(D){
			return Math.max(D.scrollHeight, D.offsetHeight, D.clientHeight);
		}
		var jz;
		env.readySteadyResize = function(D){
			if (jz){
				clearInterval(jz);
			}
			
			var oldsize = detectSize(D);
			jz = setInterval(function(){
				if (typeof documentScrollSizeChangeHandler == 'function'){
					var newsize = detectSize(D);
					
					if (oldsize != newsize){
						documentScrollSizeChangeHandler(oldsize = newsize);
					}
					
				}
			},100)
		}
		
		
	}
	
	
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