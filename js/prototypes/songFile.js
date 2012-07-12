var fileInTorrentUI = function() {};
suServView.extendTo(fileInTorrentUI,{
	init: function(md){
		this._super();
		this.md = md;
		this.createBase();
		this.setModel(md);
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

var fileInTorrent = function(sr_item, mo){

	this.init();
	this.sr_item = sr_item;
};

provoda.Model.extendTo(fileInTorrent, {
	ui_constr: fileInTorrentUI,
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

	var songFileModelUI = function() {};
	suServView.extendTo(songFileModelUI, {
		init: function(md){
			this.md = md;
			this._super();
			this.createBase();
			this.setModel(md);
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
				this.changeBar(this.cplayng, factor);
			},
			'loading-progress': function(factor){
				this.changeBar(this.cloading, factor);
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
				if (!_this.state('play')){
					_this.md.trigger('want-to-be-selected');
				} 
			});


			//this.c = $('<div class="track-progress"></div>')
			var _this = this;
			this.progress_c.click(function(e){
				if (_this.state('play')){
					var pos = getClickPosition(e, this);
					if (!_this.width){
						_this.fixWidth();
					}
					_this.md.setPositionByFactor(_this.width && ((pos/_this.width)));
				} else {
					_this.md.trigger('want-to-be-selected');
				}
				return false;
				//su.ui.hidePopups();
				//e.stopPropagation();	
			});
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
				if (_this.state('play')){

					if (_this.state('play') == 'play'){
						_this.md.pause();
					} else {
						_this.md.play();
					}
				} else {
					_this.md.trigger('want-to-be-selected');
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
		},
		resetPlayPosition: function(){
			this.changeBar(this.cplayng,0);
		},
		reset: function(){
			this.fixWidth();
			this.resetPlayPosition();
			this.changeBar(this.cloading, 0);
			
		},
		onAppend: function(parent_view) {
			var _this = this;
			parent_view.parent_view.on('want-more-songs-state-change', function(nv, ov) {
				if (nv || ov){
					if (_this.state('selected')){
						_this.fixBars();
					}
				}
			});

		}
	});

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
		ui_constr: songFileModelUI,
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
				this.updateProp('loaded_duration', opts.duration);
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
							}, 10000);
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
		stop: function(){
			if (this.player){
				this.pause();
				this.setPosition(0);
				this.player.remove(this);

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
		setVolume: function(vol){
			if (this.player){
				this.player.setVolume(this, vol);
			}
		},
		setPositionByFactor: function(fac){
			this.setPosition((this.loaded_duration || this.duration || 0) * fac, fac);
		},
		setPosition: function(pos, fac){
			if (this.player){
				this.player.setPosition(this, pos, fac);
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


