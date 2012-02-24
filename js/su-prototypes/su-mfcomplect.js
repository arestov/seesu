

var notifyCounterUI = function(md) {
	this.callParentMethod('init');
	this.createBase();
	this.setModel(md);
};

createPrototype(notifyCounterUI, new suServView(), {
	createBase: function() {
		this.c = $('<span class="notifier hidden"></span>');
	},
	state_change: {
		counter: function(state) {
			if (state){
				this.c.text(state);
				this.c.removeClass('hidden');
			} else {
				this.c.addClass('hidden');
			}
		}
	}
});

var notifyCounter = function(name, banned_messages) {
	this.callParentMethod('init');
	this.messages = {};
	this.banned_messages = banned_messages || [];
	this.name = name;
};

createPrototype(notifyCounter, new servModel(), {
	ui_constr: function() {
		return new notifyCounterUI(this);
	},
	addMessage: function(m) {
		if (!this.messages[m] && this.banned_messages.indexOf(m) == -1){
			this.messages[m] = true;
			this.recount();
		}
	},
	banMessage: function(m) {
		this.removeMessage(m);
		this.banned_messages.push(m);
	},
	removeMessage: function(m) {
		if (this.messages[m]){
			delete this.messages[m];
			this.recount();
		}
	},
	recount: function() {
		var counter = 0;
		for (var a in this.messages){
			++counter
		}
		this.updateState('counter', counter);
	}
});

var mfComplectUI = function(mf) {
	this.mf = mf;
	this.callParentMethod('init');
	this.createBase();
	this.setModel(mf);
	
};
createPrototype(mfComplectUI, new suServView(), {
	createBase: function() {
		this.c = $('<div class="moplas-list"></div>');

		this.header = $('<h4></h4>').text(this.mf.sem_part.name).appendTo(this.c);
		this.lc = $('<ul></ul>').appendTo(this.c);
	},
	appendChildren: function() {
		var moplas_list = this.mf.moplas_list;

		for (var i = 0; i < moplas_list.length; i++) {
			var ui  = moplas_list[i].getFreeView();
			if (ui){
				this.lc.append(ui.getC())
				ui.appended(this)
			}
		}
	}
});

var mfComplect = function(mf_cor, sem_part, mo) {
	this.callParentMethod('init');
	this.sem_part = sem_part;
	this.mo = mo;
	this.mf_cor = mf_cor;
	this.moplas_list = [];

	var _this = this;
	var playMf = function() {
		_this.mf_cor.play(this);
	};
	for (var i = 0; i < this.sem_part.t.length; i++) {
		var sf = this.sem_part.t[i]
				.getSongFileModel(mo, mo.player)
					.on('want-to-be-selected', playMf);

		if (i + 1 > this.overstock_limit){
			sf.updateState('overstock', true);
		}
		this.addChild(sf);
		this.moplas_list.push(sf);
	}
};

createPrototype(mfComplect, new servModel(), {
	ui_constr: function() {
		return new mfComplectUI(this);
	},
	overstock_limit: 5,
	hasManyFiles: function() {
		return this.sem_part && this.sem_part.t && this.sem_part.t.length > 1;
	}
});



var mfCorUI = function(mf_cor) {
	this.callParentMethod('init');
	this.mf_cor = mf_cor;

	this.createBase();
	
	
	this.setModel(mf_cor);
};
createPrototype(mfCorUI, new suServView(), {
	state_change: {
		changed: function(val) {
			this.appendChildren();
		},
		"want-more-songs": function(state) {
			if (state){
				this.c.addClass('want-more-songs');
			} else {
				this.c.removeClass('want-more-songs');
			}
		},
		"must-be-expandable": function(state) {
			if (state){
				this.sall_songs.removeClass('hidden')
			}
		}
	},
	createBase: function() {
		this.c = $('<div class="song-row-content moplas-block"></div>');

		if (!this.more_songs_b){
			var _this = this;
			this.sall_songs =  $('<div class="show-all-songs hidden"></div>');

			this.more_songs_b = $('<a class=""></a>').appendTo(this.sall_songs);
			this.more_songs_b.click(function() {
				_this.mf_cor.switchMoreSongsView();
			});
			$('<span></span>').text(localize('Files')).appendTo(this.more_songs_b);
			this.c.prepend(this.sall_songs);

			var nof_ui = this.mf_cor.notifier.getFreeView();
			if (nof_ui){
				this.sall_songs.append(nof_ui.getC());
				nof_ui.appended(this);
			}
		}
	},
	appendChildren: function() {
		var _this = this;
		if (this.mf_cor.pa_o){
			var pa = this.mf_cor.pa_o;


			var append = function(cur_view){
				var ui_c = cur_view && cur_view.getC();
				if (!ui_c){
					return;
				}

				var prev_name = pa[i-1];
				var prev = prev_name && _this.mf_cor.complects[prev_name];
				var prev_c = prev && prev.getC();
				if (prev_c){
					prev_c.after(ui_c);
				} else {
					var next_c = _this.getNextSemC(pa, i+1);
					if (next_c){
						next_c.before(ui_c);
					} else {
						_this.c.append(ui_c);
					}
				}
				cur_view.appended(_this);
			};

			for (var i = 0; i < pa.length; i++) {
				append(this.mf_cor.complects[pa[i]].getFreeView());
			}
		}
		
	},
	getNextSemC: function(packs, start) {
		for (var i = start; i < packs.length; i++) {
			var cur_name = packs[i];
			var cur_mf = cur_name && this.mf_cor.complects[cur_name];
			return cur_mf && cur_mf.getC();
		}
	}
});


var mfCor = function(mo, omo) {
	this.callParentMethod('init');
	this.omo = omo;
	this.mo = mo;
	this.complects = {};
	this.subscribed_to = [];
	this.notifier = new notifyCounter();
	this.addChild(this.notifier);
	this.bindMessagesRecieving();

	this.checkVKAuthNeed();

	var _this = this;
	this.watchStates(['has_files', 'vk-audio-auth'], function(has_files, vkaa) {
		if (has_files || vkaa){
			_this.updateState('must-be-expandable', true);
		}
	});
};
createPrototype(mfCor, new servModel(), {
	ui_constr: function() {
		return new mfCorUI(this);
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
	switchMoreSongsView: function() {
		if (!this.state('want-more-songs')){
			this.updateState('want-more-songs', true);
			this.markMessagesReaded();
		} else {
			this.updateState('want-more-songs', false);
		}
		
	},
	markMessagesReaded: function() {
		this.notifier.banMessage('vk-audio-auth');
	},
	vkAudioAuth: function(remove) {
		if (remove){
			this.notifier.removeMessage('vk-audio-auth');
			this.updateState('vk-audio-auth', false);
		} else {
			
			this.notifier.addMessage('vk-audio-auth');
			this.updateState('vk-audio-auth', true);
		}
	},
	checkVKAuthNeed: function() {
		if (this.mo.mp3_search){
				
			if (this.mo.mp3_search.haveSearch('vk')){
				this.vkAudioAuth(true);
			} else {
				if (this.isHaveAnyResultsFrom('vk')){
					this.vkAudioAuth(true);
				} else {
					this.vkAudioAuth();
				}
			}
		}
		return this;
	},
	bindMessagesRecieving: function() {
		if (this.mo.mp3_search){
			var _this = this;
			this.mo.mp3_search.on('new-search', function(search, name) {
				if (name == 'vk'){
					_this.vkAudioAuth(true);
				}
			});
		}
	},
	collapseExpanders: function() {
		this.updateState('want-more-songs', false);
	},
	setSem: function(sem) {
		this.sem  = sem;
		var _this = this;
		sem.on('changed', function(val) {
			_this.semChanged(val);
		});
	},
	semChanged: function(complete) {
		this.checkVKAuthNeed();

		var songs_packs = this.songs_packs = this.sem.getAllSongTracks();

		this.pa_o = $filter(songs_packs, 'name');

		var many_files = this.pa_o.length > 1;
		for (var i = 0; i < this.pa_o.length; i++) {
			var cp_name = this.pa_o[i];
			if (!this.complects[cp_name]){
				this.complects[cp_name] = new mfComplect(this, songs_packs[i], this.mo);
				this.addChild(this.complects[cp_name]);
				many_files = many_files || this.complects[cp_name].hasManyFiles();
			}
		}
		this.updateState('has_files', many_files);
		if (!this.state('current_mopla')){
			this.updateState('default_mopla', this.song());
		}
		this.updateState('changed', new Date());
		

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
			this.updateState('current_mopla', false);
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
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.setVolume(vol);
		}
	},
	stop: function(){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.stop();
		}
	},
	switchPlay: function(){
		if (this.state('play')){
			this.pause();
		} else {
			this.play();
		}
		
	},
	pause: function(){
		var cmf = this.state('current_mopla');
		if (cmf){
			cmf.pause();
		}
		
	},
	play: function(mopla){
		var cmf = this.state('current_mopla');
		var dmf = this.state('default_mopla');
		if (this.isHaveTracks()){
			mopla = mopla || dmf;
			if (mopla != cmf || !this.state('play')){
				if (cmf && mopla != cmf){
					cmf.stop();
				}
				mopla = mopla || this.song();
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


/*

var songs = this.mo.songs();

			if (this.mo.isSearchCompleted() && this.mo.isNeedsAuth('vk')){
				
				var vklc = this.rowcs.song_context.getC();
				var oldvk_login_notify = this.vk_login_notify;
				if (!songs.length){
					this.vk_login_notify = su.ui.samples.vk_login.clone();
				} else if(!this.mo.isHaveAnyResultsFrom('vk')){
					this.vk_login_notify = su.ui.samples.vk_login.clone( localize('to-find-better') + " " +  localize('music-files-from-vk'));
				} else {
					this.vk_login_notify = su.ui.samples.vk_login.clone(localize('stabilization-of-vk'));
					
				}
				if (oldvk_login_notify){
					oldvk_login_notify.remove();
				}
				if (this.vk_login_notify){
					vklc.after(this.vk_login_notify);
				}
			} 

			*/