var WagonItemPreview = function() {};
provoda.View.extendTo(WagonItemPreview, {
	createBase: function() {
		this.c = $('<span></span>');
	},
	'stch-nav_title': function(state) {
		this.c.text(state);
	}
});


var WagonPreview = function() {};
provoda.View.extendTo(WagonPreview, {
	createBase: function() {
		this.c = $('<div></div>');
		this.header = $('<h4></h4>').appendTo(this.c);
	},
	'stch-nav_title': function(state) {
		this.header.text(state);
	},
	'collch-allp_allt_chart': 'c',
	children_views: {
		allp_allt_chart: WagonItemPreview
	}

});

var TrainPreview = function() {};
provoda.View.extendTo(TrainPreview, {
	createBase: function() {
		this.c = $('<div></div>');
		this.header = $('<h3></h3>').appendTo(this.c);
	},
	'stch-nav_title': function(state) {
		this.header.text(state);
	},
	'collch-wagn_songs': 'c',
	children_views: {
		wagn_songs: {
			main: WagonPreview
		}
	}
});


var MusicConductorPreview = function() {};
provoda.View.extendTo(MusicConductorPreview, {
	createBase: function() {
		this.c = this.root_view.els.start_screen.find('.music-conductor-preview');
		this.header = this.c.find('h2');
		var _this = this;
		this.header.click(function() {
			_this.md.showOnMap();
		});
		this.ww_c = $('<div class="hidden"></div>').appendTo(this.c);
	},
	'stch-can_expand': function(state){
		if (state){
			this.requirePart('start-page-blocks');
		}
	},
	children_views: {
		allp_train: {
			main: TrainPreview
		}
	},
	'collch-allp_train': 'ww_c',
	parts_builder: {
		'start-page-blocks': function() {
			var _this = this;


			var wow_tags= function(tag,c){
				var link = $('<a class="hyped-tag js-serv"></a>')
					.text(tag)
					.click(function(e){
						_this.root_view.md.show_tag(tag);
						su.trackEvent('Navigation', 'hyped at start page', "tag: " + tag );
						e.preventDefault();
					}).appendTo(c);
				c.append(document.createTextNode(' '));
				_this.addWayPoint(link);
				
			};
			
			
			if (window.lastfm_toptags && lastfm_toptags.length){
				var _c = $('<div class="block-for-startpage tags-hyped tags_list"></div>').appendTo(this.c);
				$('<h3></h3>').appendTo(_c)
								.append(localize('Pop-tags','Popular tags'));
				for (var i=0; i < lastfm_toptags.length; i++) {
					wow_tags(lastfm_toptags[i], _c);
				}
			}

			
			var users_play = $('<div class="block-for-startpage users-play-this"></div>').appendTo(this.c);
			var users_limit = 6;
			var showUsers = function(listenings,c, above_limit_value){
				if (listenings.length){
					
					var uselisteningClick = function(e) {
						var a = $(this).data('artist');
						var t = $(this).data('track');
						_this.root_view.md.showArtistTopTracks(a, false, {artist: a, track: t});
					};
						
					var uc = $('<ul></ul>');
					for (var i=0, l = Math.min(listenings.length, Math.max(users_limit, users_limit + above_limit_value)); i < l; i++) {
						var lig = listenings[i];
						if (lig.info){
							var list_item = $('<li></li>')
								.append("<div class='vk-ava'><img alt='user photo' src='" + lig.info.photo + "'/></div>");
								


							$('<div class="desc-row"></div>')
								.append($('<a class="external"></a>').attr('href', 'http://vk.com/id' + lig.vk_id).text(lig.info.first_name))
								.append(document.createTextNode(' ' + localize ('listening') + ' '))
								.appendTo(list_item);




							var song_complect = $('<a class="song-by-user"></a>')
								.data('artist', lig.artist)
								.data('track', lig.title)
								.attr('title',lig.artist + ' - ' + lig.title)
								.click(uselisteningClick);

							$('<span class="song-track-name"></span>').text(lig.title).appendTo(song_complect);
							$('<span class="song-artist_name"></span>').text(lig.artist).appendTo(song_complect);
							

							list_item.append(song_complect).appendTo(uc);
								
								
						}
					}
					uc.appendTo(c);
				}
				return Math.max(users_limit - listenings.length, 0);
			};
			
			var showUsersListenings = function(r){
				users_play.removeClass('loading');
				if (r && r.length){
					if ([].concat.apply([],r).length){
						users_play.empty();
						var _header = $('<h3></h3>').appendTo(users_play)
						.append(localize('User-listening','Users are listening'));
						
						$('<a class="js-serv"></a>').text(localize('refresh')).click(function(e){
							su.s.susd.ligs.getData();
						}).appendTo(_header);
						var above_limit_value = 0;
						for (var i=0; i < r.length; i++) {
							if (r[i] && r[i].length){
								above_limit_value = showUsers(r[i], users_play, above_limit_value);
							}
						}
					}
					
					
				}
				
				

			};
			su.s.susd.ligs.regCallback('start-page', showUsersListenings, function(){
				users_play.addClass('loading');
			});
			
			var _cmetro = $('<div class="block-for-startpage random-metro-chart"></div>').appendTo(this.c);
			var createTrackLink = function(artist, track, track_obj, playlist){


				var chart_song = $('<a class="chart-song"></a>')
					.attr('title', artist + ' - ' + track)
					.click(function(e){
						playlist.showTrack(track_obj);
						e.preventDefault();
					});


				$('<img alt="artist image"/>')
					.attr('src', getTargetField(track_obj, 'lfm_image.array.0.#text') || '')
					.appendTo(chart_song);

				$('<span class="song-artist_name"></span>').text(artist).appendTo(chart_song);
				$('<span class="song-track-name"></span>').text(track).appendTo(chart_song);
				


				




				return chart_song;
			};
			var current_chart;
			var showMetroRandom = function(){
				var random_metro = getSomething(lastfm_metros);
				_cmetro.addClass('loading');
				lfm.get('geo.getMetroUniqueTrackChart', {
					country: random_metro.country,
					metro: random_metro.name,
					start: (new Date()) - 60*60*24*7})
					.done(function(r){
						_cmetro.removeClass('loading');
						if (r && r.toptracks && r.toptracks.track){
							
							
							jsLoadComplete({
								test: function() {
									return window.su && window.songsList;
								},
								fn: function() {
									_cmetro.empty();

									//var ppp = su.createMetroChartPlaylist(random_metro.country, random_metro.name);
							
									var plr = su.createSonglist(su.start_page, {//fix params for cache
										title: 'Chart of ' + random_metro.name,
										type: 'chart',
										data: {country: random_metro.country, metro: random_metro.name}
									});
									

									current_chart = plr;

									var metro_tracks = r.toptracks.track;
									var _header =  $('<h3></h3>').appendTo(_cmetro)
										.append(localize('last-week-с') + ' ' + random_metro.name)
										.append('<span class="desc"> (' + random_metro.country + ') </span>')
										.append(localize('listen-this') + " ");

									var canUseWP = function() {
										return current_chart == plr;
									};

									var refresh_b = $('<a class="js-serv refresh-in-header"></a>').text(localize('refresh')).click(function(e){
										showMetroRandom();
										e.preventDefault();
									}).appendTo(_header);
									_this.addWayPoint(refresh_b, {
										canUse: canUseWP
									});


									var show_pl_b = $('<a class="js-serv show-in-header"></a>').text(localize('show')).click(function(e){
										plr.showOnMap();
										e.preventDefault();
									}).appendTo(_header);
									_this.addWayPoint(show_pl_b, {
										canUse: canUseWP
									});
									
						
									var ulm = $('<ul class="metro-tracks"></ul>');
									var counter = 0;
									for (var i=0; i < metro_tracks.length; i++) {
										if (counter <30){
											var _trm = metro_tracks[i];
											
											if (_trm.image){
												var con = $('<li></li>').appendTo(ulm);
												
												
												var tobj = {
													artist: _trm.artist.name,
													track: _trm.name,
													lfm_image: {
														array: _trm.image
													}
												};
												plr.addOmo(tobj);
												var track_link = createTrackLink(_trm.artist.name, _trm.name, tobj, plr);
												
												track_link.appendTo(con);
												_this.addWayPoint(track_link, {canUse: canUseWP});

												++counter;
											
											}
										} else{
											break;
										}
									}
									_cmetro.append(ulm);
								}
							});
							
						} else{
							showMetroRandom();
						}
					});
					
			};
			showMetroRandom();
			
			
			
			
			


			return true;

		}
	}
});


var MusicConductorView = MusicConductorPreview;
