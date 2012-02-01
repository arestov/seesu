var INIT     = -11,
	CREATED  = -7,
	VOLUME   = -5,
	STOPPED  =  1,
	PLAYED   =  5,
	PAUSED   =  7,
	FINISHED =  11;



su.player = {
	player_volume 	: ( function(){
		var volume_preference = suStore('vkplayer-volume');
		if (volume_preference && (volume_preference != 'undefined') && volume_preference != 'NaN'){
			return parseFloat(volume_preference) || 80
		} else {
			return 80
		}
	  })(),
	player_state: STOPPED,
	current_external_playlist: null,
	events 				: [],
	current_song 		: null,
	musicbox			: {
	}, //music box is a link to module with playing methods, 
		//for e.g. soundmanager2 and vkontakte flash player
	call_event: function	(event, data) {
	  var args = Array.prototype.slice.call(arguments);
	  if(this.events[args.shift()]) this.events[event].apply(this,args);
	},
	set_state:function (new_player_state_str) {
	  var new_player_state =
		(new_player_state_str == "play" ? PLAYED :
		  (new_player_state_str == "stop" ? STOPPED : PAUSED)
		);
	  switch(this.player_state - new_player_state) {
		  case(STOPPED - PLAYED):
			if (this.musicbox.play_song_by_url && this.c_song) {
				this.musicbox.play_song_by_url(this.c_song.mopla.link);
			};
			break;
		  case(PAUSED - PLAYED):
			if (this.c_song){
				this.c_song.updateState('play', 'playing');
			}
			this.musicbox.play();
			break;    
		  case(PAUSED - STOPPED):
		  case(PLAYED - STOPPED):
			this.musicbox.stop();
			break;
		  case(PLAYED - PAUSED):
			this.musicbox.pause();
			break;
		  default:
			//console.log('Do nothing');
	  }
	}
};



var html_player_timer;
(function(){
	return
	var a = document.createElement('audio');
	var aw = document.createElement('object');
		aw.classid = "CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95";
	if(!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''))){
		yepnope({
			load: bpath + "js/seesu.player.html5.js", 
			complete: function(){
				
				su.player.musicbox = new html5_p(su.player.player_volume);
				suReady(function(){
					dstates.add_state('body','flash-internet');
				});
				
			}
		});
		
	} else if ('EnableContextMenu' in aw && aw.attachEvent){

		yepnope({
			load: bpath + "js/seesu.player.wmp_p.js", 
			complete: function(){

				su.player.musicbox = new wmp_p(su.player.player_volume);
				suReady(function(){
					dstates.add_state('body','flash-internet');
				});

			}
		});
	} else if (!su.env.cross_domain_allowed){ //sm2 can't be used directly in sandbox
		yepnope({
			load:  [bpath + 'js/common-libs/soundmanager2.js', bpath + 'js/seesu.player.sm2.js'],
			complete: function(){
				soundManager = new SoundManager('http://seesu.me/swf/', false, {
					flashVersion : 9,
					useFlashBlock : true,
					debugMode : false,
					wmode : su.env.opera_extension ? 'opaque' : 'transparent',
					useHighPerformance : !su.env.opera_extension
				});
				if (soundManager){	
					soundManager.onready(function() {
						if (soundManager.supported()) {
							console.log('sm2 in widget ok')
							su.player.musicbox = new sm2_p(su.player.player_volume, soundManager);
							suReady(function(){
								dstates.add_state('body','flash-internet');
							})
							clearTimeout(html_player_timer);
						} else {
							console.log('sm2 in widget notok');
					
						}
					});
				}
			}
		})
	} 
})();


su.gena = { //this work with playlists

	save_playlists: function(){
		var _this = this;
		if (this.save_timeout){clearTimeout(this.save_timeout);}
		
		this.save_timeout = setTimeout(function(){
			var plsts = [];
			var playlists = _this.playlists;
			for (var i=0; i < playlists.length; i++) {
				plsts.push(playlists[i].simplify())
			};
			suStore('user_playlists', plsts, true);
		},10);
		
	},
	create_userplaylist: function(title,p, manual_inject){
		var _this = this;
		var pl_r = p || prepare_playlist(title, 'cplaylist', {name: title});
		if (!manual_inject){
			this.playlists.push(pl_r);
		}
		
		var oldpush = pl_r.push;
		pl_r.push = function(){
			oldpush.apply(this, arguments);
			_this.save_playlists();
		}
		return pl_r;
	}
	
};

var extent_array_by_object = function(array, obj){
	for (var a in obj) {
		if (a != 'length'){
			array[a] = obj[a];
		}
	};
};
function rebuildPlaylist(saved_pl){
	var p = prepare_playlist(saved_pl.playlist_title, saved_pl.playlist_type, {name: saved_pl.playlist_title});
	for (var i=0; i < saved_pl.length; i++) {
		p.push(saved_pl[i]);
	}
	delete p.loading;
	su.gena.create_userplaylist(false, p, true);
	return p;
};
su.gena.playlists = (function(){
	var pls = [];
	
	var plsts_str = suStore('user_playlists');
	if (plsts_str){
		var spls = plsts_str;
		for (var i=0; i < spls.length; i++) {
			pls[i] = rebuildPlaylist(spls[i]);
		};
	} 
	
	
	pls.push = function(){
		Array.prototype.push.apply(this, arguments);
		su.ui.create_playlists_link();
	}
	pls.find = function(puppet){
		for (var i=0; i < pls.length; i++) {
			if (pls[i].compare(puppet)){
				return pls[i]
			}
			
		};	
	};
	return pls;
})();
