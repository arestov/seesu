var seesuPlayer = function(){
	this.init();
};
seesuPlayer.prototype = new playerComplex();

cloneObj(seesuPlayer.prototype, {
	constructor: seesuPlayer,
	init: function(){
		playerComplex.prototype.init.call(this);

		var volume =  suStore('vkplayer-volume');
			volume = volume && parseFloat(volume);
		if (volume){
			this.volume = volume;
		}
	},
	saveVolume: function(vol) {
		suStore('vkplayer-volume', vol, true);
	},
	events: {
		finish: function(e){
			if (this.c_song == e.song_file.mo){
				this.playNext(false, true);
			}
		},
		play: function(e){
			if (this.c_song == e.song_file.mo){
				this.playing();
				if (this.c_song.next_preload_song){
					this.c_song.next_preload_song.prefindFiles();
				}
				this.changeAppMode(true);
			}
		},
		pause: function(e){
			if (this.c_song == e.song_file.mo){
				this.notPlaying();
				this.changeAppMode()
			}
		},
		stop: function(e){
			if (this.c_song == e.song_file.mo){
				this.notPlaying();
				this.changeAppMode()
			}
		},
		playing: function(e){
			
		}
	},
	notPlaying: function(){
		su.main_level.notPlaying();
		
	},
	playing: function(){
		su.main_level.playing();
	},
	changeAppMode: function(playing){
		if (playing){
			if (app_env.pokki_app){
				pokki.setIdleDetect('popup', false);
			}
			if (window.btapp){
				btapp.properties.set('background', true);
			}
		} else{
			if (app_env.pokki_app){
				pokki.setIdleDetect('popup', true);
			}
			if (window.btapp){
				btapp.properties.set('background', false);
			}
		}
	},
	nowPlaying: function(mo){
		su.main_level.nowPlaying(mo.getTitle());
	}
});

su.p = new seesuPlayer();

su.p
	.on('finish', function(e){
		var mo = e.song_file.mo;
		
		var duration = Math.round(mo.mopla.duration/1000);
		if (lfm.scrobbling) {
			lfm.submit(mo, duration);
		}
		if (su.vk.id){
			su.s.api('track.scrobble', {
				client: su.env.app_type,
				status: 'finished',
				duration: duration,
				artist: mo.artist,
				title: mo.track,
				timestamp: ((new Date()).getTime()/1000).toFixed(0)
			});
		}
	})
	.on('play', function(e){
		var mo = e.song_file.mo;
		var duration = Math.round(mo.mopla.duration/1000);
		if (lfm.scrobbling) {
			lfm.nowplay(mo, duration);
		}
		if (su.vk.id){
			su.s.api('track.scrobble', {
				client: su.env.app_type,
				status: 'playing',
				duration: duration,
				artist: mo.artist,
				title: mo.track,
				timestamp: ((new Date()).getTime()/1000).toFixed(0)
			});
		}
	});


suReady(function(){
	var sm2opts = {};
	if (su.env.opera_extension){
		sm2opts.wmode = 'opaque'
		sm2opts.useHighPerformance = false;
	} else {
		if (su.env.opera_widget){
			sm2opts.wmode = 'transparent';
		}
	}

	var pcore = new sm2proxy("http://arestov.github.com", "/SoundManager2/", sm2opts);
	var pcon = $(pcore.getC());
	var complete;


	pcon
		.addClass('sm2proxy')
		.attr('scrolling', 'no');
	
	pcon.on('load', function() {
		setTimeout(function() {
			if (!complete){
				pcon.addClass('long-appearance')
			}
		}, 20000);
	});
	
	
	pcore
		.done(function(){
			complete = true;
			su.p.setCore(pcore);
			pcon.addClass('hidden');
			dstates.add_state('body','flash-internet');

		})
		.fail(function(){
			complete = true;
			pcon.addClass('hidden');
		})
	$(function(){
		$(document.body).append(pcon)
		//$(su.ui.nav).after(pcon);
	});
	
	//$(document.body).append(_this.c);
});



	