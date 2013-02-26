(function(w) {
	var ready = false;
	jsLoadComplete(function(){
		domReady(w.document, function(){
			big_timer.q.push([big_timer.base_category, 'ready-dom', big_timer.comp('page-start'), 'DOM loaded', 100]);
			ready = true;
		});
	});
	window.suReady = function(callback){
		if (ready){
			setTimeout(callback, 30);
		} else{
			jsLoadComplete(function(){
				domReady(w.document, callback);
			});
		}
		
	};
	
})(window);

var wrapRequest = function(request_params, options, complex_response){
	"strict";
	complex_response = complex_response || {};
	var deferred = $.Deferred();
	
	complex_response.abort = function(){
		this.aborted = true;
		deferred.reject('abort');
		if (this.queued){
			this.queued.abort();
		}
		if (this.xhr){
			this.xhr.abort();
		}
	};

	/*
		var options = {
			cache_ajax: cache_ajax
			nocache: false,
			cache_key: '',
			cache_namespace: 'string',
			requestFn
			not_save_cache
			manualSend: func,
			responseFn: func,
			queue
		}

	*/

	deferred.promise( complex_response );

	options.nocache = options.nocache || !options.cache_ajax;

	var cache_used;
	if (!options.nocache){
		cache_used = options.cache_ajax.get(options.cache_namespace, options.cache_key, function(r){
			deferred.resolve(r);
		});
		if (cache_used) {
			complex_response.cache_used = true;
			return {
				defer: deferred,
				complex: complex_response
			};
		}
	}

	if (!cache_used){
		var sucessFn = function(r) {
			if (options.responseFn){
				options.responseFn(r);
			}
			deferred.resolve.apply(deferred, arguments);
			if (!options.not_save_cache && options.cache_ajax){
				options.cache_ajax.set(options.cache_namespace, options.cache_key, r, options.cache_timeout);
			}
		};
		var sendRequest = function(){
			if (complex_response.aborted){
				return;
			}
			
			if (!options.manualSend){
				var cache_used;
				if (!options.nocache){
					cache_used = cache_ajax.get(options.cache_namespace, options.cache_key, function(r){
						deferred.resolve(r);
					});
				}
				if (!cache_used){

					var request;
					if (options.requestFn){
						request = options.requestFn(request_params);
					} else {
						request = $.ajax(request_params);
					}
					complex_response.xhr = request;
					request
						.fail(function(r){
							deferred.reject.apply(deferred, arguments);
						})
						.done(sucessFn);

					if (deferred.notify){
						deferred.notify('just-requested');
					}
				
					//console.log(params)
				}

			} else{
				options.manualSend(function(){
					deferred.resolve();
				});
			}
			
		};

		if (options.queue){
			complex_response.queued = options.queue.add(sendRequest, options.not_init_queue);
		} else{
			sendRequest();
		}
	}
	return {
		defer: deferred,
		complex: complex_response
	};

};


var tempTool = {
	loadPlaylist: function() {
		$.ajax({
			url: "playlist.txt",
			type: "text"
		}).done(function(r) {
			//var playlist = [];
			var title ="крым,карпаты 2012";

			var playlist = su.preparePlaylist({
				title: title,
				type: "cplaylist",
				data: {name: title}
			});

			var arr = r.split(/\n/);
			$.each(arr, function(i, el){
				if (el){
					var song = guessArtist(el);
					if (!song.artist){
						throw "Shhiii!";
					}
					playlist.add(song);
				}
			});
			playlist.showOnMap();
			dizi = playlist;
		});
	},
	downloadFile: function(url) {
		app_env.openURL(url);
		return;
		$(function() {
			var iframe = document.createElement("iframe");
			iframe.style.display = 'none';
			iframe.src = url;
			$(document.body).append(iframe);
		});
	}
};

var downloadFile = tempTool.downloadFile;




var Panoramator = function(){};
Panoramator.prototype = {
	constructor: Panoramator,
	init: function(opts){

		if (opts.onUseEnd){
			this.onUseEnd = opts.onUseEnd;
		}
		

		var _this = this;
		this.viewport = opts.viewport;
		this.viewport.on('mousedown', function(e){
			if (e.which && e.which != 1){
				return true;
			}
			e.preventDefault();
			_this.handleUserStart(e);
		});
		this.lift = opts.lift;
		this.ready_class_name = opts.ready_class_name || 'ready-to-use';
		this.lift_items = [];
		this.mouseMove = function(e){
			if (e.which && e.which != 1){
				return true;
			}
			_this.cursorMove(e);
		};
		this.mouseUp = function(e){
			if (e.which && e.which != 1){
				return true;
			}
			_this.handleUserEnd(e);
		};

	},
	limit_difficult: 3,
	mininmal_speed: 0.5,
	normal_speed: 0.7,
	standart_animation_time: 150,
	getMoveData: function(target_pos){
		if (target_pos > 0 || (this.total_width < this.viewport_width)){
			return {
				main: 0,
				above_limit: target_pos
			};
		} else {
			var allowed_length = this.total_width - this.viewport_width;
			if (-target_pos > allowed_length){
				return {
					main: -allowed_length,
					above_limit: allowed_length + target_pos
				};
			} else {
				return {
					main: target_pos,
					above_limit: 0
				};
			}
		}
	},
	cursorMove: function(e){
		//this.path_points
		this.path_points.push({
			cpos: e.pageX,
			time: e.timeStamp
		});
		

		var path_diff = this.path_points[0].cpos - e.pageX;
		var target_pos = -this.path_points.lift_pos -path_diff;
		var move_data = this.getMoveData(target_pos);

		
		//this.lift.stop();
		this.lift.css("margin-left", (move_data.main + move_data.above_limit/this.limit_difficult) + 'px');
		
	},
	checkVectorAndSpeed: function(){
		var first = this.path_points[0];
		var last = this.path_points[this.path_points.length-1];


		var travel = last.cpos - first.cpos;
		var speed = travel/(last.time - first.time);

		if (Math.abs(travel) > 5){
			if (Math.abs(speed) > this.mininmal_speed){
				if (speed > 0 ){
					return !this.prev(speed);
				} else {
					return !this.next(speed);
				}
			} else {

				return true;
			}
			//
			
			//with speed or not?

		} else {
			var all_path = 0;
			for (var i = 1; i < this.path_points.length; i++) {
				all_path += Math.abs(this.path_points[i].cpos - this.path_points[i-1].cpos);
			}
			if (all_path > 5){
			//	console.log(all_path)
				return true;
			} else {
				var vwpp = this.viewport.offset().left;
				var cur_pos = last.cpos - vwpp;
				cur_pos = this.viewport_width/2 - cur_pos;
				var center_factor = cur_pos * (1/(this.viewport_width/2));
				if (center_factor > 0){

					this.prev(false, 300 - 220 * Math.abs(center_factor));
				} else if (center_factor < 0) {
					this.next(false, 300 - 220 * Math.abs(center_factor));
				}
			//	console.log(center_factor);
				
			}

			//click or big gesture like circle?
			return true;
		}
	},
	handleUserEnd: function(e){

		var last_diff = this.path_points[0].cpos - this.path_points[this.path_points.length-1].cpos;
		var lift_target_pos = -this.path_points.lift_pos -last_diff;

		this.path_points.push({
			cpos: e.pageX,
			time: e.timeStamp
		});

		if (this.checkVectorAndSpeed()){
			var move_data = this.getMoveData(lift_target_pos);
			if (move_data.above_limit){
				this.lift.animate({
					"margin-left": move_data.main + 'px'
				}, this.standart_animation_time);
			}

		}


		$(this.viewport[0].ownerDocument)
			.off('mouseup', this.mouseUp)
			.off('mousemove', this.mouseMove);
		this.viewport.removeClass('touching-this');
		if (this.onUseEnd){
			this.onUseEnd();
		}
		//this.viewport
	},
	handleUserStart: function(e){
		
	
		this.lift.stop();
		this.path_points = [];
		this.path_points.lift_pos = this.getLiftPos();
		this.path_points.push({
			cpos: e.pageX,
			time: e.timeStamp
		});
		this.viewport.addClass('touching-this');
		$(this.viewport[0].ownerDocument)
			.on('mousemove', this.mouseMove)
			.on('mouseup', this.mouseUp);

	},
	setCollection: function(array){
		this.lift_items = array;
		this.checkSize();
        this.lift.addClass(this.ready_class_name);
	},
	checkSize: function(){
		this.total_width = this.getTotalWidth();
		this.lift.css({
            width: this.total_width + 'px'
        });
        this.viewport_width = this.viewport.width();
	},
	isEdgeElem: function(el, mobil_pos_shift, next) {
        var cur = $(el);

        var position = cur.position().left;
        var width = cur.outerWidth();


        if ( next ? ((position + width) > (this.viewport_width + mobil_pos_shift)) : (position < mobil_pos_shift)){
            return {
                el: cur,
                left: position,
                owidth: width
            };
        }
    },
    getTargetPos: function(last_visible, next) {
        var pos = -last_visible.left + (this.viewport_width - last_visible.owidth)/2;
        return next ? Math.max(pos, -(this.total_width - this.viewport_width)) : Math.min(pos, 0);
    },
    getLiftPos: function(){
		return -parseFloat(this.lift.css("margin-left")) || 0;
    },
    getTotalWidth: function() {
        var width = 0;
        $.each(this.lift_items, function(i ,el) {
            width += $(el).outerWidth(true);
        });
        return width;
    },
    toStart: function(){

    },
    toEnd: function(){

    },
    getNextEdgeElem: function(lift_pos){
		var last_visible;

        for (var i = 0; i < this.lift_items.length; i++) {

            last_visible = this.isEdgeElem(this.lift_items[i], lift_pos, true);
            if (last_visible){
                break;
            }

        }
        return last_visible;
    },
    getPrevEdgeElem: function(lift_pos){
		var last_visible;

        for (var i = this.lift_items.length - 1; i >= 0; i--) {
            last_visible = this.isEdgeElem(this.lift_items[i], lift_pos);
            if (last_visible){
                break;
            }
        }
        return last_visible;
    },
    getAnimationTime: function(target_pos, lift_pos, speed){
		return  ( target_pos - lift_pos )/(speed * 1.5);
    },
    next: function(speed, time){
		this.lift.stop(false, true);
		var lift_pos = this.getLiftPos();
		var last_visible = this.getNextEdgeElem(lift_pos);
       
        if (last_visible){
			var target_pos = this.getTargetPos(last_visible, true);
            this.lift.animate({
                "margin-left": target_pos + 'px'
            },  speed ? this.getAnimationTime(target_pos, -lift_pos, speed) :  (time || this.standart_animation_time));
			return true;
        } else {
			return false;
        }

        
	},
	prev: function(speed, time){
		this.lift.stop(false, true);
		var lift_pos = this.getLiftPos();
		var last_visible = this.getPrevEdgeElem(lift_pos);
        
        if (last_visible){
			var target_pos = this.getTargetPos(last_visible);
            this.lift.animate({
                "margin-left": target_pos + 'px'
            }, speed ? this.getAnimationTime(target_pos, -lift_pos, speed) :  (time || this.standart_animation_time));
            return true;

        } else {
			return false;
        }
        
	}

};


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
var loadImage = function(opts) {
	

	//queue
	var node = opts.node || new Image();
	var deferred = $.Deferred();

	var unbindEvents = function() {
		removeEvent(node, "load", loadCb);
		removeEvent(node, "error", errorCb);
	};
	var loadCb = function() {
		deferred.resolve(node);
		unbindEvents();
	};
	var errorCb = function() {
		deferred.reject(node);
		unbindEvents();
	};

	var async_obj = deferred.promise({
		abort: function() {
			delete node.src;
			if (this.queued){
				this.queued.abort();
			}
			unbindEvents();
		}
	});


	addEvent(node, "load", loadCb);
	addEvent(node, "error", errorCb);
	if (opts.timeout){
		setTimeout(function() {
			deferred.reject(node, 'timeout');
			unbindEvents();
		}, opts.timeout);
	}

	var completeLoad = function() {
		node.src = opts.url;
		if (node.complete){
			if (opts.cache_allowed){
				loaded_images[opts.url] = true;
			}
			deferred.resolve(node);
			unbindEvents();
		}
	};
	if (opts.queue && !loaded_images[opts.url]){
		async_obj.queued = opts.queue.add(completeLoad);
		
	} else {
		completeLoad();
	}
	
	
	return async_obj;
};

var getInternetConnectionStatus = function(cb) {
	var img = new Image();
	img.onload = function() {
		cb(true);
	};
	img.onerror = function() {
		cb(false);
	};
	img.src = "http://www.google-analytics.com/__utm.gif?" + Math.random() + new Date();
};
var async_script_support = "async" in document.createElement("script");
var xhr2_support = window.XMLHttpRequest && "withCredentials" in (new XMLHttpRequest());  //https://gist.github.com/1431660
var aReq = function(options){
	if (options.dataType != "jsonp"){
		return $.ajax(options);
	} else if (xhr2_support && options.thisOriginAllowed) {
		options.dataType = "json";
		options.crossDomain = true;
		if (options.afterChange){
			options.afterChange(options);
		}
		return $.ajax(options);
	} else {
		var
			img,
			script,
			callback_func_name,
			script_load_timeout,
			deferred			= $.Deferred(),
			cancelLoad = function() {
				if (img){
					img.src = null;
					unbindImage();
				}
				if (script){
					script.src = null;
				}
				if (callback_func_name && window[callback_func_name]){
					window[callback_func_name] = $.noop();
				}
			},
			complex_response	= {
				abort: function(){
					this.aborted = true;
					cancelLoad();
					

				}
			};
		deferred.promise( complex_response );
		
		var timeout = options.timeout || ($.ajaxSettings && $.ajaxSettings.timeout);
		if (timeout){
			script_load_timeout = setTimeout(function() {
				deferred.reject();
			}, timeout);
		}

		var params = {};
		$.extend(params, options.data || {});

		var callback_param_name = options.callback || "callback";

		if (!options.jsonpCallback && !params[callback_param_name]){
			callback_func_name = create_jsonp_callback(function(r){
				if (script_load_timeout){
					clearTimeout(script_load_timeout);
				}
				
				
				deferred.resolve(r);
			});
			params[callback_param_name] = callback_func_name;
		}


		var params_url = $.param(params);
		var full_url = (options.url || "") + (params_url ? "?" + params_url : "");

		

		
		var done;
		var loadScript = function(){
			script = document.createElement("script");
			script.async = true;
			script.onload = function(){
				//document.documentElement.firstChild.removeChild(script);
				

				
			};
			script.onerror = function(){
				deferred.reject();
			};
			script.src = full_url;
			document.documentElement.firstChild.insertBefore(script, document.documentElement.firstChild.firstChild);
		};


		var unbindImage = function(){
			img.onload = null;
			img.onerror = null;
		};
		if (async_script_support){
			loadScript();
		} else if (options.resourceCachingAvailable){
			img = document.createElement("img");
			var completeImage = function(){
				if (!done){
					done = true;
					loadScript();
				}
			};

			img.src = full_url;
			
			if (img.complete){
				setTimeout(completeImage,0);
			} else {
				img.onload = completeImage;
				img.onerror = completeImage;
			}
		} else {
			loadScript();
		}
			
		
		
		return complex_response;
		
	}
};

var getHTMLText = function(text) {
	var safe_node = document.createElement('div');
	safe_node.innerHTML = text;
	return $(safe_node).text();

};

var changeFavicon = function(d, src, type) {
	var link = d.createElement('link'),
		oldLink = d.getElementById('dynamic-favicon');
	link.id = 'dynamic-favicon';
	link.rel = 'shortcut icon';
	if (type){
		link.type = type;
	}
	
	link.href = src;
	if (oldLink) {
		d.head.removeChild(oldLink);
	}
	d.head.appendChild(link);
};

var abortage = {
	addDependent: function(dependent) {
		this.dep_objs = this.dep_objs || [];
		this.dep_objs.push(dependent);
	},
	canAbort: function(dependent) {
		if (!this.dep_objs){
			return true;
		} else {
			if (!this.dep_objs.length){
				return true;
			} else {
				this.dep_objs = arrayExclude(this.dep_objs, dependent);
				return !this.dep_objs.length;
			}
		}
	}
};



(function(){
	var jsonp_counter = 0;
	window.create_jsonp_callback = function(func){
		var func_name = 'jspc_' + (++jsonp_counter);
		window[func_name] = func;
		
		
		
		return func_name;
	};
})();
function getSomething(array){
	return array[(Math.random()*(array.length-1)).toFixed(0)];
}


var addClass = function(old_c, cl){
	
	var add_c = cl.split(' ');
	var new_c = old_c;
	for (var i=0; i < add_c.length; i++) {
		var re = new RegExp("(^|\\s)" + add_c[i] + "(\\s|$)", "g");
		if (!old_c.match(re)){
			var b = (" " + add_c[i]);
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
var document_states = function(d){
	this.ui = {
		d: d
	};
	this.html_el_state= d.documentElement.className || '';

};
document_states.prototype = {
	add_state: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = addClass(this.html_el_state, state);
			if (this.dub) {
				this.dub.documentElement.className = this.html_el_state;
			}
			
		}
	},
	toggleState: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = toggleClass(this.html_el_state, state);
			if (this.dub) {
				this.dub.documentElement.className  = this.html_el_state;
			}
			
		}
	},
	remove_state: function(state_of, state){
		if (state_of == 'html_el'){
			this.html_el_state = removeClass(this.html_el_state, state);
			if (this.dub) {
				this.dub.documentElement.className  = this.html_el_state;
			}
			
		}
	},
	connect_ui: function(dub){
		if (dub.documentElement){
			dub.documentElement.className =  this.html_el_state;
		}
		this.dub = dub;
	//	this.ui = ui;
	}
};

window.dstates = new document_states(window.document);


function get_url_parameters(str, decode_uri_c){
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
}

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

window.app_env = (function(wd){

	var bro = detectBrowser();

	var env = {
		bro: bro
	};
	env.url = get_url_parameters(wd.location.search, true);
	
	env.cross_domain_allowed = !wd.location.protocol.match(/(http\:)|(file\:)/);
	env.xhr2 = !!xhr2_support;
	
	if (typeof widget == 'object' && !widget.fake_widget){
		if (bro.browser == 'opera'){
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
	if (typeof chrome === 'object' && wd.location.protocol == 'chrome-extension:'){
		if (wd.location.pathname == '/index.html'){
			env.app_type = 'chrome_app';
			env.as_application = false;
			env.needs_url_history = true;
			env.need_favicon = true;
		} else{
			env.app_type = 'chrome_extension';
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
	
	
	if (env.touch_support){dstates.add_state('html_el', 'touch-screen');}
	if (env.as_application){
		
		dstates.add_state('html_el', 'as-application');
		dstates.remove_state('html_el', 'not-as-application');
	} else{
		dstates.add_state('html_el', 'not-as-application');
	}
	if (!env.unknown_app_type){dstates.add_state('html_el', env.app_type.replace('_','-'));}
	if (env.cross_domain_allowed) {dstates.add_state('html_el', 'cross-domain-allowed');}
	
	
	if (env.vkontakte){
		if (env.url.language === '0'){
			env.lang = 'ru';
		} else if (env.url.language === '3'){
			env.lang = 'en';
		} else{
			env.lang = (wd.navigator.language || wd.navigator.browserLanguage).slice(0,2).toLowerCase();
		}
	} else{
		env.lang = (wd.navigator.language || wd.navigator.browserLanguage).slice(0,2).toLowerCase();
	}
	
	
	
	
	return env;
})(window);
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
	window.suStore = function(key, value, opts){
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
	window.getPreloadedNK = function(key){
		if (app_env.pokki_app){
			var rv = pokki.getScrambled(key);
			if (rv){
				return rv;
			}
		}
		var nk = suStore('preloaded_nk');
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



// Forcing Opera full page reflow/repaint to fix page draw bugs
var forceOperaRepaint = function() {
	if (window.opera) {
		var bs = window.document.body.style;
		bs.position = 'relative';
		setTimeout(function() {
			bs.position = 'static';
		}, 1);
	}
};




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


var handleDocument = function(d, tracking_opts) {
	/*
	jsLoadComplete({
		test: function() {

		},
		fn: function() {
			if (window.resizeWindow && d){
				var dw = getDefaultView(d);
				if (dw && dw.window_resized){
					resizeWindow(dw);
				}
				
			}
		};
	});*/
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

	domReady(d, function() {
		dstates.connect_ui(d);
	});
	

	jsLoadComplete({
		test: function() {
			return window.localizer;
		},
		fn: function() {
			domReady(d, function() {
				d.head = d.head || d.getElementsByTagName('head')[0];

				var emptyNode = function(node) {
					while (node.firstChild){
						node.removeChild( node.firstChild );
					}
					return node;
				};

				var lang = app_env.lang;

				var nodes_array = d.getElementsByClassName('lang');
				var translate = function(el) {
					var cn = el.className;
					var classes = cn.split(/\s/);
					for (var i = 0; i < classes.length; i++) {
						var cl = classes[i];
						if (cl.match(/localize/)){
							var term = localizer[cl.replace('localize-','')];
							if (term && term[lang]){
								emptyNode(el).appendChild(d.createTextNode(term[lang]));
								//$(el).text();
								break;
							}
						}
					}
				};
				for (var i = 0; i < nodes_array.length; i++) {
					translate(nodes_array[i]);
				}
			});
		}
	});
	/*
	jsLoadComplete({
		test: function() {
			return window.connect_dom_to_som && window.jQuery;
		},
		fn: function() {
			connect_dom_to_som(d, function(opts) {
				big_timer.q.push([tracking_opts.category, 'ready-som', big_timer.comp(tracking_opts.start_time), 'SeesuOM loaded', 100]);
				dom_opts = opts;
				tryComplete();
			});
		}
	});*/
	/*
	jsLoadComplete({
		test: function() {
			return window.su && window.seesu_ui;
		},
		fn: function() {
			return;
			var g = new seesu_ui(d, true);
			//su.setUI(g);
			ui = g;
			big_timer.q.push([tracking_opts.category, 'created-sui', big_timer.comp(tracking_opts.start_time), 'new seesu ui created', 100]);
			tryComplete();
		}
	});
	*/
};

sviga = {};
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












/*

jsLoadComplete(function() {
	yepnope({
		load: [ 'CSSOM/spec/utils.js', 'CSSOM/src/loader.js'],
		complete: function() {
			console.log('ddddd')
		}
	});
});

*/





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
		var result = [];
		var parsed_rule = {};
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
						var real_val = parseFloat(cur_val.replace('px'));
						if (real_val){
							new_values[j] = getRemUnitValue(real_val, root_font_size);
						} else {
							new_values[j] = 0;
						}
						
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

		var iterating_rules = [].concat(Array.prototype.slice.call(sheet.cssRules));
		while (iterating_rules.length){
			var cur = iterating_rules.shift();
			if (cur.cssRules){
				iterating_rules = [].concat(Array.prototype.slice.call(cur.cssRules), iterating_rules);
			} else {
				simple_rules.push(cur);
			}
		}
		return simple_rules;
	};
	app_env.getSimpleCSSRules = getSimpleRules;

	var createStyleSheet = function(href, sheet_string, root_font_size, string) {
		sheet = CSSOM.parse(sheet_string);
		href = href || sheet.href;
		if (href.indexOf('sizes.css') != -1){
			return '';
		}
		var pos_shift = 0;

		var big_result = sheet_string;


	//	var big_string = '/* path: ' + href.replace(location.origin, '') + '*/\n';
		var simple_rules = getSimpleRules(sheet);


		/*
		simple_rules.sort(function(a, b){
			return sortByRules(a, b, [''])
		});*/

		var complects = [];
		for (var i = 0; i < simple_rules.length; i++) {
			var cur = simple_rules[i];
			//cur.selectorText
			if (cur.style && cur.style.cssText.indexOf('px') != -1){
				var rulll = culculateRemRule(cur, root_font_size);

				var sel_prev_text = sheet_string.slice(0, rulll.rule_start);

				var sel_tabs = sel_prev_text.match(/\t+(?:$)/gi);
				var sel_tabs_count = sel_tabs && sel_tabs[0].length || 0;
				//sel_tabs_count += 1;
				
			//	console.log(sel_tabs_count);
				complects.push(rulll);
				if (rulll.px_props.length){
					rulll.full_string = '\n' +
						getTabs(sel_tabs_count) + rulll.stretch_selector + '{\n' +
						getTabs(sel_tabs_count + 1) + '/* rem hack */\n' +
						getRulesString(rulll.px_props, sel_tabs_count + 1) +
						getTabs(sel_tabs_count + 1) + '}\n';


					var rules_string = '\n' +
						getTabs(sel_tabs_count + 1) + '/* rem hack */\n' +
						getRulesString(rulll.px_props, sel_tabs_count + 1);

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
	global.checkPX = function(url) {
		var complects = [];

	
		var root_font_size = $(document.documentElement).css('font-size');
		root_font_size = parseFloat(root_font_size.replace('px'));


		var big_string = '';


		var requests = [];

		$.ajax({
			url: url
		})
		.done(function(r) {
			var test = createStyleSheet(url, r, root_font_size, true);
			window.open('data:text/plain;base64,' + btoa(test));
		});
		
		return big_string;

	};

	var replaceSVGHImage = function(rule, style){

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

		$.ajax({
			url: structure.file,
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
			
			var xml_text = new XMLSerializer().serializeToString(r);

			var bg_image_string = 'url(\'data:image/svg+xml;base64,' + btoa(xml_text) + '\')';

			var new_rule_text = '\n' +
				rule.selectorText +
				' {\n' + 'background-image:' + bg_image_string +
				';\n}';



			$(style).append(document.createTextNode(new_rule_text));

			
			
		});
		//var target
	};


	jsLoadComplete(function(){
		domReady(window.document, function(){
			
			var big_list = [];
			for (var i = 0; i < document.styleSheets.length; i++) {
				big_list = big_list.concat(getSimpleRules(document.styleSheets[i]));
				
			}
			var svg_hacked = $filter(big_list, 'style.backgroundImage', function(value){
				return value && value.indexOf('data:text/plain;utf8,svg-hack,') !== -1;
			});
			var style = document.createElement('style');
			$(document.documentElement.firstChild).append(style);
			//console.log(svg_hacked);
			$.each(svg_hacked, function(i, el){
				replaceSVGHImage(el, style);
			});

		});
	});
	
	
	
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
var parseArtistInfo = function(r){
	var ai = {};
	if (r && r.artist){
		var info = r.artist;

		
		ai.artist = getTargetField(info, 'name');
		ai.bio = (ai.bio = getTargetField(info, 'bio.summary')) && ai.bio.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
		ai.similars = (ai.similars = getTargetField(info, 'similar.artist')) && toRealArray(ai.similars);
		ai.tags = (ai.tags = getTargetField(info, 'tags.tag')) && toRealArray(ai.tags);
		ai.images = (ai.images = getTargetField(info, 'image')) && (ai.images = toRealArray(ai.images)) && $filter(ai.images, '#text');

	}
	return ai;
};