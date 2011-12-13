(function(){
	var counter = 0;
	songFileModel = function(file){

		servModel.prototype.init.call(this);
		for (var a in file){
			if (typeof file[a] != 'function' && typeof file[a] != 'object'){
				this[a] = file[a];
			}
		}
		this.uid = counter++;
	};
	songFileModel.prototype = new servModel();
	cloneObj(songFileModel.prototype, {
		events: {
			
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
		}
	});
})()


