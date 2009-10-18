$(document).ready(function(){

	$("#jquery_jplayer").jPlayer({
		ready: function () {
			$(this).setFile("http://cs4507.vkontakte.ru/u18157945/audio/4878bc7d42a5.mp3", "http://www.miaowmusic.com/ogg/Miaow-07-Bubble.ogg").play();
			demoInstanceInfo($(this), $("#jplayer_info"));
		},
		cssPrefix: "different_prefix_example",
		volume: 50,
		oggSupport: false
	})
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
	});
});