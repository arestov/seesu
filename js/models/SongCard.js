define(['pv', 'spv', 'app_serv', 'js/libs/BrowseMap', 'js/libs/morph_helpers',
'./user_music_lfm', './Cloudcasts', './LoadableListBase', './SongsList',
'js/modules/declr_parsers'],
function(pv, spv, app_serv, BrowseMap, morph_helpers,
user_music_lfm, Cloudcasts, LoadableListBase, SongsList,
declr_parsers) {
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

var parseVKPostSong = spv.mmap({
	props_map: {
		artist: 'artist',
		track: 'title',
		side_file: {
			artist: 'artist',
			track: 'title',
			from: ['vk'],
			media_type: ['mp3'],
			duration: ['seconds', 'duration'],
			link: 'url'
		}
	}
}, morph_helpers);


var VKPostSongs = function() {};
SongsList.extendTo(VKPostSongs, {
	init: function(opts, data) {
		this._super.apply(this, arguments);
		this.initStates(data);

		this.app.watchVKCharacter( this, (data.post_type == 'reply' ? data.from_id : data.owner_id), 'owner_info' );
		if (data.owner_id != data.from_id) {
			this.app.watchVKCharacter(this, data.from_id, 'author_info');
		}

		/*
		date
		*/

			//получить информацию о разместившем пользователе

			//получить информацию об авторе

			//дата публикации

			
	},
	'compx-date_desc': [
		['date'],
		function(date) {
			return date && (new Date(date)).toLocaleString();
		}
	]
/*	'nest_req-songs-list': [
		declr_parsers.lfm.getUsers('topfans', true),
		['lfm', 'get', function() {
			return ['track.getTopFans', this.getRqData()];
		}]
	]*/
});


var sortByTypeAndDate = spv.getSortFunc([{
	field: function(obj) {
		return obj.owner_id > 0;
	},
	reverse: true
}, {
	field: 'date'
}]);


var VKPostsList = function() {};
LoadableListBase.extendTo(VKPostsList, {
	init: function(opts, data) {
		this._super.apply(this, arguments);
		//this.sub_pa_params = params;
		this.initStates(data);
		this.on('child_change-lists_list', function(e) {
			var sorted = e.value && e.value.slice().sort(sortByTypeAndDate);
			this.updateNesting('sorted_list', sorted);
		});

	},
	'compx-image_previews': [
		['@owner_info:sorted_list'],
		function (array) {
			var result = [];
			for (var i = 0; i < array.length; i++) {
				var cur= array[i];
				if (!cur) {
					continue;
				}
				
				result.push(cur.photo_medium_rec || cur.photo_50);
			}

			return spv.collapseAll(result);
		}
	],
	model_name: 'vk_posts',
	hp_bound: {
		artist_name: null,
		track_name: null
	},
	//model_name: 'cloudcasts_list',
	//splitItemData: ,
	
	'nest_rqc-lists_list': VKPostSongs,

	'nest_rq_split-lists_list': function(data, source_name) {
		return [data.props, {
			subitems: {
				'songs-list': spv.getTargetField(data, 'attachments.songs')
			},

			subitems_source_name: {
				'songs-list': source_name
			}
		}];
	},
	'nest_req-lists_list': [
		[{
			is_array: true,
			source: 'response.items',
			props_map: {
				props: {
					nav_title: 'owner_id',
					url_part: ['urlp', 'owner_id'],
					from_id: 'from_id',
					owner_id: 'owner_id',
					date: ['timestamp', 'date'],
					post_type: 'post_type',
					text_body: 'text',
					likes: 'likes.count',
					reposts: 'reposts.count',

					photos: [function(array) {

						if (!array) {
							return;
						}
						var photos = [];
						for (var i = 0; i < array.length; i++) {
							var cur = array[i];
			
							if (cur.type == 'photo') {
								photos.push(cur.photo);
								
							}
						}
						return photos;

					}, 'attachments']
				},
				attachments: [function(array) {
					if (!array) {
						return;
					}
					var songs = [];
					
					for (var i = 0; i < array.length; i++) {
						var cur = array[i];
						if (cur.type == 'audio') {
							songs.push(parseVKPostSong(cur.audio));
						}
				
					}
					return {
						songs: songs
					};
				}, 'attachments']

			}
		},
		true,
		[
			['vk_users',
			function(r) {
				return r.response.profiles;
			}],
			['vk_groups',
			function(r) {
				return r.response.groups;
			}]
		]],
		['vktapi', 'get', function() {
			return ['newsfeed.search', {
				q: this.head_props.artist_name + ' ' + this.head_props.track_name + ' has:audio',
				extended: 1
			}, null];
		}]
	]
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
	},
	'compx-nav_title': {
		depends_on: ['artist_name', 'track_name'],
		fn: function(artist_name, track_name) {
			return artist_name + ' - ' + track_name;
		}
	},
	'compx-nest_need': [
		['need_for_song', 'songcard-for-active_song'],
		function(need_for_song, for_asong) {
			return need_for_song || this.utils.isDepend(for_asong);
		}
	],
	'compx-wide_need': [
		['nest_need', 'mp_has_focus'],
		function(nest_need, mp_has_focus) {
			return mp_has_focus || nest_need;
		}
	],

	'nest-fans': ['fans', 'wide_need','wide_need'],
	'nest-cloudcasts': ['cloudcasts', false, 'wide_need'],
	'nest-vk_posts': ['vk_posts', 'nest_need','nest_need'],
	'nest-artist': ['#catalog/[:artist_name]', false, 'mp_has_focus'],

	sub_pa: {
		'fans':{
			constr: SongFansList,
			title: localize('Top fans')
		},
		'cloudcasts': {
			constr: Cloudcasts.SongcardCloudcasts,
			title: 'Cloudcasts'
		},
		'vk_posts': {
			constr: VKPostsList,
			title: 'Posts from vk.com'
		}
	}
});
return SongCard;
});