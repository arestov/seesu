define(function(require) {
"use strict";
var LastfmAPI = require('./LastfmAPI');

var LastfmAPIExtended = function() {};
LastfmAPI.extendTo(LastfmAPIExtended, {
	init: function() {
		this._super.apply(this, arguments);

		this.music = this.stGet && this.stGet('lfm_scrobble_music') || [];
	},
	nowplay: function(omo, duration){
		var _this = this;
		if (!_this.sk){return false;}
		var obj = {
			sk: _this.sk,
			artist: omo.artist,
			track: omo.track,
			duration: duration || ""
		};
		if (omo.album) {
			obj.album = omo.album;
		}
		return _this.post('track.updateNowPlaying', obj);
	},
	submit: function(omo, duration, timestamp){
		var _this = this;

		this.music.push({
			'artist': omo.artist,
			'track': omo.track,
			'album': omo.album || '',
			'duration': duration || '',
			'timestamp': timestamp
		});

		if (this.sk){
			var post_m_obj = {sk: this.sk};
			for (var i=0, l = this.music.length; i < l; i++) {
				var cur = _this.music;
				post_m_obj['artist[' + i + ']'] = cur[i].artist;
				post_m_obj['track[' + i + ']'] = cur[i].track;
				if (cur[i].album){
					post_m_obj['album[' + i + ']'] = cur[i].album;
				}
				post_m_obj['timestamp[' + i + ']'] = cur[i].timestamp;
				if (cur[i].duration){
					post_m_obj['duration[' + i + ']'] = cur[i].duration;
				}

			}

			_this.post('track.scrobble', post_m_obj)
				.then(function(){
					_this.music = [];
					_this.stSet('lfm_scrobble_music', '');
				});
		} else{
			_this.stSet('lfm_scrobble_music', this.music);
		}
		return timestamp;
	}
});
return LastfmAPIExtended;
});
