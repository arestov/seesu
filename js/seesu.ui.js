var views = function(){
	this.browsing={},
	this.playing=false;
	this.current_rc=false;
}
views.prototype = {
	
	get_search_rc: function(){
		if (this.browsing.search_results && (!this.playing || this.browsing.search_results != this.playing.search_results)){
			return (this.current_rc = this.browsing.search_results);
		} else {
			if (this.browsing.search_results){
				this.browsing.search_results.hide();
			}
			return (this.current_rc = this.browsing.search_results = $('<div class="search-results-container current-src"></div').appendTo(seesu.ui.els.searchres));
		}
	},
	get_playlist_c:function(){
		if (this.browsing.playlist && (!this.playing && this.browsing.playlist != this.playing.playlist)){
			return this.browsing.playlist;
		} else {
			if(this.browsing.playlist){
				this.browsing.playlist.hide();
			}
			return (this.browsing.playlist = $('<ul class="tracks-c current-tracks-c"></ul>').appendTo(seesu.ui.els.artsTracks));
		}
	},
	save_view: function(pl, not_make_playable){
		if (this.playing && pl == this.playing.pl){
			return true;
		} else{					
			
			if (this.playing){
				if (this.playing.search_results){
					if (!this.browsing.pl.with_search_results_link || (this.playing.search_results[0] != (this.current_rc && this.current_rc[0]))){
							this.playing.search_results.remove();
					}
				}
				
				if (this.playing.playlist){
					this.playing.playlist.remove();
				}
				
			}
			this.playing = {};
			for (var a in this.browsing) {
				this.playing[a] = this.browsing[a];
			}
			if (!not_make_playable){
				make_tracklist_playable(pl, false, true);
			}
			
		}
		
	},
	restore_view: function(){
		this.new_browse();
		if (this.playing.search_results){
			this.current_rc = this.playing.search_results;
		}
		if (this.playing){
			this.show_playlist_page(
				this.playing.pl,
				true
			);
		}
		
	},
	show_playing: function(){
		if (this.playing.search_results){
			this.current_rc = this.playing.search_results.show();
		}
		if (this.playing.playlist){
			this.playing.playlist.show();
		}
	},
	hide_playing: function(){
		if (this.playing.search_results && (this.playing.search_results[0] != (this.current_rc && this.current_rc[0]))){
			this.playing.search_results.hide();
		
		}
		if (this.playing.playlist && (!this.browsing || this.browsing.playlist != this.playing.playlist)){
			this.playing.playlist.hide();
		}
	},
	show_browsing: function(){
		if (this.browsing.search_results){
			this.current_rc = this.browsing.search_results.show();
		}
		if (this.browsing.playlist){
			this.browsing.playlist.show();
		}
	},
	new_browse: function(){
		if (this.browsing.search_results && (!this.playing || this.playing.search_results != this.browsing.search_results) ){
			this.browsing.search_results.remove();
		}
		if (this.browsing.playlist && (!this.playing || this.playing.playlist != this.browsing.playlist)){
			this.browsing.playlist.remove();
		}
		
		this.browsing ={};
		this.get_search_rc();
	},
	show_now_playing: function(){
		var current_page = seesu.ui.els.slider.className;
		this.restore_view();
		seesu.track_event('Navigation', 'now playing', current_page);
	},
	show_start_page: function(focus_to_input, log_navigation, init){
		this.nav.daddy.empty();
		this.nav.daddy.append('<img class="nav-title" title="Seesu start page" src="i/nav/seesu-nav-logo.png"/>')
		
		
		this.new_browse();
		this.hide_playing();
		
		
		seesu.ui.els.slider.className = "show-start";
		if (focus_to_input){
			seesu.ui.els.search_input[0].focus();
			seesu.ui.els.search_input[0].select();
		}
		if (init){
			this.nav.daddy.removeClass('not-inited')
		}
		
		
		
		if (log_navigation){
			seesu.track_page('start page');
		}
		
		this.state = 'start';
	},
	show_search_results_page: function(without_input){
		this.nav.daddy.empty();
		this.nav.daddy.append(this.nav.start.unbind().click(function(){
			seesu.ui.views.show_start_page(true, true);
		}));
		this.nav.daddy.append('<img class="nav-title" title="Suggestions &amp; search" src="i/nav/seesu-nav-search.png"/>')
		
		
		
		var _s = seesu.ui.els.slider.className;
		var new_s = (without_input ? '' : 'show-search ') + "show-search-results";
		if (new_s != _s){
			seesu.ui.els.slider.className = new_s;
		
			seesu.track_page('search results');
		}
		this.get_playlist_c();
		this.state = 'search_results';
	},
	show_playlist_page: function(pl_r, show_playing){
		var _sui = this;
		var pl = pl_r || this.browsing.pl;
		this.browsing.pl = pl;
		
		
		if (show_playing){
			this.show_playing();
			if (this.playing && this.playing.playlist){
				this.browsing.playlist = this.playing.playlist;
			}
			
			seesu.ui.els.make_trs.show().data('pl', this.playing.mpl);
		} else {
			this.hide_playing();
			seesu.ui.els.make_trs.show().data('pl', this.browsing.mpl);
		}
		
		
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
		
		
		
		_sui.playlist_type = pl.playlist_type || '';
		if (pl.length && !show_playing && (!this.playing || this.playing.pl != pl)){
			seesu.ui.render_playlist(pl);
		}
		
		
		if (pl.with_search_results_link) {
			
			su.ui.now_playing.nav = seesu.ui.els.slider.className = 'show-full-nav show-player-page';
		} else {
			su.ui.now_playing.nav = seesu.ui.els.slider.className = 'show-player-page';
		}
		this.state = 'playlist';
		seesu.track_page('playlist', _sui.playlist_type);
	},
	show_track_page: function(title, zoom){
		seesu.ui.els.nav_track_zoom.text(title);
		if (zoom){
			$(seesu.ui.els.slider).addClass('show-zoom-to-track');
			this.state = 'track';
		}
		if (zoom || this.state == 'track'){
			this.nav.daddy.empty();
			this.nav.daddy.append(this.nav.playlist.unbind().click(function(){
					seesu.ui.views.show_playlist_page();
			}));
			
			this.nav.daddy.append('<span class="nav-title" title="Suggestions &amp; search" src="i/nav/seesu-nav-search.png">' + title + '</span>');
		}
		
	},
	show_pl_page: function(){
		$(seesu.ui.els.slider).removeClass('show-zoom-to-track');
		seesu.track_page('playlist');
	}
}


window.seesu_ui = function(d, with_dom){
	this.d = d;
	if (!with_dom){
		dstates.connect_ui(this);
	}
	
	
	this.views = new views();
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
	show_track: function(query, with_search_results){
		
		
		if (seesu.delayed_search.waiting_for_mp3provider){
			mp3_prov_quene = new funcs_quene();
			seesu.delayed_search.we_need_mp3provider(mp3_prov_quene);
		}
		var pl_r = prepare_playlist(query, 'tracks', with_search_results)
		seesu.ui.views.show_playlist_page(pl_r);
		var used_successful = get_all_tracks(query, function(pl){
			create_playlist(pl, pl_r);
		});
		if (!used_successful && seesu.delayed_search.waiting_for_mp3provider){
			if (mp3_prov_quene) {
				mp3_prov_quene.add(function(){
					get_all_tracks(query,  function(pl){
						create_playlist(pl,pl_r);
					}, true);
				}, true);
			}
		}
		if (!used_successful){
			get_all_tracks(query, function(pl){
				create_playlist(pl,pl_r);
			}, false, true);
		}
		
		
		
	},
	show_artist: function (artist,with_search_results) {
		var pl_r = prepare_playlist(artist, 'artist', with_search_results)
		if (seesu.current_artist == artist && su.ui.views.playlist_type == 'artist') {
			seesu.ui.views.restore_view();
			return true;
		}
		seesu.ui.views.show_playlist_page(pl_r);
		getTopTracks(artist,function(track_list){
			create_playlist(track_list, pl_r);
		});
		lfm('artist.getInfo',{'artist': artist });
	
		
	},
	update_artist_info: function(artist, a_info, not_show_link_to_artist_page){
		var _sui = this;
		if (a_info.data('artist') == artist) {
			if (su.ui.views.playlist_type == 'artist'){
				if (su.player.top_tracks_link){
					su.player.top_tracks_link.remove();
				}
			}
		} else {
			a_info.data('artist', artist);
			var ainf = {
				name: a_info.children('.artist-name').empty(), 
				image: a_info.children('.image').children('img.artist-image'),
				bio: a_info.children('.artist-bio'),
				meta_info: a_info.children('.artist-meta-info'),
				c : a_info
			};
			
			
			var arts_name = $('<span class="desc-name"></span>')
				.appendTo(ainf.name);
				
			if (su.ui.views.playlist_type != 'artist'){
				su.player.top_tracks_link = $('<a class="js-serv">top tracks</a>')
					.data('artist', artist)
					.appendTo(arts_name)
					.click(function(){
						su.ui.show_artist(artist);
						su.track_event('Artist navigation', 'top tracks', artist);
					});
			}	
			
			$('<a></a>')
				.attr('href', 'http://www.last.fm/music/' + artist.replace(' ', '+'))
				.text('profile')
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
				
			ainf.image.attr('src', '').attr('alt', artist);
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
	show_video_info: function(vi_c, q){
		var _this = this;
		if (vi_c.data('has-info')){return true;}
		get_youtube(q, function(r){			
			var vs = r.feed.entry;
			if (vs && vs.length){
				vi_c.append('<span class="desc-name"><a target="_blank" href="http://www.youtube.com/results?search_query='+ q +'">Video</a>:</span>');
				var v_content = $('<ul class="desc-text"></ul>');
			
				var make_v_link = function(img_link, vid, _title){
					var li = $('<li class="you-tube-video-link"></li>').click(function(){
						var showed = this.showed;
						
						_this.remove_video();
						
						if (!showed){
							su.ui.video = {
								link: $(this).addClass('active'),
								iframe: $('<iframe class="you-tube-video"></iframe>').attr('src', 'http://www.youtube.com/embed/' + vid).appendTo(v_content)
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
				vi_c.data('has-info', true);
				
			}
		});
		
	},
	update_track_info: function(a_info, node){
		var ti = a_info.find('.track-info').empty();
		var mo = node.data('mo_pla');
		if (mo.from && mo.from == 'soundcloud'){
			if (mo.page_link){
				var sc_link = $('<a></a>')
					.attr('href', mo.page_link)
					.text('page of this track')
					.click(function(){
						open_url(mo.page_link);
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
			ainf.image.attr({'src': image ,'alt': artist});
		} else{
			return false
		}
		if (bio){
			ainf.bio.html(bio);
		}
		
		
		
		
		
		if (tags && tags.length) {
			var tags_p = $("<p class='artist-tags'></p>").append('<span class="desc-name">Tags:</span>');
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
				similars_a = $('<a></a>').append('Similar artists').attr({ 'class': 'similar-artists js-serv'}).data('artist', artist);	
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
		var artist_albums_container = $('<div class="artist-albums"></div>').append('<span class="desc-name">Albums:</span>').appendTo(ainf.meta_info);
		var artist_albums_text = $('<div class=""></div>').appendTo(artist_albums_container);
		if (artist_albums_container){
			
			var albums_link = $('<a class="js-serv get-artist-albums">get albums</a>')
				.click(function(){
					var _this = $(this);
					if (!_this.data('albums-loaded')){
						
						artist_albums_container.addClass('albums-loading');
						
						lfm('artist.getTopAlbums',{'artist': artist },function(r){
							if (typeof r != 'object') {return;}
							_sui.artist_albums_renderer(r, artist_albums_text);
							_this.data('albums-loaded', true);
							artist_albums_container.removeClass('albums-loading');
						});
						_this.text('hide them');
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
	artist_albums_renderer: function(r, container){
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
						
						var pl_r = prepare_playlist('(' + al_artist + ') ' + al_name ,'album')
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
			link.text('hide them');
		} else{
			artist_albums_container.addClass('collapse-albums');
			link.text('show them');
		}
	},
	render_playlist: function(pl, not_clear) { // if links present than do full rendering! yearh!
		var _sui = this;
		var ui = _sui.views.get_playlist_c();
		if (!not_clear){
			ui.empty();
		}
		seesu.ui.els.make_trs.show().data('pl', _sui.views.browsing.mpl = pl);
		if (!pl){
			$(ul).append('<li>Nothing found</li>');
		} else {
			pl.ui = ui;
			if (!su.ui.now_playing.link){
				if (seesu.ui.els.start_screen){
					$('<p></p>').attr('id', 'now-play-b').append(
						su.ui.now_playing.link = $('<a></a>').text('Now Playing').attr('class', 'js-serv').click(function(){
							_sui.views.show_now_playing();
						})
					).prependTo(seesu.ui.els.start_screen.children('.for-startpage'));
				}
				
			}
			for (var i=0, l = pl.length; i < l; i++) {
				
				pl.ui.append(
					_sui.create_playlist_element(pl[i])
				);
				if (pl[i].mo_pla){
					_sui.make_pl_element_playable(pl[i]);
				}
			}
			
			//get mp3 for each prepaired node (do many many delayed requests to mp3 provider)
		
			
			return true;
		}
	},
	make_pl_element_playable: function(mo){
		mo.mo_pla.node = mo.node;
		mo.node
			.find('a.song-duration').remove().end()
			.addClass('song')
			.removeClass('search-mp3-failed')
			.removeClass('waiting-full-render')
			.data('mo_pla', mo.mo_pla)
			.unbind()
			.click(function(){
				seesu.ui.views.save_view(mo.plst_titl);
				seesu.player.song_click(mo.mo_pla);
			});
		
		if (mo.mo_pla.from != 'legal_vk_api'){
			var mp3 = $("<a></a>").text('mp3').attr({ 'class': 'download-mp3', 'href':  mo.mo_pla.link });
			mp3.insertBefore(mo.node);
		} else{
			mo.node.addClass('mp3-download-is-not-allowed');
		}
		
		if (mo.mo_pla.duration) {
			var digits = mo.mo_pla.duration % 60;
			var track_dur = (Math.round(mo.mo_pla.duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
			mo.node.prepend($('<a class="song-duration"></a>').text(track_dur + ' '));
		}
	},
	create_playlist_element: function(mo_titl){
		var t_context = this.els.track_c.clone(true);
		var tp = t_context.children('.track-panel');
		var track = $("<a></a>")
			.data('mo_titl', mo_titl)
			.data('artist_name', mo_titl.artist)
			.data('t_context', t_context)
			.addClass('track-node waiting-full-render')
			.click(empty_song_click),
			li = document.createElement('li');
			
		tp.children('.play-control').children('img.pl-control').data('mo_titl', mo_titl);
		
		mo_titl.node = track;
		
		if (!!mo_titl.track){
			track.text(mo_titl.artist + ' - ' + mo_titl.track);
		} else{
			track.text(mo_titl.artist);
		}
		if (mo_titl.link) {
			make_node_playable(mo_titl, mo_titl);
		} else if (mo_titl.mo_pla){
			make_node_playable(mo_titl, mo_titl.mo_pla);
		}
		
		
		var ph = seesu.player.controls.ph.clone(true);
		var tpt = ph.children('.track-progress').data('mo_titl', mo_titl);
		mo_titl.c = {
			tr_progress_t: tpt,
			tr_progress_l: tpt.children('.track-load-progress'),
			tr_progress_p: tpt.children('.track-play-progress')
		};
		ph.prependTo(tp);
			
			
			
		return $(li)
			.data('mo_titl', mo_titl)
			.append(seesu.ui.els.play_controls.node.clone(true).data('mo_titl', mo_titl))
			.append(track)
			.append(t_context);
	},
	lfm_logged : function(){
		dstates.add_state('body', 'lfm-auth-done')
		$('.lfm-finish input[type=checkbox]',this.d).attr('checked', 'checked');
		var f = $('.scrobbling-switches', this.d);
		var ii = f.find('input');
		ii.removeAttr('disabled');
	},
	lfm_enable_scrobbling:function(context){
		var lfm_ssw = $('.scrobbling-switches', context || this.d);
		if (lfm_ssw) {
			lfm_ssw.find('.enable-scrobbling').attr('checked', 'checked');
			lfm_ssw.find('.disable-scrobbling').attr('checked', '');
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
				_ui.link = $('<a></a>').text('Playlists').attr('class', 'js-serv').click(function(){
					_ui.search('');
					_ui.search(':playlists');
					return false;
				}) 
			).appendTo(_ui.els.start_screen.children('.for-startpage'));
		}
	},
	make_search_elements_index: function(remark_enter_press, after_user){
		var search_elements = seesu.ui.views.current_rc.find('a:not(.nothing-found), button');
		seesu.ui.views.current_rc.data('search_elements', search_elements)
		for (var i=0 , l = search_elements.length; i < l; i++) {
			$(search_elements[i]).data('search_element_index', i);
		};
		if (remark_enter_press) {
			var active_index = seesu.ui.els.search_form.data('current_node_index') || 0;
			var new_active_node = search_elements[active_index];
			if (new_active_node) {
				
					var active_node = seesu.ui.views.current_rc.data('node_for_enter_press');
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
			if (this.video.iframe){
				this.video.iframe.remove();
				this.video.iframe = false;
			}
		}
		
	},
	mark_c_node_as: function(marker){
		var s = seesu.ui.els.artsHolder;
		s.attr('class', s.attr('class').replace(/\s*player-[a-z]+ed/g, ''));
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