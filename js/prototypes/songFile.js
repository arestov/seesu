var fileInTorrentUI = function() {};
suServView.extendTo(fileInTorrentUI,{
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

		pg.appendTo(this.c);

	}
});
var songFileModelUI = function() {};
suServView.extendTo(songFileModelUI, {
	createDetailes: function(){
		this.createBase();

		var _this = this;

		var mf_cor_view = this.parent_view.parent_view;
		this.setVisState('p-wmss', !!mf_cor_view.state('want-more-songs'))
		mf_cor_view.on('state-change.want-more-songs', function(e){
			_this.setVisState('p-wmss', !!e.value);
		});

		var song_view = mf_cor_view.parent_view;
		this.setVisState('is-visible', !!song_view.state('mp-show'))
		song_view.on('state-change.mp-show', function(e){
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

		if (this.md.description){
			this.track_text.attr('title', this.md.description);
		}
		

		//this.title_c = $('<span></span>');
		this.duration_c = $('<span class="mf-duration"></span>').appendTo(this.track_text);
		if (this.md.duration){
			var duration = Math.floor(this.md.duration/1000);
			if (duration){
				var digits = duration % 60;
				this.duration_c.text((Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+ digits : digits ));
			}
		}

		$('<span class="main-mf-text"></span>').text(this.md.getTitle()).appendTo(this.track_text);
		$('<span class="mf-source"></span>').text(this.md.from).appendTo(this.track_text);
		//this.title_c.appendTo(this.c);

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









//!!!!!!!!!!!!!!!!!!!!!!!!








var fileInTorrent = function(sr_item, mo){

	this.init();
	this.sr_item = sr_item;
};

provoda.Model.extendTo(fileInTorrent, {
	model_name: 'file-torrent',
	setPlayer: function() {
		return this;
	},
	activate: function() {
		return this;
	},
	deactivate: function() {
		return this;
	},
	download: function() {
		if (!window.btapp){
			app_env.openURL(this.sr_item.torrent_link);
		} else {
			btapp.add.torrent(this.sr_item.torrent_link)
		}
		this.updateState('download-pressed', true)
	}
});

(function(){
	var counter = 0;

	

	songFileModel = function(file, mo){
		this.init();
		this.mo = mo;
		for (var a in file){
			if (typeof file[a] != 'function' && typeof file[a] != 'object'){
				this[a] = file[a];
			}
		}
		this.uid = 'song-file-' + counter++;
		this.parent = file;
	};
	provoda.Model.extendTo(songFileModel, {
		model_name: 'file-http',
		getTitle: function() {
			var title = [];

			if (this.artist){
				title.push(this.artist);
			}
			if (this.track){
				title.push(this.track);
			}
			return title.join(' - ');
		},
		events: {
			finish: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
				}
				this.updateState('play', false);
			},
			play: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', 'play');
					if (!mo.start_time){
						//fixme
						mo.start_time = ((new Date()).getTime()/1000).toFixed(0);
					}
				}
				this.updateState('play', 'play');
			},
			playing: function(opts){
				var dec = opts.position/opts.duration;
				this.updateState('playing-progress', dec);
				this.updateState('loaded_duration', opts.duration);
			},
			buffering: function(state) {
				this.updateState('buffering-progress', !!state);
			},
			loading: function(opts){
				var factor;
				if (opts.loaded && opts.total){
					factor = opts.loaded/opts.total
				} else if (opts.duration && opts.fetched){
					factor = opts.fetched/opts.duration
				}
				if (factor){
					this.updateState('loading-progress', factor);
				}
				

				
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.waitToLoadNext(factor > 0.8);
				}
			},
			pause: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
				}
				this.updateState('play', false);
			},
			stop: function(opts){
				//throw "Do not rely on stop event"
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
				}
				this.updateState('play', false);
			},
			error: function() {
				var d = new Date()
				this.updateState("error", d);
				this.parent.error = d;
				var _this = this;
				getInternetConnectionStatus(function(has_connection) {
					if (has_connection) {
						var pp = _this.state("playing-progress");
						if (!pp){
							_this.failPlaying();
						} else {
							
							setTimeout(function() {
								if (_this.state("playing-progress") == pp){
									_this.failPlaying();
								}
							}, 3500);
						}
						
					}
				});
			}
		},
		failPlaying: function() {
			this.updateState("unavailable", true);
			this.parent.unavailable = true;
			this.trigger("unavailable");
		},
		setPlayer: function(player){
			if (player){
				this.player = player;
				player.attachSong(this);
			}
			return this;
		},
		_createSound: function(){
			if (!this.sound){
				this.player.create(this);
				this.sound = true;
			}
		},
		play: function(){
			if (this.player){
				this._createSound();
				this.player.play(this);
			}
		},
		removeCache: function(){
			this.player.remove(this);
		},
		stop: function(){
			if (this.player){
				this.pause();
				this.setPosition(0);
				this.removeCache();

				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
				}

				this.updateState('play', false);
				this.updateState('loading-progress', 0);
				this.updateState('playing-progress', 0);
				
				delete this.sound;
			}
		},
		pause: function(){
			if (this.player){
				this.player.pause(this);
			}
		},
		setVolumeByFactor: function(fac){
			this.setVolumeByFactor(false, fac);
		},
		setVolume: function(vol, fac){
			if (this.player){
				this.player.setVolume(this, vol, fac);
			}
		},
		getDuration: function(){
			return this.duration || this.state('loaded_duration');
		},
		setPositionByFactor: function(fac){
			this.setPosition(false, fac);
		},
		setPosition: function(pos, fac){
			if (this.player){
				this.player.setPosition(this, pos, fac);
			
				this.mo.posistionChangeInMopla(this);
				
				
			}
		},
		load: function(){
			if (this.player){
				this._createSound();
				this.player.load(this);
			}
		},
		activate: function() {
			this.updateState('selected', true);
		},
		deactivate: function() {
			this.updateState('selected', false);
		},
		markAsPlaying: function() {
			
		},
		unmarkAsPlaying: function() {
			
		}
	});
})();


