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




var change_volume = function (volume_value){
  suStore('vkplayer-volume', volume_value, true);
  su.player.player_volume = volume_value;	
}

var sm2iframed = {
	c: $('<iframe id="i_f_sm2" src="http://seesu.me/i.html" ></iframe>'),
	text_of_function: function(func){
		return func.toString().replace(/^.*\n/, "").replace(/\n.*$/, "")
	},
	init: function(){
		if (!su.env.cross_domain_allowed){
			return false;
		}
		var _this = this;
	
		if (this.c) {
			
			var last_iframe_func = this.text_of_function(_this.i_func).replace('_volume', su.player.player_volume );
			var scripts_paths = [
				bpath + 'js/common-libs/soundmanager2.js',
				bpath + 'js/seesu.player.sm2.js'
			];

			scripts_data = [];
			
			var all_scripts_data_loaded = false;
			var wait_for_all_script_data = false;
			var add_script_data_callback = function(){return;};
			var send_scripts_to_iframe = function(iframe){
				if (all_scripts_data_loaded){
					console.log('sending')
					iframe.contentWindow.postMessage("append_data_as_script\n" + scripts_data.complete_data, '*');
					
				} else{
					console.log('callbacking')
					wait_for_all_script_data = true;
					add_script_data_callback = function(){
						send_scripts_to_iframe(iframe);
					}
				}
			};
			
			var sort_by_number_order = function(g,f){
				if (g && f) {
					if (g.number > f.number)
						{return 1;}
					else if (g.number < f.number)
						{return -1;}
					else
					{return 0;}
				} else {return 0;}
	
			};
			
			var add_script_data = function(i, l, data){
				scripts_data.push({"number": i, "data": data});
				if (scripts_data.length == (l)){
					scripts_data.sort(sort_by_number_order);
					scripts_data.complete_data = '/*<![CDATA[*/' + '\n';
					for (var m=0; m < scripts_data.length; m++) {
						scripts_data.complete_data += scripts_data[m].data + '\n\n'
					};
					scripts_data.complete_data += 'var sm2_init_p = ' + JSON.stringify(_this.i_params) + ';';
					scripts_data.complete_data += last_iframe_func;
					scripts_data.complete_data += '/* ]]>*/';
	
					all_scripts_data_loaded = true;
					if (wait_for_all_script_data) {
						add_script_data_callback();
					}
				}
			};
			
			if (scripts_paths.length) {
				var get_js = function(i,l){
					$.ajax({
						url: scripts_paths[i].replace(location.href, ''),
						global: false,
						dataType: 'text',
						type: "GET",
						complete: function(xhr){
							add_script_data(i, l, xhr.responseText);
						}
					});
				}
				for (var i=0; i < scripts_paths.length; i++) {
					get_js(i, scripts_paths.length);
				}
			}
			
			var check_iframe = function(e){
				if (e.data.match(/iframe_loaded/)){
					
					console.log('got iframe loaded feedback');
					send_scripts_to_iframe(_this.c[0]);
					
					
				} else if (e.data.match(/sm2_inited/)){
					console.log('iframe sm2 wrokss yearh!!!!');
					yepnope({
						load:  [bpath + 'js/seesu.player.sm2.js'],
						complete: function(){
							su.player.musicbox = new sm2_p(su.player.player_volume, false, _this.c);
						}
					});
					
					clearTimeout(html_player_timer);
					_this.c.addClass('sm-inited');
					dstates.add_state('body','flash-internet');
					$('#sm2-container').remove();
					removeEvent(window, "message", check_iframe);
				}
			};
			addEvent(window, "message", check_iframe);
			
			
			_this.c.on('load',function(){
				console.log('source knows that iframe loaded');
				this.contentWindow.postMessage("test_iframe_loading_state", '*');
				
			});
			
			suReady(function(){
				//$(document.body).append(_this.c);
			});
			
	
		}
	},
	remove: function(){
		this.c.remove();
	},
	i_params: {
		oext: su.env.opera_extension
	},
	i_func: function(){
					
		window.soundManager = new SoundManager('http://seesu.me/swf/', false, {
			flashVersion : 9,
			useFlashBlock : true,
			debugMode : false,
			wmode : sm2_init_p.oext ? 'opaque' : 'transparent',
			useHighPerformance : !sm2_init_p.oext
		});
		if (soundManager){			
			sm2_p_in_iframe = new sm2_p(_volume, soundManager);
			sm2_p_in_iframe.player_source_window = iframe_source;
			soundManager.onready(function() {
				if (soundManager.supported()) {
					iframe_source.postMessage("sm2_inited",'*');
				} else{
					console.log('by some reason sm2 iframe don"t work')
				}
			});
		} else{
			console.log('no sounds');
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
							sm2iframed.remove();
							clearTimeout(html_player_timer);
						} else {
							console.log('sm2 in widget notok')
							sm2iframed.init();
					
						}
					});
				}
			}
		})
	} else {
		sm2iframed.init();
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
