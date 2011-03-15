var views = function(){
	this.m = new browseMap();
}
views.prototype = {
	getCurrentSearchResultsContainer: function(){
		return this.m.getLevel(0);
	},
	getSearchResultsContainer: function(){
		var c = this.m.getFreeLevel(0);
		if (!c.ui){
			c.ui = $('<div class="search-results-container current-src"></div').appendTo(seesu.ui.els.searchres);
		}
		return c
	},
	getPlaylistContainer: function(skip_from){
		var c = this.m.getFreeLevel(1, 1-(skip_from + 1));
		if (!c.ui){
			 c.ui = $('<ul class="tracks-c current-tracks-c"></ul>').appendTo(seesu.ui.els.artsTracks);
		} 
		return c;
	},
	getCurrentPlaylistContainer: function(){
		return this.m.getLevel(1);
	},
	findViewOfURL: function(url, only_freezed){
		return this.m.findURL(1, url, only_freezed);
	},
	
	findViewOfSearchQuery: function(query){
		return this.m.findLevelOfSearchQuery(1, query);
	},
	findViewOfPlaylist: function(puppet, only_playing){
		return this.m.findLevelOfPlaylist(1, puppet, only_playing);
	},
	freeze: function(g, not_reset_searches){
		var newfreeze = this.m.freezeMapOfLevel(1);
		if (newfreeze && !not_reset_searches){
			su.mp3_search.abortAllSearches();
		}
	},
	restoreFreezed: function(){
		this.m.restoreFreezed();
		var l = this.m.getLevel(1); // playlist page is 1 level
		if (l){
			this.swithToPlaylistPage(l.context.pl);
		}
	},

	show_now_playing: function(){
		var current_page = seesu.ui.els.slider.className;
		this.restoreFreezed();
		su.player.view_song(su.player.c_song, true);
		seesu.track_event('Navigation', 'now playing', current_page);
	},
	show_start_page: function(focus_to_input, log_navigation, init){
		// start page is -1 level
		this.m.sliceToLevel(-1);
		
		
		this.nav.daddy.empty();
		this.nav.daddy.append($('<img class="nav-title" title="Seesu start page" src="i/nav/seesu-nav-logo.png"/>').click(function(){
			seesu.ui.els.search_input[0].focus();
			seesu.ui.els.search_input[0].select();
		}));
		seesu.ui.els.slider.className = "show-start";
		if (focus_to_input){
			seesu.ui.els.search_input[0].focus();
			seesu.ui.els.search_input[0].select();
		}
		if (init){
			this.nav.daddy.removeClass('not-inited')
		} else{
			su.ui.navi.set('');
		}
		if (log_navigation){
			seesu.track_page('start page');
		}
		
		this.state = 'start';
	
	},
	show_search_results_page: function(without_input){
		// search results is 0 level
		this.m.sliceToLevel(0);
		
		
		this.nav.daddy.empty();
		this.nav.daddy.append(this.nav.start.unbind().click(function(){
			seesu.ui.views.show_start_page(true, true);
		}));
		this.nav.daddy.append('<img class="nav-title" title="Suggestions &amp; search" src="i/nav/seesu-nav-search.png"/>');
		var _s = seesu.ui.els.slider.className;
		var new_s = (without_input ? '' : 'show-search ') + "show-search-results";
		if (new_s != _s){
			seesu.ui.els.slider.className = new_s;
		
			seesu.track_page('search results');
		}
		this.state = 'search_results';
		su.ui.navi.set(this.getCurrentSearchResultsContainer().getFullURL());
		
		
	},
	swithToPlaylistPage: function(pl){
		// playlist page is 1 level
		this.m.sliceToLevel(1);
		
		this.nav.daddy.empty();
		if (pl.with_search_results_link){
			this.nav.daddy.append(this.nav.results.unbind().click(function(){
				seesu.ui.views.show_search_results_page(true);
			}));
		} else{
			this.nav.daddy.append(this.nav.start.unbind().click(function(){
				seesu.ui.views.show_start_page(true, true);
			}));
		}
		this.nav.daddy.append('<span class="nav-title" src="i/nav/seesu-nav-search.png">' + pl.playlist_title + '</span>');
		$(seesu.ui.els.nav_playlist_page).text(pl.playlist_title);
		if (pl.with_search_results_link) {
			seesu.ui.els.slider.className = 'show-full-nav show-player-page';
		} else {
			seesu.ui.els.slider.className = 'show-player-page';
		}
		this.state = 'playlist';
		
		su.ui.navi.set(this.getCurrentPlaylistContainer().getFullURL());
		seesu.track_page('playlist', pl.playlist_type);
	},
	show_playlist_page: function(p, slice_level){
		var skip_from;
		if (typeof slice_level == 'number'){
			
			this.m.sliceToLevel(skip_from = slice_level);
			// we want to clear map exept few first levels
		} else{
			// playlist page is 1 level
			this.m.sliceToLevel(skip_from = -1);
			//we want to clear map
			
		}
		var pl = p;
		if (!pl){
			var lev = this.getCurrentPlaylistContainer();
			pl = lev.context.pl;
		}

		if (pl && pl.loading){
			var lev = this.getPlaylistContainer(skip_from);
			lev.context.pl = pl; 
			pl.ui = lev.ui.addClass('loading');
			lev.setURL(getUrlOfPlaylist(pl));
		}
		if (pl && pl.length){
			
			var ui = (pl.ui && pl.ui[0] && pl.ui[0].parentNode && (pl.ui[0].ownerDocument == _sui.d) && pl.ui.show());
			if (!ui){
				var lev = _sui.views.getPlaylistContainer(skip_from);
				lev.context.pl = pl;
				ui = lev.ui;
				lev.setURL(getUrlOfPlaylist(pl));
			}
			seesu.ui.render_playlist(pl);
		}
		this.swithToPlaylistPage(pl);
		
		
		
		
	},
	show_track_page: function(title, zoom, mo){
		var pl = mo.plst_titl;
		
		if (title){
			seesu.ui.els.nav_track_zoom.text(title);
		}
		
		if (zoom){
			$(seesu.ui.els.slider).addClass('show-zoom-to-track');
			this.state = 'track';
		}
		if (zoom || this.state == 'track'){
			this.nav.daddy.empty();
			this.nav.daddy.append(this.nav.playlist.unbind().click(function(){
					seesu.ui.views.swithToPlaylistPage(pl);
			}));
			
			this.nav.daddy.append('<span class="nav-title" title="Suggestions &amp; search" src="i/nav/seesu-nav-search.png">' + title + '</span>');
		}
		
		
		su.ui.navi.set(this.getCurrentPlaylistContainer().getFullURL() + mo.getURLPart());
	}
}


window.seesu_ui = function(d, with_dom){
	this.d = d;
	if (!with_dom){
		dstates.connect_ui(this);
	} else {
		this.views = new views();
	}
	
	
	this.buttons_li = {};
	
	this.now_playing ={
		link: null,
		nav: null
	};
	
	
	if (with_dom){
		connect_dom_to_som(d, this);
	}
}
seesu_ui.prototype = {
	navi: {
		app_hash: '',
		set: function(u){
			var url = u.replace(/\s/g,'+')
			console.log(url)
			return
			if (this.app_hash != url){
				location.assign('#' + url);
				this.app_hash = url;
			}
			
		}	
	},
	show_tag: function(tag, query){
		
		var pl_r = prepare_playlist('Tag: ' + tag, 'artists by tag', tag, query);
		get_artists_by_tag(tag, function(pl){
			proxy_render_artists_tracks(pl, pl_r);
		}, function(){
			proxy_render_artists_tracks();
		});
		this.views.show_playlist_page(pl_r, query ? 0 : false);
	
	},
	show_track: function(q){
		var title;
		if (q.q){
			title= q.q;
		} else if (q.artist || q.track){
			title = (q.artist || '') + " - " + (q.track || '');
		} else{
			title = 'unknow';
		}
		
		var pl_r = prepare_playlist(title , 'tracks', q , title)
		this.views.show_playlist_page(pl_r, 0);
		su.mp3_search.find_files(q, false, function(err, pl, c, complete){
			if (complete){
				c.done = true;
				var playlist = [];
				if (pl && pl.length){
					for (var i=0; i < pl.length; i++) {
						if (pl[i].t){
							playlist.push.apply(playlist, pl[i].t);
						}
					};
				}
				
				var playlist_ui = create_playlist(playlist.length && playlist, pl_r);
				if (!su.mp3_search.haveSearch('vk')){
					playlist_ui.prepend($('<li></li>').append(su.ui.samples.vk_login.clone()));
				}
				
			}
			
			
		}, false);

		
		
	},
	show_artist: function (artist,with_search_results) {
		var pl = prepare_playlist(artist, 'artist', artist, with_search_results)
		var plist = su.ui.views.findViewOfURL(getUrlOfPlaylist(pl));
		if (plist){
			if (plist.freezed){
				su.ui.views.restoreFreezed();
			}
		} else{
			this.views.show_playlist_page(pl, with_search_results ? 0 : false);
			getTopTracks(artist,function(track_list){
				create_playlist(track_list, pl);
			});
			lfm('artist.getInfo',{'artist': artist });
		}
		
	
		
	},
	createFilesListElement: function(mopla, mo){
		
		var li = $('<li></li>');
		
		var desc_part = $('<span class="desc-name"></span>').appendTo(li);
		var main_part = $('<span class="desc-text"></span>').appendTo(li);
		
		
		var songitself = $('<a class="js-serv"></a>')
			.text(mopla.artist + " - " + mopla.track)
			.click(function(){
				su.player.play_song(mo, true, mopla)
			}).appendTo(main_part);
			
		var d = $('<span class="duration"></span>').appendTo(desc_part);
		if (mopla.duration){
			var digits = mopla.duration % 60;
			d.text((Math.round(mopla.duration/60)) + ':' + (digits < 10 ? '0'+digits : digits ));
		}
		
		
		var mp3l = $('<a class="desc external"></a>').appendTo($('<span class="mp3-file-link"></span>').appendTo(desc_part));
		if (mopla.downloadable){
			mp3l.attr('href', mopla.link).text('mp3')
		}
			
		if (mopla.page_link){
			$('<a class="external desc page-link" href="' + mopla.page_link + '">page</a>').appendTo(desc_part);
			
		}
		return li;
	},
	createFilesList: function(part, mo){
		if (part.t && part.t.length){
			var fl = $();
			fl = fl.add($('<div class="files-source"></div>').text(part.name));
			var ul = $('<ul></ul>');
			fl = fl.add(ul);
			for (var i=0; i < part.t.length; i++) {
				var el = this.createFilesListElement(part.t[i], mo);
				if (i > 2){
					el.addClass('addition-file')
				}
				ul.append(el);
			};
			return fl;
		}
		
	},
	updateSongContext:function(mo){
		var node = mo.node;
		var artist = mo.artist;
		
		var a_info = mo.ui && mo.ui.a_info;
		if (a_info){
			if (artist) {this.update_artist_info(artist, a_info, mo.plst_titl.playlist_type != 'artist');}
			//this.update_track_info(mo);
			this.show_video_info(mo.ui.tv, artist + " - " + mo.track);
			this.updateSongfiles(mo);
			
			if (su.lfm_api.scrobbling) {
				this.lfm_change_scrobbling(true, mo.ui.context.children('.track-panel').children('.track-buttons'));
			}
		} else{
			console.log('no context for:')
			console.log(mo)
		}
		
	},
	updateSongfiles: function(mo){
		var _sui = this;
		var c = mo.ui.files;
		c.empty();
		/*
		var no_vk = mo.failedFor('vk');
		if (no_vk){
			
		}*/
		var small_head = $('<div class="files-header"></div>').appendTo(c);
		
		
		small_head.append('<span class="desc-name">' + localize('Files', 'Files') + '</span>');
		
		var desc_text = $('<span class="desc-text"></span>').appendTo(small_head);
		
		

		if (mo.isSearchCompleted() && !mo.isHaveAnyResultsFrom('vk')){
			c.append(_sui.samples.vk_login.clone())
		}
		var songs = mo.songs();
		if (songs){
			var sc = $('<div class="files-lists"></div>');
			
			var just_link;
			var extend_link;
			
			
			
			$('<a class="js-serv">' + localize('show-them') +'</a>').click(function(){
				c.toggleClass('show-files');
				return false;
			}).appendTo(desc_text)
			
						
			for (var i=0; i < songs.length; i++) {
				var b = this.createFilesList(songs[i], mo);
				if (b){b.appendTo(sc);}
				if (!extend_link && songs[i].t && songs[i].t.length > 3){
					$('<a class="js-serv all-files-link">' + localize('all', 'all') +'</a>').click(function(){
						c.toggleClass('show-all-files');
						return false;
					}).appendTo(desc_text)
					extend_link = true;
				}
				
				
			};
			
			
			
			sc.appendTo(c)
		} 
		
		
		if (false && mo.isSearchCompleted() && !mo.isHaveAnyResultsFrom('soundcloud')){
			desc.append('<p>try to connect soundcloud search</p>')
		}
	
	},
	update_artist_info: function(artist, a_info, show_link_to_artist_page){
		var _sui = this;
		if (a_info.data('artist') != artist){
			a_info.data('artist', artist);
			var ainf = {
				name: a_info.children('.artist-name').empty(), 
				image: a_info.children('.image'),
				bio: a_info.children('.artist-bio'),
				meta_info: a_info.children('.artist-meta-info'),
				c : a_info
			};
			
			
			var arts_name = $('<span class="desc-name"></span>')
				.appendTo(ainf.name);
				
			if (show_link_to_artist_page){
				$('<a class="js-serv">' + localize('top-tracks') + '</a>')
					.data('artist', artist)
					.appendTo(arts_name)
					.click(function(){
						_sui.show_artist(artist);
						su.track_event('Artist navigation', 'top tracks', artist);
					});
			}
			
			$('<a></a>')
				.attr('href', 'http://www.last.fm/music/' + artist.replace(' ', '+'))
				.text(localize('profile'))
				.attr('title', 'last.fm profile')
				.click(function(){
					var link = 'http://www.last.fm/music/' + artist.replace(' ', '+');
					open_url(link);
					seesu.track_event('Links', 'lastfm', link);
					return false;
				})
				.appendTo(arts_name);
			
			$('<span class="desc-text"></span>')
				.text(artist)
				.appendTo(ainf.name);
				
			
			ainf.bio.text('...');
			ainf.meta_info.empty();
			
			seesu.current_artist = artist;
			lfm('artist.getInfo',{'artist': artist }, function(r){
				if (a_info.data('artist') == artist){
					_sui.show_artist_info(r, ainf, artist);
				}
				
			});
		}
	},
	create_youtube_video: function(id, transparent){
		var youtube_video = document.createElement('embed');
			youtube_video.setAttribute('type',"application/x-shockwave-flash");
			youtube_video.setAttribute('src', 'http://www.youtube.com/v/' + id);
			youtube_video.setAttribute('allowfullscreen',"true");
			youtube_video.setAttribute('class',"you-tube-video");
			if (transparent){
				youtube_video.setAttribute('wmode',"transparent");
			}
		return youtube_video;		
	},
	show_video_info: function(vi_c, q){
		var _this = this;
		var _sui = this;
		if (vi_c.data('has-info')){return true;}
		get_youtube(q, function(r){			
			var vs = r && r.feed && r.feed.entry;
			if (vs && vs.length){
				vi_c.data('has-info', true);
				vi_c.empty();
				vi_c.append('<span class="desc-name"><a target="_blank" href="http://www.youtube.com/results?search_query='+ q +'">' + localize('video','Video') + '</a>:</span>');
				var v_content = $('<ul class="desc-text"></ul>');
			
				var make_v_link = function(img_link, vid, _title){
					var li = $('<li class="you-tube-video-link"></li>').click(function(){
						var showed = this.showed;
						
						_this.remove_video();
						
						if (!showed){
							_sui.video = {
								link: $(this).addClass('active'),
								node: $(_this.create_youtube_video(vid, su.env.opera_widget)).appendTo(v_content)
							}
							seesu.player.set_state('pause');
							this.showed = true;
						} else{
							seesu.player.set_state('play');
							this.showed = false;
						}
						return false;
					});
					
					$("<a class='video-preview'></a>")
						.attr('href', 'http://www.youtube.com/watch?v=' + v_id)
						.append($('<img  alt=""/>').attr('src', img_link))
						.appendTo(li);
					
					$('<span class="video-title"></span>')
						.text(_title).appendTo(li);
						
					li.appendTo(v_content)
				}
				for (var i=0, l = ((vs.length < 3) ? vs.length : 3); i < l; i++) {
					var _v = vs[i],
						tmn = _v['media$group']['media$thumbnail'][0].url,
						v_id = _v['media$group']['yt$videoid']['$t'],
						v_title = _v['media$group']['media$title']['$t'];
						
					make_v_link(tmn, v_id, v_title);
					
				};
				
				v_content.appendTo(vi_c);
				
				
			}
		});
		
	},
	update_track_info: function(mo){
		var ti = mo.ui.info.empty();
		var mo;
		if (mo.mopla && mo.mopla.from && mo.mopla.from == 'soundcloud'){
			if (mo.mopla.page_link){
				var sc_link = $('<a></a>')
					.attr('href', mo.mopla.page_link)
					.text('page of this track')
					.click(function(){
						open_url(mo.mopla.page_link);
						seesu.track_event('Links', 'soundcloud track');
						return false;
					});
			}
			
			ti.append(
				$('<p></p>')
					.text(
						'This track was found in SoundCloud. ' + 
						'It may not match with track you are searching for at all. Try to use vk.com (vkontakte.ru) '
					 )
					 .append(sc_link)
				
			);
		}	
	},
	show_artist_info: function(r, ainf, oa){
		var _sui = this;
		var info	 = r.artist || false;
		var similars, artist, tags, bio, image;
		if (info) {
			similars = info.similar && info.similar.artist;
			artist	 = info.name;
			tags	 = info.tags && info.tags.tag;
			bio		 = info.bio && info.bio.summary.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
			image	 = (info.image && info.image[2]['#text']) || lfm_image_artist;
		} 
			
		if (artist && artist == oa) {
			ainf.bio.parent().addClass('background-changes');
			ainf.image.append($('<img class="artist-image"/>').attr({'src': image ,'alt': artist}));
		} else{
			return false
		}
		if (bio){
			ainf.bio.html(bio);
		}
		
		
		
		
		
		if (tags && tags.length) {
			var tags_p = $("<p class='artist-tags'></p>").append('<span class="desc-name">'+localize('Tags')+':</span>');
			var tags_text = $('<span class="desc-text"></span>').appendTo(tags_p);
			for (var i=0, l = tags.length; i < l; i++) {
				var tag = tags[i],
					arts_tag_node = $("<a></a>")
						.text(tag.name)
						.attr({ 
							href: tag.url,
							'class': 'music-tag js-serv'
						})
						.data('music_tag', tag.name)
						.appendTo(tags_text); //!using in DOM
			}
			ainf.meta_info.append(tags_p);
		}
		
		if (similars && similars.length) {
			var similars_p = $("<p></p>").attr({ 'class': 'artist-similar'}),
				similars_a = $('<a></a>').append(localize('similar-arts')).attr({ 'class': 'similar-artists js-serv'}).data('artist', artist);	
			$('<span class="desc-name"></span>').append(similars_a).appendTo(similars_p).append(document.createTextNode(':'));
			var similars_text = $('<span class="desc-text"></span>').appendTo(similars_p);
			for (var i=0, l = similars.length; i < l; i++) {
				var similar = similars[i],
					arts_similar_node = $("<a class='js-serv'></a>")
					  .text(similar.name)
					  .attr({ 
						href: similar.url, 
						'class' : 'artist js-serv' 
					  })
					  .data('artist', similar.name )
					  .appendTo(similars_text);//!using in DOM
			}
			ainf.meta_info.append(similars_p);
		}
		var artist_albums_container = $('<div class="artist-albums"></div>').append('<span class="desc-name">'+localize('albums')+':</span>').appendTo(ainf.meta_info);
		var artist_albums_text = $('<div class=""></div>').appendTo(artist_albums_container);
		if (artist_albums_container){
			
			var albums_link = $('<a class="js-serv get-artist-albums">' + localize('get-albums')+ '</a>')
				.click(function(){
					var _this = $(this);
					if (!_this.data('albums-loaded')){
						
						artist_albums_container.addClass('albums-loading');
						
						lfm('artist.getTopAlbums',{'artist': artist },function(r){
							if (typeof r != 'object') {return;}
							_sui.artist_albums_renderer(r, artist_albums_text, artist);
							_this.data('albums-loaded', true);
							artist_albums_container.removeClass('albums-loading');
						});
						_this.text(localize('hide-them','hide them'));
						seesu.track_event('Artist navigation', 'show artist info', artist);
					} else{
						_sui.toogle_art_alb_container(_this);
					}
				})
				.appendTo(artist_albums_text);
			artist_albums_container.data('albums_link', albums_link);
		}
		ainf.bio.parent().removeClass('background-changes');
	
	},
	artist_albums_renderer: function(r, container, original_artist){
		var _sui = this;
		var albums = r.topalbums.album;
		var albums_ul = $('<ul></ul>');
		if (albums){
			
			var create_album = function(al_name, al_url, al_image, al_artist){
				var li = $('<li></li>').appendTo(albums_ul);
				var a_href= $('<a></a>')
					.attr('href', al_url )
					.data('artist', al_artist)
					.data('album', al_name)
					.click(function(e){
						e.preventDefault(); 
						
						var pl_r = prepare_playlist('(' + al_artist + ') ' + al_name ,'album', {original_artist: original_artist, album: al_name});
						_sui.views.show_playlist_page(pl_r);
						get_artist_album_info(al_artist, al_name, function(alb_data){
							get_artist_album_playlist(alb_data, pl_r);
						} );
						seesu.track_event('Artist navigation', 'album', al_artist + ": " + al_name);
						return false;
					})
					.appendTo(li);
				$('<img/>').attr('src', al_image).appendTo(a_href);
				$('<span class="album-name"></span>').text(al_name).appendTo(a_href);
			};
			if (albums.length) {
				for (var i=0; i < albums.length; i++) {
					create_album(albums[i].name, albums[i].url, (albums[i].image && albums[i].image[1]['#text']) || '', albums[i].artist.name);
					
				}
			} else if (albums.name){
				create_album(albums.name, albums.url, (albums.image && albums.image[1]['#text']) || '', albums.artist.name );
			}
			
		} else {
			albums_ul.append('<li>No albums information</li>');
		}
		container.append(albums_ul);
	},
	toogle_art_alb_container: function(link){
		var artist_albums_container = link.parent().parent();
		if (artist_albums_container.is('.collapse-albums')){
			artist_albums_container.removeClass('collapse-albums');
			link.text(localize('hide-them', 'hide them'));
		} else{
			artist_albums_container.addClass('collapse-albums');
			link.text(localize('show-them', 'show them'));
		}
	},
	render_playlist: function(pl, not_clear) { // if links present than do full rendering! yearh!
		var _sui = this;
		var ui = pl.ui;
		if (pl.loading){
			ui.removeClass('loading')
			pl.loading = false;
		}
		if (!not_clear){
			ui.empty();
		}
		_sui.els.make_trs.show().data('pl', pl);
		if (!pl.length){
			ui.append('<li>' + localize('nothing-found','Nothing found') + '</li>');
		} else {
			for (var i=0, l = pl.length; i < l; i++) {
				
				ui.append(
					_sui.create_playlist_element(pl[i])
				);
			}
			make_tracklist_playable(pl);
			//make_tracklist_playable(pl);
			//get mp3 for each prepaired node (do many many delayed requests to mp3 provider)
		
			
			
		}
		return pl.ui
	},
	updateSong: function(mo, not_rend){
		var _sui = this;
		var durat = mo.node.find('a.song-duration').remove();
		var down = mo.node.siblings('a.download-mp3').remove();
		mo.node
			.addClass('song')
			.removeClass('search-mp3-failed')
			.removeClass('waiting-full-render')
			.removeClass('mp3-download-is-not-allowed')
			.data('mo', mo)
			.unbind()
			.click(function(){
				_sui.views.freeze(mo.plst_titl);
				su.player.song_click(mo);
			});
		
		
		var mopla = mo.song();
		if (mopla){
			if (mopla.downloadable){
				var mp3 = $("<a class='download-mp3'></a>").text('mp3').attr({'href': mopla.link });
				mp3.insertBefore(mo.node);
			} else{
				mo.node.addClass('mp3-download-is-not-allowed');
			}
			
			if (mopla.duration) {
				var digits = mopla.duration % 60;
				var track_dur = (Math.round(mopla.duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
				mo.node.prepend($('<a class="song-duration"></a>').text(track_dur + ' '));
			}
		}
		
			

		
	},
	create_playlist_element: function(mo){
		var _sui = this;
		var t_context = this.els.track_c.clone(true);
		var tp = t_context.children('.track-panel');
		var track = $("<a></a>")
			.data('mo', mo)
			.data('t_context', t_context)
			.addClass('track-node waiting-full-render')
			.click(empty_song_click),
			li = document.createElement('li');
			
		tp.children('.play-control').children('img.pl-control').data('mo', mo);
		
		
		var a_info = t_context.children('.artist-info');
		var t_info = t_context.children('.track-info') 
		mo.node = track;
		mo.ui = {
			a_info: a_info,
			node: track,
			context: t_context,
			t_info: t_info,
			tv: t_info.children('.track-video'),
			files: t_info.children('.track-files')
		};
		
		
		if (!!mo.track){
			track.text(mo.artist + ' - ' + mo.track);
		} else{
			track.text(mo.artist);
		}

		
		
		var ph = seesu.player.controls.ph.clone(true);
		var tpt = ph.children('.track-progress').data('mo', mo);
		mo.c = {
			tr_progress_t: tpt,
			tr_progress_l: tpt.children('.track-load-progress'),
			tr_progress_p: tpt.children('.track-play-progress')
		};
		ph.prependTo(tp);
			
		var plistel = $(li)
			.data('mo', mo)
			.append(_sui.els.play_controls.node.clone(true).data('mo', mo))
			.append(track)
			.append(t_context);
		
			
		return plistel;
	},
	lfm_logged : function(){
		dstates.add_state('body', 'lfm-auth-done')
		$('.lfm-finish input[type=checkbox]',this.d).attr('checked', 'checked');
		var f = $('.scrobbling-switches', this.d);
		var ii = f.find('input');
		ii.removeAttr('disabled');
	},
	lfm_change_scrobbling:function(enable, context){
		var lfm_ssw = $('.scrobbling-switches', context || this.d);
		if (lfm_ssw) {
			lfm_ssw.find('.enable-scrobbling').attr('checked', enable ? 'checked' : '');
			lfm_ssw.find('.disable-scrobbling').attr('checked',enable ? '' : 'checked');
		}
	},
	search: function(query){
		this.els.search_input.val(query);
		input_change(this.els.search_input[0]);
	},
	create_playlists_link: function(){
		var _ui = this;
		if (!_ui.link && su.gena.playlists.length > 0 && _ui.els.start_screen){
			$('<p></p>').attr('id', 'cus-playlist-b').append(
				_ui.link = $('<a></a>').text(localize('playlists')).attr('class', 'js-serv').click(function(){
					_ui.search('');
					_ui.search(':playlists');
					return false;
				}) 
			).appendTo(_ui.els.start_screen.children('.for-startpage'));
		}
	},
	make_search_elements_index: function(remark_enter_press, after_user){
		var srca = this.views.getCurrentSearchResultsContainer();
		var srui = srca.ui;
		if (!srui){
			return false;
		}
		var search_elements = srui.find('a:not(.nothing-found), button');
		srui.data('search_elements', search_elements)
		for (var i=0 , l = search_elements.length; i < l; i++) {
			$(search_elements[i]).data('search_element_index', i);
		};
		if (remark_enter_press) {
			var active_index = this.els.search_form.data('current_node_index') || 0;
			var new_active_node = search_elements[active_index];
			if (new_active_node) {
				
					var active_node = srui.data('node_for_enter_press');
					if (active_node) {
						active_node.removeClass('active');
					}
					set_node_for_enter_press($(new_active_node), false, after_user);
			}
		}
	},
	remove_video: function(){
		if (this.video){
			if (this.video.link){
				this.video.link.removeClass('active');
				this.video.link[0].showed = false;
				this.video.link = false;
				
			}
			if (this.video.node){
				this.video.node.remove();
				this.video.node = false;
			}
		}
		
	},
	mark_c_node_as: function(marker){
		var s = this.els.artsHolder.add(su.ui.now_playing.link);
		s.each(function(i, el){
			$(el).attr('class', el.className.replace(/\s*player-[a-z]+ed/g, ''));
		});
		switch(marker) {
		  case(PLAYED):
			s.addClass('player-played');
			break;
		  case(STOPPED):
			s.addClass('player-stopped');
			break;    
		  case(PAUSED):
			s.addClass('player-paused');
			break;
		  default:
			//console.log('Do nothing');
		}
	 
  
}



}