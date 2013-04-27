var PageView = function() {};
provoda.View.extendTo(PageView, {
	'stch-mp_show': function(state) {
		this.c.toggleClass('hidden', !state);
	},
	createBase: function() {
		this.c = $('<div class="usual_page"></div>');
	}
});


var contextRow = function(container){
	this.m = {
		c: container.addClass('hidden'),
		active: false
	};
	this.arrow = container.children('.rc-arrow');
	this.parts = {};
	
};
contextRow.prototype = {
	getC: function(){
		return this.m.c;
	},
	addPart: function(cpart, name){
		if (name){
			this.parts[name] = {
				c: cpart.addClass('hidden'),
				d:{},
				active: false
			};
		}
		
	},
	C: function(name){
		return this.parts[name] && this.parts[name].c;
	},
	D: function(name, key, value){
		if (name && this.parts[name]){
			if (typeof value != 'undefined' && key){
				return this.parts[name].d[key] = value;
			} else if (key){
				return this.parts[name].d[key];
			}
		}
		
	},
	isActive: function(name){
		return !!this.parts[name].active;
	},
	showPart: function(name, posFn, callback){
		

		if (!this.parts[name].active){

			this.hide(true);
		
		
			this.parts[name].c.removeClass('hidden');
			this.parts[name].active = true;
			
			
			if (!this.m.active){
				this.m.c.removeClass('hidden');
				this.m.active = true;
			}
			
		}
		if (posFn){
			//used for positioning
			this.arrow.removeClass('hidden');
			var pos = posFn();
			var arrow_papos = this.arrow.offsetParent().offset();

			//.removeClass('hidden');
			this.arrow.css('left', ((pos.left + pos.owidth/2) - arrow_papos.left) + 'px');
			
		}
		
	},
	hide: function(not_itself, skip_arrow){
		if (!not_itself){
			if (this.m.active){
				this.m.c.addClass('hidden');
				this.m.active = false;
			}
			
		}
		
		for (var a in this.parts){
			if (this.parts[a].active){
				this.parts[a].c.addClass('hidden');
				this.parts[a].active = false;
			}
			
		}
		if (!skip_arrow){
			this.arrow.addClass('hidden');
		}
		
		
		
	}
};


var AuthBlockView = function() {};
provoda.View.extendTo(AuthBlockView, {

});

var VkLoginUI = function() {};

provoda.View.extendTo(VkLoginUI, {
	state_change: {
		'data_wait': function(state) {
			if (state){
				this.c.addClass("waiting-auth");
			} else {
				this.c.removeClass("waiting-auth");
			}
		},
		"request_description": function(state) {
			this.login_desc.text(state || "");
		},
		'deep-sandbox': function(state) {
			this.c.toggleClass('deep-sandbox', !!state);
		}
	},

	'stch-has_notify_closer': function(state) {
		this.c.toggleClass('has_notify_closer', !!state);
	},
	'stch-notify_readed': function(state) {
		this.c.toggleClass('notf-readed', !!state);
	},
	'stch-has_session': function(state){
		if (!state){
			this.c.removeClass("hidden");
		} else {
			this.c.addClass("hidden");
		}
	},
	createBase: function() {
		this.c = this.root_view.getSample('vklc');
		var _this = this;
		var sign_link = this.c.find('.sign-in-to-vk').click(function(e){
			_this.RPCLegacy('requestAuth');
			e.preventDefault();
		});
		this.login_desc = this.c.find('.login-request-desc');
		this.addWayPoint(sign_link, {
			canUse: function() {

			}
		});
		var input = this.c.find('.vk-code');
		var use_code_button = this.c.find('.use-vk-code').click(function() {
			var vk_t_raw = input.val();
			if (vk_t_raw){
				var vk_token = new vkTokenAuth(su.vkappid, vk_t_raw);

				su.vk_auth.api = su.connectVKApi(vk_token, true);
				su.vk_auth.trigger('full-ready', true);
					
			}
		});
		this.addWayPoint(input, {
			canUse: function() {

			}
		});
		this.c.find('.notify-closer').click(function() {
			_this.RPCLegacy('removeNotifyMark');
		});

	}
});


var LfmLoginView = function() {};

provoda.View.extendTo(LfmLoginView, {
	'stch-has_session': function(state){
		if (!state){
			this.c.removeClass("hidden");
		} else {
			this.c.addClass("hidden");
		}
	},
	'stch-deep-sandbox': function(state){
		this.c.toggleClass('deep-sandbox', !!state);
	},
	'stch-data_wait': function(state) {
		if (state){
			this.c.addClass("waiting-auth");
		} else {
			this.c.removeClass("waiting-auth");
		}
	},
	'stch-request_description': function(state) {
		this.c.find('.lfm-auth-request-desc').text(state || "");
	},
	createBase: function() {
		this.c = this.root_view.getSample('lfm_authsampl');
		this.auth_block = this.c.children(".auth-block");
		var _this = this;
		var auth_link = this.auth_block.find('.lastfm-auth-bp a').click(function(e){
			_this.RPCLegacy('requestAuth');
			e.preventDefault();
		});
		this.addWayPoint(auth_link);
		this.code_input = this.auth_block.find('.lfm-code');
		var use_code_button = this.auth_block.find('.use-lfm-code').click(function(){
			var value = _this.code_input.val();
			if (value){
				_this.RPCLegacy('useCode', value);
			}
			return false;
		});
		this.addWayPoint(use_code_button);
	}
});

var LfmLoveItView = function() {};
LfmLoginView.extendTo(LfmLoveItView, {
	createBase: function() {
		this._super();
		var _this = this;
		var wrap = $('<div class="add-to-lfmfav"></div>');

		this.nloveb = this.root_view.createNiceButton();
		this.nloveb.c.appendTo(wrap);
		this.nloveb.b.click(function(){
			if (_this.nloveb._enabled){
				_this.RPCLegacy('makeLove');
			}
		});
		this.addWayPoint(this.nloveb.b);
		this.nloveb.b.text(localize('addto-lfm-favs'));
		this.c.append(wrap);
		
	
	},
	"stch-has_session": function(state) {
		state = !!state;
		this.c.toggleClass('has_session', state);
		this.auth_block.toggleClass('hidden', state);
		this.nloveb.toggle(state);
	},
	"stch-wait_love_done": function(state){
		this.c.toggleClass('wait_love_done', !!state);
	}
});


var LfmScrobbleView = function(){};
LfmLoginView.extendTo(LfmScrobbleView, {
	createBase: function(){
		this._super();
		this.scrobbling_switchers = this.root_view.getSample('lfm_scrobling').appendTo(this.c);
		this.chbx_enabl = this.scrobbling_switchers.find('.enable-scrobbling');
		this.chbx_disabl = this.scrobbling_switchers.find('.disable-scrobbling');
		var _this = this;
		

		this.chbx_enabl.click(function() {
			_this.RPCLegacy('setScrobbling', true);
		});
		this.chbx_disabl.click(function() {
			_this.RPCLegacy('setScrobbling', false);
		});
		this.addWayPoint(this.chbx_enabl, {
			
		});
		this.addWayPoint(this.chbx_disabl, {
			
		});
	},
	"stch-has_session": function(state) {
		state = !!state;
		this.c.toggleClass('has_session', state);
		this.auth_block.toggleClass('hidden', state);
		this.chbx_enabl.add(this.chbx_disabl).prop('disabled', !state);
	},
	"stch-scrobbling": function(state) {
		this.chbx_enabl.prop('checked', !!state);
		this.chbx_disabl.prop('checked', !state);
	}
});


var fileInTorrentUI = function() {};
provoda.View.extendTo(fileInTorrentUI,{
	state_change: {
		"download-pressed": function(state) {
			if (state){
				this.downloadlink.addClass('download-pressed');
			}
		},
		overstock: function(state) {
			if (state){
				this.c.addClass('overstocked');
			} else {
				this.c.removeClass('overstocked');
			}
		},
		'full_title': function(state) {
			this.f_text.text(state);

		},
		'torrent_link': function(state) {
			this.downloadlink.attr('href', state);
		}
	},
	createBase: function() {
		var _this = this;
		this.c = $('<li></li>');


		$('<span class="play-button-place"></span>').appendTo(this.c);
		

		var pg = $('<span class="mf-progress"></span>');
		this.f_text = $('<span class="mf-text"></span>').appendTo(pg);

		this.downloadlink = $('<a class="external download-song-link"></a>').click(function(e) {
			e.stopPropagation();
			e.preventDefault();
			_this.RPCLegacy('download');
		}).text('torrent').appendTo(this.c);

		this.addWayPoint(this.downloadlink, {
			
		});

		pg.appendTo(this.c);

	}
});
var songFileModelUI = function() {};
provoda.View.extendTo(songFileModelUI, {
	dom_rp: true,
	createDetailes: function(){
		this.createBase();

		var _this = this;

		var mf_cor_view = this.parent_view.parent_view;
		mf_cor_view.on('state-change.want_more_songs', function(e){
			_this.setVisState('pp-wmss', !!e.value);
		});

		this.parent_view
			.on('state-change.show_overstocked', function(e) {
				_this.setVisState('p-show-ovst', e.value);
			});


		//var song_view = mf_cor_view.parent_view;
		mf_cor_view.on('state-change.vis_is_visible', function(e){
			_this.setVisState('is_visible', !!e.value);
		});
		/*
		song_view.on('state-change.mp_show_end', function(e){
			_this.setVisState('is_visible', !!e.value);
		});*/

	},
	complex_states: {
		'visible_duration_text': {
			depends_on: ['visible_duration'],
			fn: function(state) {
				if (state){
					var duration = Math.floor(state/1000);
					if (duration){
						var digits = duration % 60;
						return (Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+ digits : digits );
					}
				}
			}
		},
		"can-progress": {
			depends_on: ['vis_is_visible', 'vis_con-appended', 'selected'],
			fn: function(vis, apd, sel){
				var can = vis && apd && sel;
				if (can){
					var _this = this;

					$(window).off('resize.song_file_progress');
					$(window).on('resize.song_file_progress', spv.debounce(function(e){
						_this.setVisState('win-resize-time', e.timeStamp);
					}, 100));
				}
				return can;
			}
		},
		'vis_wp_usable': {
			depends_on: ['overstock', 'vis_pp-wmss', 'vis_p-show-ovst'],
			fn: function(overstock, pp_wmss, p_show_overstock) {

				if (overstock){
					return pp_wmss && p_show_overstock;
				} else {
					return pp_wmss;
				}

			}
		},
		"vis_progress-c-width": {
			depends_on: ['can-progress', 'vis_pp-wmss', 'vis_win-resize-time'],
			fn: function(can, p_wmss, wrsz_time){
				if (can){
					return this.tpl.ancs['progress_c'].width();
				} else {
					return 0;
				}
			}
		},
		"vis_loading_p": {
			depends_on: ['vis_progress-c-width', 'loading_progress'],
			fn: function(width, factor){
				if (factor) {
					if (width){
						return Math.floor(factor * width) + 'px';
					} else {
						return (factor * 100) + '%';
					}
				} else {
					return 'auto';
				}
			}
		},
		"vis_playing_p": {
			depends_on: ['vis_progress-c-width', 'playing_progress'],
			fn: function(width, factor){
				if (factor) {
					if (width){
						return Math.floor(factor * width) + 'px';
					} else {
						return (factor * 100) + '%';
					}
				} else {
					return 'auto';
				}
			}
		}
	},
	createBase: function() {
		var node = this.root_view.getSample('song-file');
		this.useBase(node);

		var progress_c = this.tpl.ancs['progress_c'];

		var _this = this;

		var path_points;
		var positionChange = function(){
			var last = path_points[path_points.length - 1];

			var width = _this.state('vis_progress-c-width');

			if (!width){
				console.log("no width for pb :!((");
			}
			if (width){
				_this.RPCLegacy('setPositionByFactor', [last.cpos, width]);
			}
		};
		var getClickPosition = function(e, node){
			//e.offsetX ||
			var pos = e.pageX - $(node).offset().left;
			return pos;
		};

		var touchDown = function(e){
			path_points = [];
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, progress_c[0]), time: e.timeStamp});
			positionChange();
		};
		var touchMove = function(e){
			if (!_this.state('selected')){
				return true;
			}
			if (e.which && e.which != 1){
				return true;
			}
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, progress_c[0]), time: e.timeStamp});
			positionChange();
		};
		var touchUp = function(e){
			if (!_this.state('selected')){
				return true;
			}
			if (e.which && e.which != 1){
				return true;
			}
			$(progress_c[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			var travel;
			if (!travel){
				//
			}


			path_points = null;

		};
		progress_c.on('mousedown', function(e){

			$(progress_c[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			if (!_this.state('selected')){
				return true;
			}
			if (e.which && e.which != 1){
				return true;
			}

			$(progress_c[0].ownerDocument)
				.on('mouseup', touchUp)
				.on('mousemove', touchMove);

			touchDown(e);

		});

	},
	tpl_events: {
		'selectFile': function(e) {
			if (!this.state('selected')){
				this.RPCLegacy('trigger', 'want-to-play-sf');
			}
		},
		'switchPlay': function(e) {
			var _this = this;
			e.stopPropagation();
			if (_this.state('selected')){

				if (_this.state('play') == 'play'){
					_this.RPCLegacy('pause');
				} else {
					_this.RPCLegacy('trigger', 'want-to-play-sf');
					//_this.RPCLegacy('play');
				}
			} else {
				_this.RPCLegacy('trigger', 'want-to-play-sf');
			}
		}
	}
});



