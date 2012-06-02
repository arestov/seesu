var seesuPlayer;
(function() {
	"use strict";
	seesuPlayer = function(){
		this.init();
	};


	playerComplex.extendTo(seesuPlayer, {
		global_volume: false,
		init: function(){
			this._super();
		},
		events: {
			finish: function(e){
				if (this.c_song == e.song_file.mo){
					this.playNext(this.c_song, true);
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
					this.changeAppMode();
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
			su.main_level.nowPlaying(mo);
		}
	});
})();

(function() {
	"use strict";
	su.p = new seesuPlayer();

	su.p
		.on('finish', function(e){
			var mo = e.song_file.mo;
			
			var duration = Math.round(mo.mopla.duration/1000);
			if (lfm.scrobbling) {
				lfm.submit(mo, duration);
			}
			if (su.s.loggedIn()){
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
			if (su.s.loggedIn()){
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
})();
(function() {
	"use strict";
	var sm2opts = {};
	if (su.env.opera_extension){
		sm2opts.wmode = 'opaque';
		sm2opts.useHighPerformance = false;
	} else {
		if (su.env.opera_widget){
			sm2opts.wmode = 'transparent';
		}
	}

	//su.p.setCore(pcore);

	var
		aw, 
		h5a = (h5a = document.createElement('audio')) && !!(h5a.canPlayType && h5a.canPlayType('audio/mpeg;').replace(/no/, ''));

	if (h5a){
		jsLoadComplete(function() {
			yepnope({
				load:  [bpath + 'js/prototypes/player.html5.js'],
				complete: function() {
					su.p.setCore(new html5AudioCore());
					su.main_level.updateState('flash-internet', true);
				}
			});
		});
	} else if ((aw = document.createElement('object'), aw.classid = "CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95") && 'EnableContextMenu' in aw && aw.attachEvent){
		jsLoadComplete(function() {
			yepnope({
				load:  [bpath + 'js/prototypes/player.wmp.js'],
				complete: function() {
					su.p.setCore(new wmpAudioCore());
					su.main_level.updateState('flash-internet', true);
				}
			});
		});
	} else {
		if (false && !su.env.cross_domain_allowed){
			suReady(function(){
				yepnope({
					load:  [bpath + 'js/common-libs/soundmanager2.mod.min.js', bpath + 'js/prototypes/player.sm2-internal.js'],
					complete: function(){
						var pcore = new sm2internal(bpath + "swf/", sm2opts);
						var pcon = $(pcore.getC());
						var complete;


						pcon
							.addClass('sm2proxy')
							.attr('scrolling', 'no');
						
						pcon.on('load', function() {
							setTimeout(function() {
								if (!complete){
									pcon.addClass('long-appearance');
								}
							}, 7000);
						});
						
						
						pcore
							.done(function(){
								complete = true;
								su.p.setCore(pcore);
								setTimeout(function(){
									pcon.addClass('sm2-complete');
								}, 1000);
								//
								su.main_level.updateState('flash-internet', true);

							})
							.fail(function(){
								complete = true;
								//pcon.addClass('hidden');
							});
						$(function(){
							$(document.body).append(pcon);
							pcore.appended();
							//$(su.ui.nav).after(pcon);
						});
						
						//$(document.body).append(_this.c);
					}
				});
			});

		} else {
			if (su.env.iframe_support){

				
				suReady(function(){
					yepnope({
						load:  [bpath + 'js/prototypes/player.sm2-proxy.js'],
						complete: function(){
							var pcore = new sm2proxy("http://arestov.github.com", "/SoundManager2/", sm2opts);
							var pcon = $(pcore.getC());
							var complete;


							pcon
								.addClass('sm2proxy')
								.attr('scrolling', 'no');
							
							pcon.on('load', function() {
								setTimeout(function() {
									if (!complete){
										pcon.addClass('long-appearance');
									}
								}, 7000);
							});
							
							
							pcore
								.done(function(){
									complete = true;
									su.p.setCore(pcore);
									setTimeout(function(){
										pcon.addClass('sm2-complete');
									}, 1000);
									su.main_level.updateState('flash-internet', true);

								})
								.fail(function(){
									complete = true;
									pcon.addClass('hidden');
								});
							$(function(){
								$(document.body).append(pcon);
								//$(su.ui.nav).after(pcon);
							});
							
							//$(document.body).append(_this.c);
						}
					});

					
				});
			}
		}
		
	}
})();

