(function(){
	var counter = 0;

	var songFileModelUI = function(sf) {
		this.sf = sf;
		this.callParentMethod('init');
		this.createBase();

	};
	createPrototype(songFileModelUI, new servView(), {
		state_change: {
			'playing-progress': function(factor){
				this.changeBar(this.cplayng, factor);
			},
			'loading-progress': function(factor){
				this.changeBar(this.cloading, factor);
			},
			play: function(state){
				if (!state){
					this.resetPlayPosition();
				}
			},
			selected: function(state) {
				if (state){
					this.c.addClass('selected-mf');
				} else {
					this.c.removeClass('selected-mf');
				}
			}
		},
		createBase: function() {
			this.c = $('<li></li>');

			var getClickPosition = function(e, node){
				//e.offsetX || 
				var pos = e.pageX - $(node).offset().left;
				return pos;
			};

			this.progress_c = $('<div class="mf-progress"></div>');



			//this.c = $('<div class="track-progress"></div>')
			var _this = this;
			this.progress_c.click(function(e){
				var pos = getClickPosition(e, this);
				if (!_this.width){
					_this.fixWidth();
				}
				_this.sf.setPositionByFactor(_this.width && ((pos/_this.width)));
				//su.ui.hidePopups();
				//e.stopPropagation();	
			});
			this.cloading = $('<div class="mf-load-progress"></div>').appendTo(this.progress_c);
			this.cplayng = $('<div class="mf-play-progress"></div>').appendTo(this.progress_c);
			this.track_text = $('<div class="mf-text"></div>').appendTo(this.progress_c);

			

			//this.title_c = $('<span></span>');
			$('<span class="mf-duration"></span>').appendTo(this.track_text);
			$('<span class="main-mf-text"></span>').text(this.sf.getTitle()).appendTo(this.track_text);
			$('<span class="mf-source"></span>').text(this.sf.from).appendTo(this.track_text);
			//this.title_c.appendTo(this.c);

			this.c.append(this.progress_c);
		},
		changeBar: function(bar, factor){
			if (factor){
				if (this.width){
					bar[0].style.width = factor * this.width + 'px'
				} else {
					bar[0].style.width = factor * 100 + '%'
				}
			} else {
				bar[0].style.width = 0;
			}
		},
		fixWidth: function(){
			this.width = this.c.width();
		},
		resetPlayPosition: function(){
			this.cplayng[0].style.width = 0
		},
		reset: function(){
			this.resetPlayPosition();
			this.cloading[0].style.width = 0;
			this.fixWidth();
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
	};
	songFileModel.prototype = new servModel();
	cloneObj(songFileModel.prototype, {
		ui_constr: function() {
			return new songFileModelUI(this);
		},
		getTitle: function() {
			var title = [];

			if (this.artist){
				title.push(this.artist)
			}
			if (this.track){
				title.push(this.track)
			}
			return title.join(' - ')
		},
		events: {
			finish: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false)
				}
				this.updateState('play', false)
			},
			play: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', 'play')
					if (!mo.start_time){
						//fixme
						mo.start_time = ((new Date()).getTime()/1000).toFixed(0);
					}
				}
				this.updateState('play', 'play')
			},
			playing: function(opts){
				var dec = opts.position/opts.duration;
				this.updateState('playing-progress', dec);
				this.updateProp('loaded_duration', opts.duration);
			},
			loading: function(opts){
				var dec = opts.loaded/opts.total;
				this.updateState('loading-progress', dec);

				
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.waitToLoadNext(dec > 0.8);
				}
			},
			pause: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', 'pause')
				}
				this.updateState('play', 'pause')
			},
			stop: function(opts){
				var mo = ((this == this.mo.mopla) && this.mo);
				if (mo){
					mo.updateState('play', false)
					delete mo.start_time;
				}
				this.updateState('play', false)
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
				this.player.stop(this);
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
})()


