var mfComplectUI = function(mf) {
	this.mf = mf;
	this.callParentMethod('init');
	this.createBase();
	this.setModel(mf);
	
};
createPrototype(mfComplectUI, new servView(), {
	createBase: function() {
		this.c = $('<div class="moplas-list"></div>');

		this.header = $('<h4></h4>').text(this.mf.sem_part.name).appendTo(this.c);
		this.lc = $('<ul></ul>').appendTo(this.c);
	},
	appendChildren: function() {
		var moplas_list = this.mf.moplas_list;

		for (var i = 0; i < moplas_list.length; i++) {
			this.appendModelTo(moplas_list[i], this.lc);
		};
	}
});

var mfComplect = function(mo, sem_part) {
	this.callParentMethod('init');
	this.sem_part = sem_part;
	this.mo = mo;
	this.moplas_list = [];
	for (var i = 0; i < this.sem_part.t.length; i++) {
		this.moplas_list.push(this.sem_part.t[i].getSongFileModel(mo, mo.player));
	};
};

createPrototype(mfComplect, new servModel(), {
	ui_constr: function() {
		return new mfComplectUI(this);
	},
	hasManyFiles: function() {
		return this.sem_part && this.sem_part.t && this.sem_part.t.length > 1;
	}
});



var mfСorUI = function(mf_cor) {
	this.callParentMethod('init');
	this.createBase();
	this.setModel(mf_cor);
	this.mf_cor = mf_cor;
};
createPrototype(mfСorUI, new servView(), {
	state_change: {
		changed: function(val) {
			this.appendChildren();
		},
		many_files: function(state) {
			var _this = this;
			if (!this.more_songs_b){
				var ms_c = $('<div class="show-all-songs"></div>');
				this.more_songs_b = $('<a class="js-serv"></a>').text(localize('Files')).appendTo(ms_c);
				this.more_songs_b.click(function() {
					_this.c.toggleClass('want-more-song');
				});
				this.c.prepend(ms_c);
			}
		}
	},
	createBase: function() {
		this.c = $('<div class="song-row-content moplas-block"></div>');
	},
	appendChildren: function() {
		var _this = this;
		if (this.mf_cor.pa_o){
			var pa = this.mf_cor.pa_o;


			var append = function(ui_c){
				var prev_name = pa[i-1];
				var prev = prev_name && _this.mf_cor.complects[prev_name];
				var prev_c = prev && prev.getC();
				if (prev_c){
					prev_c.after(ui_c);
				} else {
					var next_c = _this.getNextSemC(pa, i+1);
					if (next_c){
						next_c.before(ui_c)
					} else {
						_this.c.append(ui_c);
					}
				}
			}

			for (var i = 0; i < pa.length; i++) {
				this.appendModelTo(this.mf_cor.complects[pa[i]], append);
			};
		}
		
	},
	getNextSemC: function(packs, start) {
		
		for (var i = start; i < packs.length; i++) {
			var cur_name = packs[i];
			var cur_mf = cur_name && this.mf_cor.complects[cur_name];
			var mf_c = cur_mf && cur_mf.getC();
			if (mf_c){
				return mf_c;
			}
		};
	}
});


var mfСor = function(mo, omo) {
	this.callParentMethod('init');
	this.omo = omo;
	this.mo = mo;
	this.complects = {};
	this.subscribed_to = [];

};
createPrototype(mfСor, new servModel(), {
	ui_constr: function() {
		return new mfСorUI(this);
	},
	state_change: {
		"current_mopla": function(nmf, omf) {
			if (omf){
				omf.unmarkAsPlaying();
			}
			if (nmf){
				nmf.markAsPlaying();
			}
		},
		"default_mopla": function(nmf, omf) {
			if (omf){
				omf.deactivate();
			}
			if (nmf){
				nmf.activate();
			}
		}

	},
	setSem: function(sem) {
		this.sem  = sem;
		var _this = this;
		sem.on('changed', function(val) {
			_this.semChanged(val);
		});
	},
	semChanged: function(val) {
		var songs_packs = this.songs_packs = this.sem.getAllSongTracks();

		this.pa_o = $filter(songs_packs, 'name');

		var many_files = this.pa_o.length > 1;
		for (var i = 0; i < this.pa_o.length; i++) {
			var cp_name = this.pa_o[i];
			if (!this.complects[cp_name]){
				this.complects[cp_name] = new mfComplect(this.mo, songs_packs[i]);
				many_files = many_files || this.complects[cp_name].hasManyFiles();
			}
		};
		this.updateState('changed', val || new Date());
		this.updateState('many_files', many_files);
		if (!this.state('current_mopla')){
			this.updateState('default_mopla', this.song());
		}

	},
	setCurrentMopla: function(mf) {
		var _this = this;

		if (!this.mfPlayStateChange){
			this.mfPlayStateChange = function(state) {
				if (_this.state('current_mopla') == this){
					_this.updateState('play', state);
				}
			};
		}

		if (mf){
			if (this.subscribed_to.indexOf(mf) == -1){
				mf.on('play-state-change', this.mfPlayStateChange);
				this.subscribed_to.push(mf);
			}
			this.updateState('default_mopla', mf);
			this.updateState('current_mopla', mf);
		} else {
			this.updateState('current_mopla', false)
		}
	},
	preloadSongFile: function(){

		if (this.isHaveBestTracks() || this.isSearchCompleted()){

			var mopla = this.state('default_mopla');
			if (mopla){
				mopla.load();
			}
			
		}
	},
	setVolume: function(vol){
		var cmf = this.state('current_mopla')
		if (cmf){
			cmf.setVolume(vol);
		}
	},
	stop: function(){
		var cmf = this.state('current_mopla')
		if (cmf){
			cmf.stop();
		}
	},
	switchPlay: function(){
		if (this.state('play')){
			if (this.state('play') == 'play'){
				this.pause();
			} else {
				this.play();
			}
		} else {
			this.play();
		}
		
	},
	pause: function(){
		var cmf = this.state('current_mopla')
		if (cmf){
			cmf.pause();
		}
		
	},
	play: function(mopla){
		var cmf = this.state('current_mopla');
		var dmf = this.state('default_mopla');
		if ((cmf && (!mopla || mopla == cmf)) && this.state('play') == 'pause'){
			cmf.play();
		} else if (this.isHaveTracks()){
			mopla = mopla || dmf;
			if (mopla != cmf || !this.state('play')){
				if (cmf){
					cmf.stop();
				}
				
				this.setCurrentMopla(mopla);
				this.fire('before-mf-play', mopla);
				mopla.play();

			}
		}
	},
	raw: function(){
		return !!this.omo && !!this.omo.raw;
	},
	isHaveAnyResultsFrom: function(source_name){
		return !!this.raw() || !!this.sem && this.sem.isHaveAnyResultsFrom(source_name);
	},
	isHaveTracks: function(){
		return !!this.raw() || !!this.sem && this.sem.have_tracks ;
	},
	isSearchCompleted: function(){
		return !!this.raw() || !!this.sem && this.sem.search_completed;
	},
	isHaveBestTracks: function(){
		return !!this.raw() || !!this.sem && this.sem.have_best;
	},
	getMf: function() {
		return this.state('default_mopla');	
	},
	song: function(){
		if (this.raw()){
			return this.omo.getSongFileModel(this.mo, this.mo.player);
		} else if (this.sem) {
			var s = this.sem.getAllSongTracks();
			return !!s && s[0].t[0].getSongFileModel(this.mo, this.mo.player);
		} else{
			return false;
		}
	},
	songs: function(){
		if (this.raw()){
			return [{t:[this.omo.getSongFileModel(this.mo, this.mo.player)]}];
		} else if (this.sem){
			return this.sem.getAllSongTracks();
		} else{
			return false;
		}
		
	}
});

/*

this.fire('got-results')

this.fire('got-result')

this.fire('error')


this.fire('got-nothing')

в процессе

завершен



имеет результаты

0 результатов


имеет ошибку

 непоправимую ошибку

 ошибку поправимую кем угодно
 ошибку поправимую только несамостоятельно


*/