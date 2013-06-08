define(['./LastfmAPI', 'spv', 'app_serv'], function(LastfmAPI, spv, app_serv) {
"use strict";
var LastfmAPIExtended = function() {};
LastfmAPI.extendTo(LastfmAPIExtended, {
	init: function() {
		this._super.apply(this, arguments);

		this.music = this.stGet && this.stGet('lfm_scrobble_music') || [];
		var _this = this;
	},
	nowplay: function(omo, duration){
		var _this = this;
		if (!_this.sk){return false;}
		_this.post('track.updateNowPlaying', {
			sk: _this.sk,
			artist: omo.artist,
			track: omo.track,
			duration: duration || ""
		});
	},
	submit: function(omo, duration, timestamp){
		var _this = this;
		var artist = omo.artist,
			track = omo.track;

		this.music.push({
			'artist': artist,
			'track': track,
			'duration': duration || "",
			'timestamp': timestamp
		});

		if (this.sk){
			var post_m_obj = {sk: _this.sk};
			for (var i=0,l=_this.music.length; i < l; i++) {
				post_m_obj['artist[' + i + ']'] = _this.music[i].artist;
				post_m_obj['track[' + i + ']'] = _this.music[i].track;
				post_m_obj['timestamp[' + i + ']'] = _this.music[i].timestamp;
				if (_this.music[i].duration){
					post_m_obj['duration[' + i + ']'] = _this.music[i].duration;
				}
			}

			_this.post('track.scrobble', post_m_obj)
				.done(function(r){
					_this.music = [];
					_this.stSet('lfm_scrobble_music', '');
				});
		} else{
			_this.stSet('lfm_scrobble_music', _this.music);
		}
		return timestamp;
	}
});
return LastfmAPIExtended;
});