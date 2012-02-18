su.player = {
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

