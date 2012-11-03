var vkLoginUI = function() {};

provoda.View.extendTo(vkLoginUI, {
	createDetailes: function(){
		this.createBase();
	},
	state_change: {
		wait: function(state) {
			if (state){
				this.c.addClass("waiting-vk-login");
			} else {
				this.c.removeClass("waiting-vk-login");
			}
		},
		"request-description": function(state) {
			this.c.find('.login-request-desc').text(state || "");
		}
	},
	createBase: function() {
		this.c = this.root_view.samples.vklc.clone();
		var _this = this;
		var sign_link = this.c.find('.sign-in-to-vk').click(function(e){
			_this.md.requestAuth();
			e.preventDefault();
		});
		this.addWayPoint(sign_link);
		var input = this.c.find('.vk-code');
		var use_code_button = this.c.find('.use-vk-code').click(function() {
			var vk_t_raw = input.val();
			if (vk_t_raw){
				var vk_token = new vkTokenAuth(su.vkappid, vk_t_raw);			
					connectApiToSeesu(vk_token, true);
			}
		});
		this.addWayPoint(this.addWayPoint);

	}
});


var LfmLoginView = function() {};

provoda.View.extendTo(LfmLoginView, {
	createDetailes: function(){
		this.createBase();
	},
	'stch-active': function(state){
		if (state){
			this.c.removeClass("hidden");
		} else {
			this.c.addClass("hidden");
		}
	},
	'stch-deep-sanbdox': function(state){
		if (state){
			this.c.addClass("deep-sandbox");
		} else {
			this.c.removeClass("deep-sandbox");
		}
	},
	'stch-wait': function(state) {
		if (state){
			this.c.addClass("waiting-lfm-auth");
		} else {
			this.c.removeClass("waiting-lfm-auth");
		}
	},
	'stch-request-description': function(state) {
		this.c.find('.lfm-auth-request-desc').text(state || "");
	},
	createBase: function() {
		this.c = this.root_view.samples.lfm_authsampl.clone();
		this.auth_block = this.c.children(".auth-block");
		var _this = this;
		var auth_link = this.auth_block.find('.lastfm-auth-bp a').click(function(e){
			_this.md.requestAuth();
			e.preventDefault();
		});
		this.addWayPoint(auth_link);
		this.code_input = this.auth_block.find('.lfm-code');
		var use_code_button = this.auth_block.find('.use-lfm-code').click(function(){
			var value = _this.code_input.val();
			if (value){
				_this.md.useCode(value)
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
				_this.md.makeLove();
			}
		});
		this.addWayPoint(this.nloveb.b);
		this.nloveb.b.text(localize('addto-lfm-favs'));
		this.c.append(wrap);
		
	
	},
	"stch-has-session": function(state) {
		state = !!state;
		this.c.toggleClass('has-session', state);
		this.auth_block.toggleClass('hidden', state);
		this.nloveb.toggle(state);
	},
	"stch-wait-love-done": function(state){
		this.c.toggleClass('wait-love-done', !!state);
	}
});


var LfmScrobbleView = function(){};
LfmLoginView.extendTo(LfmScrobbleView, {
	createBase: function(){
		this._super();
		this.scrobbling_switchers = this.root_view.samples.lfm_scrobling.clone().appendTo(this.c);
		this.chbx_enabl = this.scrobbling_switchers.find('.enable-scrobbling');
		this.chbx_disabl = this.scrobbling_switchers.find('.disable-scrobbling');
		var _this = this;
		

		this.chbx_enabl.click(function() {
			_this.md.setScrobbling(true);
		});
		this.chbx_disabl.click(function() {
			_this.md.setScrobbling(false);
		});
		this.addWayPoint(this.chbx_enabl);
		this.addWayPoint(this.chbx_disabl);
	},
	"stch-has-session": function(state) {
		if (state){
			this.c.addClass('has-session');
			this.auth_block.addClass('hidden');
			this.chbx_enabl.add(this.chbx_disabl).removeProp('disabled');
		} else {
			this.c.removeClass('has-session');
			this.auth_block.removeClass('hidden');
			this.chbx_enabl.add(this.chbx_disabl).prop('disabled', true);
		}
	},
	"stch-scrobbling": function(state) {
		this.chbx_enabl.prop('checked', !!state);
		this.chbx_disabl.prop('checked', !state);
	}
});


var fileInTorrentUI = function() {};
provoda.View.extendTo(fileInTorrentUI,{
	createDetailes: function(){
		this.createBase();
	},
	state_change: {
		"download-pressed": function(state) {
			if (state){
				this.downloadlink.addClass('download-pressed')
			}
		},
		overstock: function(state) {
			if (state){
				this.c.addClass('overstocked');
			} else {
				this.c.removeClass('overstocked');
			}
		}
	},
	createBase: function() {
		var _this = this;
		this.c = $('<li></li>');


		$('<span class="play-button-place"></span>').appendTo(this.c)
		

		var pg = $('<span class="mf-progress"></span>')
		var f_text = $('<span class="mf-text"></span>').text(this.md.sr_item.title || getHTMLText(this.md.sr_item.HTMLTitle)).appendTo(pg);

		this.downloadlink = $('<a class="external download-song-link"></a>').click(function(e) {
			e.stopPropagation();
			e.preventDefault();
			_this.md.download();
		}).text('torrent').attr('href', this.md.sr_item.torrent_link).appendTo(this.c);

		this.addWayPoint(downloadlink);

		pg.appendTo(this.c);

	}
});
var songFileModelUI = function() {};
provoda.View.extendTo(songFileModelUI, {
	createDetailes: function(){
		this.createBase();

		var _this = this;

		var mf_cor_view = this.parent_view.parent_view;
		this.setVisState('p-wmss', !!mf_cor_view.state('want-more-songs'))
		mf_cor_view.on('state-change.want-more-songs', function(e){
			_this.setVisState('p-wmss', !!e.value);
		});

		var song_view = mf_cor_view.parent_view;
		this.setVisState('is-visible', !!song_view.state('mp-show-end'))
		song_view.on('state-change.mp-show-end', function(e){
			_this.setVisState('is-visible', !!e.value);
		});
		
		

	},
	state_change: {
		"unavailable": function(state) {
			if (state){
				this.c.addClass("mf-unavailable");
			} else {
				this.c.removeClass("mf-unavailable");
			}
		},
		'playing-progress': function(factor){
			//this.changeBar(this.cplayng, factor);
		},
		'loading-progress': function(factor){
			//this.changeBar(this.cloading, factor);
		},
		"buffering-progress": function(state, oldstate) {
			if (state){
				this.c.addClass('buffering-progress')
			} else if (oldstate){
				this.c.removeClass('buffering-progress')
			}
			
		},
		play: function(state, oldstate){

			if (state == 'play'){
				this.c.addClass('playing-file')
			} else {
				this.c.removeClass('playing-file')
			}
		},
		selected: function(state) {
			if (state){
				this.c.addClass('selected-mf');
			} else {
				this.c.removeClass('selected-mf');
			}
		},
		overstock: function(state) {
			if (state){
				this.c.addClass('overstocked');
			} else {
				this.c.removeClass('overstocked');
			}
		},
		"vis-loading-p": function(state){
			this.cloading.css({
				width: state
			});
			
		},
		"vis-playing-p": function(state){
			this.cplayng.css({
				width: state
			});
		},
		visible_duration: function(state) {

			if (state){
				var duration = Math.floor(state/1000);
				if (duration){
					var digits = duration % 60;
					this.duration_c.text((Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+ digits : digits ));
				}
			}


		//this.title_c = $('<span></span>');
		//this.title_c.appendTo(this.c);

		},
		title: function(state) {
			this.track_title.text(state || '');
		//	.text(this.md.getTitle())
		},
		source_name: function(state) {
			this.source_name.text(state || '');
			//.text(this.md.from)
		},
		description: function(state) {
			this.track_text.attr('title', state || '');
		}
	},
	complex_states: {
		"can-progress": {
			depends_on: ['vis-is-visible', 'vis-con-appended', 'selected'],
			fn: function(vis, apd, sel){
				var can = vis && apd && sel;
				if (can){
					var _this = this;

					$(window).off('resize.song_file_progress');
					$(window).on('resize.song_file_progress', debounce(function(e){
						_this.setVisState('win-resize-time', e.timeStamp)
					}, 100));
				}
				return can;
			}
		},
		"vis-progress-c-width": {
			depends_on: ['can-progress', 'vis-p-wmss', 'vis-win-resize-time'],
			fn: function(can, p_wmss, wrsz_time){
				if (can){
					return this.progress_c.width();
				} else {
					return 0;
				}
			}
		},
		"vis-loading-p": {
			depends_on: ['vis-progress-c-width', 'loading-progress'],
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
		"vis-playing-p": {
			depends_on: ['vis-progress-c-width', 'playing-progress'],
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
		this.c = $('<li></li>');

		this.createPlayButton();


		var getClickPosition = function(e, node){
			//e.offsetX || 
			var pos = e.pageX - $(node).offset().left;
			return pos;
		};

		this.progress_c = $('<div class="mf-progress"></div>');
		this.c.click(function() {
			if (!_this.state('selected')){
				_this.md.trigger('want-to-play-sf');
			}
		});
		this.addWayPoint(this.c);

		var _this = this;

		var path_points;
		var positionChange = function(){
			var last = path_points[path_points.length - 1];

			var width = _this.state('vis-progress-c-width');

			if (!width){
				console.log("no width for pb :!((")
			}
			if (width){
				_this.md.setPositionByFactor([last.cpos, width]);
			}
			
		}

		var touchDown = function(e){
			path_points = [];
			e.preventDefault();
			path_points.push({cpos: getClickPosition(e, _this.progress_c[0]), time: e.timeStamp});
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
			path_points.push({cpos: getClickPosition(e, _this.progress_c[0]), time: e.timeStamp});
			positionChange();
		};
		var touchUp = function(e){
			if (!_this.state('selected')){
				return true;
			}
			if (e.which && e.which != 1){
				return true;
			}
			$(_this.progress_c[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			var travel;
			if (!travel){
				//
			}


			path_points = null;

			
		};
		this.progress_c.on('mousedown', function(e){

			$(_this.progress_c[0].ownerDocument)
				.off('mouseup', touchUp)
				.off('mousemove', touchMove);

			if (!_this.state('selected')){
				return true;
			}
			if (e.which && e.which != 1){
				return true;
			}

			$(_this.progress_c[0].ownerDocument)
				.on('mouseup', touchUp)
				.on('mousemove', touchMove);

			touchDown(e);

		})
		
		this.cloading = $('<div class="mf-load-progress"></div>').appendTo(this.progress_c);
		this.cplayng = $('<div class="mf-play-progress"></div>').appendTo(this.progress_c);
		this.track_text = $('<div class="mf-text"></div>').appendTo(this.progress_c);
		this.duration_c = $('<span class="mf-duration"></span>').appendTo(this.track_text);
		this.track_title = $('<span class="main-mf-text"></span>').appendTo(this.track_text);
		this.source_name = $('<span class="mf-source"></span>').appendTo(this.track_text);
		
		this.c.append(this.progress_c);
	},
	createPlayButton: function() {
		var _this = this;

		var pb_place = $('<span class="play-button-place"></span>');
		var pc_place = $('<span class="pc-indicator big-indicator play-indicator pc-place"></span>').appendTo(pb_place);
		var button = $('<span class="pc pc-play big-control"></span>').appendTo(pc_place);
		button.click(function(e) {
			e.stopPropagation();
			if (_this.state('selected')){

				if (_this.state('play') == 'play'){
					_this.md.pause();
				} else {
					_this.md.trigger('want-to-play-sf');
					//_this.md.play();
				}
			} else {
				_this.md.trigger('want-to-play-sf');
			}
		});
		this.addWayPoint(button);

		this.c.append(pb_place);
	},
	changeBar: function(bar, factor){
		if (factor){
			if (this.width){
				bar[0].style.width = Math.floor(factor * this.width) + 'px';
			} else {
				bar[0].style.width = factor * 100 + '%';
			}
		} else {
			bar[0].style.width = 0;
		}
	},
	fixWidth: function(){
		this.width = this.progress_c.width();
	},
	fixBars: function() {
		this.fixWidth();
		this.changeBar(this.cplayng, this.state('playing-progress'));
		this.changeBar(this.cloading, this.state('loading-progress'));
	}
});