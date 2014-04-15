define(['provoda', 'spv', 'app_serv', 'js/libs/BrowseMap', './user_music_lfm', './Cloudcasts', 'js/modules/declr_parsers'],
function(provoda, spv, app_serv, BrowseMap, user_music_lfm, Cloudcasts, declr_parsers) {
'use strict';
var localize = app_serv.localize;

var SongFansList = function(){};
user_music_lfm.LfmUsersList.extendTo(SongFansList, {
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.initStates(params);
	},
	getRqData: function() {
		return {
			artist: this.state('artist_name'),
			track: this.state('track_name')
		};
	},
	'nest_req-list_items': [
		declr_parsers.lfm.getUsers('topfans', true),
		['lfm', 'get', function() {
			return ['track.getTopFans', this.getRqData()];
		}]
	],
	beforeReportChange: function(list) {
		list.sort(function(a,b ){return spv.sortByRules(a, b, [
			{
				field: function(item) {
					var image = item.state('lfm_img');
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
		return list;
	}
});

var SongCard = function() {};
BrowseMap.Model.extendTo(SongCard, {
	model_name: 'songcard',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.sub_pa_params = {
			artist_name: params.artist_name,
			track_name: params.track_name
		};
		this.initStates(params);
		this.on('state_change-mp_show', function(e) {
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


		var cloudcasts = this.getSPI('cloudcasts', true);
		this.updateNesting('cloudcasts', cloudcasts);

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
			title: localize('Top fans')
		},
		'cloudcasts': {
			constr: Cloudcasts.SongcardCloudcasts,
			title: 'Cloudcasts'
		}
	}
});
return SongCard;
});