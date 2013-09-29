define(['provoda', 'spv', 'app_serv', 'js/libs/BrowseMap', './user_music_lfm'],
function(provoda, spv, app_serv, BrowseMap, user_music_lfm) {
'use strict';

var SongFansList = function(){};
user_music_lfm.LfmUsersList.extendTo(SongFansList, {
	init: function(opts, params) {
		this._super(opts);
		spv.cloneObj(this.init_states, params);
		this.initStates();
	},
	getRqData: function() {
		return {
			artist: this.state('artist_name'),
			track: this.state('track_name')
		};
	},
	sendMoreDataRequest: function(paging_opts, request_info) {
		return this.sendLFMDataRequest(paging_opts, request_info, {
			method: 'track.getTopFans',
			field_name: 'topfans.user',
			data: this.getRqData(),
			parser: this.friendsParser,
			no_paging: true,
			disallow_paging: true
		});
	},
	beforeReportChange: function(list) {
		list.sort(function(a,b ){return spv.sortByRules(a, b, [
			{
				field: function(item) {
					var image = item.state('lfm_image');
					image = image && (image.lfm_id || image.url);
					if (image && image.search(/gif$/) == -1){
						return 1;
					} else if (!image) {
						return 2;
					} else {
						return 3;
					}
				}
			}
		]);});
	}
});

var SongCard = function() {};
BrowseMap.Model.extendTo(SongCard, {
	model_name: 'songcard',
	init: function(opts, params) {
		this._super(opts);
		spv.cloneObj(this.init_states, params);
		this.sub_pa_params = {
			artist_name: params.artist_name,
			track_name: params.track_name
		};
		this.initStates();
		this.on('state_change.mp_show', function(e) {
			if (e.value){
				this.fullInit();

				var fans = this.getNesting('fans');
				if (fans){
					fans.preloadStart();
				}
			}
		});
	},
	'compx-nav_title': {
		depends_on: ['artist_name', 'track_name'],
		fn: function(artist_name, track_name) {
			return artist_name + ' - ' + track_name;
		}
	},

	initForSong: function() {
		var fans = this.getSPI('fans', true);
		this.updateNesting('fans', fans);
		fans.preloadStart();
	},
	fullInit: function() {
		var artist_name = this.state('artist_name');
		if (artist_name){
			var artcard = this.app.getArtcard(this.state('artist_name'));
			if (artcard){
				this.updateNesting('artist', artcard);
			}
		}
		this.updateNesting('fans', this.getSPI('fans', true));
	},
	sub_pa: {
		'fans':{
			constr: SongFansList,
			title: 'Top fans'
		}
	}
});
return SongCard;
});