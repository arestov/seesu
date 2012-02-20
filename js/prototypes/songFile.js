(function(){
	var counter = 0;

	var songFileModelUI = function(sf) {
		this.sf = sf;
		this.callParentMethod('init');
		this.createBase();
		this.setModel(sf);
	};
	createPrototype(songFileModelUI, new suServView(), {
		state_change: {
			'playing-progress': function(factor){
				this.changeBar(this.cplayng, factor);
			},
			'loading-progress': function(factor){
				this.changeBar(this.cloading, factor);
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
					_this.sf.fire('want-to-be-selected');
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
					_this.sf.setPositionByFactor(_this.width && ((pos/_this.width)));
				} else {
					_this.sf.fire('want-to-be-selected');
				}
				return false;
				//su.ui.hidePopups();
				//e.stopPropagation();	
			});
			this.cloading = $('<div class="mf-load-progress"></div>').appendTo(this.progress_c);
			this.cplayng = $('<div class="mf-play-progress"></div>').appendTo(this.progress_c);
			this.track_text = $('<div class="mf-text"></div>').appendTo(this.progress_c);

			if (this.sf.description){
				this.track_text.attr('title', this.sf.description);
			}
			

			//this.title_c = $('<span></span>');
			this.duration_c = $('<span class="mf-duration"></span>').appendTo(this.track_text);
			if (this.sf.duration){
				var duration = Math.floor(this.sf.duration/1000);
				if (duration){
					var digits = duration % 60;
					this.duration_c.text((Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+ digits : digits ));
				}
			}

			$('<span class="main-mf-text"></span>').text(this.sf.getTitle()).appendTo(this.track_text);
			$('<span class="mf-source"></span>').text(this.sf.from).appendTo(this.track_text);
			//this.title_c.appendTo(this.c);

			this.c.append(this.progress_c);
		},
		createPlayButton: function() {
			var _this = this;

			var pb_place = $('<span class="play-button-place"></span>');
			var pc_place = $('<span class="pc-indicator big-indicator play-indicator pc-place"></span>').appendTo(pb_place);
			var button = $('<span class="pc pc-play big-control"></span>').appendTo(pc_place);
			button.click(function() {
				if (_this.state('play')){

					if (_this.state('play') == 'play'){
						_this.sf.pause();
					} else {
						_this.sf.play();
					}
				} else {
					_this.sf.fire('want-to-be-selected');
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
			parent_view.parent_view.on('want-more-songs-state-change', function() {
				if (_this.state('selected')){
					_this.fixBars();
				}
				
			})
		}
	});

	songFileModel = function(file, mo){
		servModel.prototype.init.call(this);
		this.mo = mo;
		for (var a in file){
			if (typeof file[a] != 'function' && typeof file[a] != 'object'){
				this[a] = file[a];
			}
		}
		this.uid = 'song-file-' + counter++;
		this.parent = file;
	};
	songFileModel.prototype = new servModel();
	cloneObj(songFileModel.prototype, {
		ui_constr: function() {
			return new songFileModelUI(this);
		},
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
				throw "Do not rely on stop event"
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false);
					delete mo.start_time;
				}
				this.updateState('play', false);
			}
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
			this.setPosition((this.loaded_duration || this.duration) * fac);
		},
		setPosition: function(pos){
			if (this.player){
				this.player.setPosition(this, pos);
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


