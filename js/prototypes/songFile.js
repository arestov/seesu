(function(){
	var counter = 0;

	var songFileModelUI = function(sf) {
		this.sf = sf;
		this.callParentMethod('init');
		this.createBase();

	};
	createPrototype(songFileModelUI, new servView(), {
		createBase: function() {
			this.c = $('<li></li>');
			this.title_c = $('<span></span>');
			$('<span class="main-mf-text"></span>').text(this.sf.getTitle()).appendTo(this.title_c);
			$('<span class="mf-source"></span>').text(this.sf.from).appendTo(this.title_c);
			this.title_c.appendTo(this.c)
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
			
		},
		deactivate: function() {
			
		},
		markAsPlaying: function() {
			
		},
		unmarkAsPlaying: function() {
			
		}
	});
})()


