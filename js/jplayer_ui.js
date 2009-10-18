function startup_player() {

  function on_player_ready() {
    console.log('bazinga!');
  /*$(this).setFile(
			  "http://cs4530.vkontakte.ru/u45969345/audio/e1de8ab6d542.mp3"
			).play();
			*/
			//demoInstanceInfo($(this), $("#jplayer_info"));
  }

  $('#jplayer').jPlayer({ ready: on_player_ready });

  $('#jplayer').jPlayerId("play", "jplayer-play"); // Associates play  
  $("#jplayer").jPlayerId("pause", "jplayer-pause"); // Associates pause  
  $("#jplayer").jPlayerId("stop", "jplayer-stop"); // Associates stop  
  
  /*$("#jplayer").onSoundComplete(function() { // Executed when the mp3 ends  
    $(this).play(); // Auto-repeat  
  });  */
	
	
	/*
	.jPlayerId("play", "player_play")
	.jPlayerId("pause", "player_pause")
	.jPlayerId("stop", "player_stop")
	.jPlayerId("loadBar", "player_progress_load_bar")
	.jPlayerId("playBar", "player_progress_play_bar")
	.jPlayerId("volumeMin", "player_volume_min")
	.jPlayerId("volumeMax", "player_volume_max")
	.jPlayerId("volumeBar", "player_volume_bar")
	.jPlayerId("volumeBarValue", "player_volume_bar_value")
	.onProgressChange( function(loadPercent, playedPercentRelative, playedPercentAbsolute, playedTime, totalTime) {
		var myPlayedTime = new Date(playedTime);
		var ptMin = (myPlayedTime.getUTCMinutes() < 10) ? "0" + myPlayedTime.getUTCMinutes() : myPlayedTime.getUTCMinutes();
		var ptSec = (myPlayedTime.getUTCSeconds() < 10) ? "0" + myPlayedTime.getUTCSeconds() : myPlayedTime.getUTCSeconds();
		$("#play_time").text(ptMin+":"+ptSec);

		var myTotalTime = new Date(totalTime);
		var ttMin = (myTotalTime.getUTCMinutes() < 10) ? "0" + myTotalTime.getUTCMinutes() : myTotalTime.getUTCMinutes();
		var ttSec = (myTotalTime.getUTCSeconds() < 10) ? "0" + myTotalTime.getUTCSeconds() : myTotalTime.getUTCSeconds();
		$("#total_time").text(ttMin+":"+ttSec);
	})
	.onSoundComplete( function() {
		$(this).play();
	});*/
}
