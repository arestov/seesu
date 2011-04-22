window.connect_dom_to_som = function(d, ui){
	if (!window.window_resized){
		window_resizer(d);
	}


	
	
	
	
	
	ui.buttons = {
		search_artists : 
			$('<button type="submit" name="type" value="artist" id="search-artist"><span>Search in artists</span></button>',d)
				.click(function(e){
					var finishing_results = $(this).data('finishing_results');
					$(this).parent().remove();
					var query = seesu.ui.els.search_input.val();
					if (query) {
						su.fs.artist_search(query, finishing_results);
					}
					seesu.ui.make_search_elements_index()
				}),
			
		search_tags:  
			$('<button type="submit" name="type" value="tag" id="search-tag"><span>Search in tags</span></button>',d)
				.click(function(e){
					var finishing_results = $(this).data('finishing_results');
					$(this).parent().remove();
					
					
					var query = seesu.ui.els.search_input.val();
					if (query) {
						su.fs.tag_search(query, finishing_results)
					}
					seesu.ui.make_search_elements_index()
				}),
		search_tracks: 
			$('<button type="submit" name="type" value="track" id="search-track"><span>Search in tracks</span></button>',d)
				.click(function(e){
					var finishing_results = $(this).data('finishing_results');
					$(this).parent().remove();
					
					
					
					
					var query = seesu.ui.els.search_input.val();
					if (query) {
						su.fs.track_search(query, finishing_results)
					}
					seesu.ui.make_search_elements_index()
				}),
		search_vkontakte: 
			$('<button type="submit" name="type" value="vk_track" id="search-vk-track" class="search-button"><span>' + localize('direct-vk-search','Search mp3  directly in vkontakte') +'</span></button>',d)
				.click(function(e){
					
					var query = seesu.ui.els.search_input.val();
					if (query) {
						su.ui.show_track({q: query});
					}
					
				})
	};
	
	
	seesu.player.controls = (function(volume){
		var o = {};
		var get_click_position = function(e, node){
			var pos = e.offsetX || (e.pageX - $(node).offset().left);
			return pos
		}
		o.track_progress_total = $('<div class="track-progress"></div>',d).click(function(e){
			e.stopPropagation();
			var pos = get_click_position(e, this);
			var new_play_position_factor = pos/$(this).data('mo').c.track_progress_width;
			seesu.player.musicbox.set_new_position(new_play_position_factor);
			
		})
		
		o.track_progress_load = $('<div class="track-load-progress"></div>',d).appendTo(o.track_progress_total);
		o.track_progress_play = $('<div class="track-play-progress"></div>',d).appendTo(o.track_progress_total);
		o.track_node_text = $('<div class="track-node-text"><div>',d).appendTo(o.track_progress_total);
		
		
		o.volume_state = $('<div class="volume-state"></div>',d).click(function(e){
			var pos = get_click_position(e, this);
			var new_volume_factor = pos/50;
			seesu.player.musicbox.changhe_volume(new_volume_factor * 100);
			seesu.player.call_event(VOLUME, new_volume_factor * 100);
			(su.ui.els.volume_s.sheet.cssRules || su.ui.els.volume_s.sheet.rules)[0].style.width = pos + 'px';
		})
		o.volume_state_position = $('<div class="volume-state-position"></div>',d)
			.appendTo(o.volume_state);
			
		o.ph = $('<div class="player-holder"></div>',d)
			.prepend(o.track_progress_total)
			.prepend(o.volume_state);
			
		return o;
	})(seesu.player.player_volume);
	addEvent(d, "DOMContentLoaded", function() {
		var lang = app_env.lang;
		$('.lang', d).each(function(i,el){
			var cn = el.className;
			var classes = cn.split(/\s/);
			$.each(classes, function(z, cl){
				if (cl.match(/localize/)){
					var term = localizer[cl.replace('localize-','')];
					if (term && term[lang]){
						$(el).text(term[lang]);
					}
				}
			});
			
		});
		if (su.env.check_resize){
			dstates.add_state('body', 'slice-for-height');
		}
		if (su.env.deep_sanbdox){
			dstates.add_state('body', 'deep-sandbox');
		}
		var slider = d.getElementById('slider');
		if (su.env.readySteadyResize){
			su.env.readySteadyResize(slider);
		}
	
		su.lfm_api.try_to_login();		
		var volume_s = d.createElement('style');
			volume_s.setAttribute('title', 'volume');
			volume_s.setAttribute('type', 'text/css');
		var volume_style= '.volume-state-position {width:' + ((seesu.player.player_volume * 50)/100) + 'px' + '}'; 
		if (volume_style.styleSheet){
			volume_s.styleSheet.cssText = volume_style;
		} else{
			volume_s.appendChild(d.createTextNode(volume_style));
		}
		d.documentElement.firstChild.appendChild(volume_s);
		
		dstates.connect_ui(ui);
		var pllistlevel = $('#playlist-level',d);
		
		var search_form = $('#search',d); 
		

		var ui_samples = $('#ui-samples',d);
		var buttmen_node =  ui_samples.children('.play-controls.buttmen');
		if (buttmen_node){
			seesu.buttmen = new button_menu(buttmen_node);
		}
		
		
		ui.els = {
			scrolling_viewport: $('#screens',d),
			make_trs: $("#make-trs-plable",d).click(function(){
				var plc = su.ui.views.getCurrentPlaylistContainer();
				var pl = plc && plc.context && plc.context.pl;
				if (pl){
					make_tracklist_playable(pl, true);
					seesu.track_event('Controls', 'make playable all tracks in playlist'); 
				}
				
			}),
			slider: slider,
			nav_playlist_page: d.getElementById('nav_playlist_page'),
			nav_track_zoom: $('#nav_track_zoom',d),
			export_playlist: $('#open-external-playlist',d).click(function(){
				make_external_playlist();
				if (seesu.player.current_external_playlist.result) {
					open_url(
						'http://seesu.me/generated_files/seesu_playlist.m3u?mime=m3u&content=' + escape(seesu.player.current_external_playlist.result)
					)
				}
				return false;
			}),
			start_screen: $('#start-screen',d),
			pllistlevel: pllistlevel,
			artsTracks: pllistlevel.find('#tracks-magic'),
			art_tracks_w_counter: $('#tracks-waiting-for-search',d),
			
			
			searchres: $('#search_result',d),
			search_input: $('#q',d),
			play_controls: seesu.buttmen,
			search_form: search_form,
			volume_s: volume_s
			
		};
		var ainfo_sample = ui_samples.children('.artist-info');
		ui.samples = {
			
			a_info: ainfo_sample,
			track_c : ui_samples.children('.track-context').append(ainfo_sample.clone()),
			vk_login: {
				o: ui_samples.children('.vk-login-context'),
				oos: $(),
				remove: function(){
					this.oos.removeClass("waiting-vk-login").remove();
					this.oos = $();
				},
				vk_login_error: $(),
				captcha_img: $(),
				clone: function(type){
					var _this = this;
					var nvk = this.o.clone();
					if (!type){
						nvk.addClass('usual-login')
					} else{
						nvk.addClass(type + '-login')
					}
					
					
					
					_this.oos =  _this.oos.add(nvk);
					var vk_auth = $('.vk-auth',nvk);
					
					_this.vk_login_error =  _this.vk_login_error.add($('.error',vk_auth));
					_this.captcha_img = _this.captcha_img.add($('.vk-captcha-context img',vk_auth));
					
					vk_auth.submit(function(){
						_this.vk_login_error.text('');
						_this.oos.addClass("waiting-vk-login");
						dstates.remove_state('body','vk-needs-captcha');
						var node = $(this),
							email = $('input.vk-email',node).val(),
							pass = vk_pass.val();
						
						var save = vk_save_pass.attr('checked');
						if (save){
							seesu.vk.save_pass = true;
						} else{
							seesu.vk.save_pass = false;
						}
						uilogin_to_hapi(email, pass, $('.vk-captcha-key',node).val(), save);
				
						return false;
					});
					var vk_pass  = $('input.vk-pass', vk_auth)
						.bind('mouseover', function(){
							this.type = 'text';
						})
						.bind('mouseout', function(){
							this.type = 'password';
						});
					return nvk;
				}
			}
		};
		
		
			
		ui.els.search_label = ui.els.search_form.find('#search-p').find('.lbl');
		var justhead = $(su.ui.els.slider).children('.navs');
		ui.views.nav = {
			justhead: justhead,
			daddy: justhead.children('.daddy'),
			start: $('#start_search',d),
			results: $('#search_result_nav',d),
			playlist: $(su.ui.els.nav_playlist_page).parent(),
			track: ui.els.nav_track_zoom.parent()
		}
		
		ui.els.search_input.bind('keyup change', input_change);
	
		var state_recovered;	
		if (window.su && su.player && su.player.c_song){
			if (su.player.c_song && su.player.c_song.plst_titl){
				ui.views.show_start_page(true, true, true);
				if (su.player.c_song.plst_titl.with_search_results_link){
					delete su.player.c_song.plst_titl.with_search_results_link ;
				}
				su.ui.views.show_playlist_page(su.player.c_song.plst_titl, false, true);
				su.player.view_song(su.player.c_song, true, true, true);
				su.player.nowPlaying(su.player.c_song);
				su.ui.views.freeze(su.player.c_song.plst_titl, true);
				su.ui.mark_c_node_as(su.player.player_state);
				state_recovered = true;
			}
		}
	
		$(d).click(function(e) {
			su.ui.els.pl_search.attr('style', '');
			return test_pressed_node(e);
		});
		
		
		
		$('#hint-query',d).text(seesu.popular_artists[(Math.random()*10).toFixed(0)]);
		$('#widget-url',d).val(location.href.replace('index.html', ''));
		var seesu_me_link = $('#seesu-me-link',d);
		seesu_me_link.attr('href', seesu_me_link.attr('href').replace('seesu%2Bapplication', seesu.env.app_type));
		
		
		
		
		
		
		var vk_save_pass = $('#vk-save-pass',d);
		
		  
		if ($.browser.opera && ((typeof opera.version == 'function') && (parseFloat(opera.version()) <= 10.1)) ){
			
			$('<a id="close-widget">&times;</a>',d)
				.click(function(){
					window.close();
				})
				.prependTo(seesu.ui.els.slider)
		}

		if (su.lfm_api.scrobbling) {
			ui.lfm_change_scrobbling(true);
		}
		
		if (su.lfm_api.sk) {
			seesu.ui.lfm_logged();	
		}
		
		
		

		var lfm_recomm = $('#lfm-recomm',d).click(function(){
			if(!su.lfm_api.sk){
				dstates.toggleState('body', 'lfm-auth-req-recomm');
			}else {
				render_recommendations();
			}
		});
		
		var lfm_loved = $('#lfm-loved',d).click(function(){
			if(!su.lfm_api.sk){
				dstates.toggleState('body', 'lfm-auth-req-loved');
			}else {
				render_loved();
			}
		});

		
		$('#lfm-loved-by-username',d).submit(function(){
			var _this = $(this);
			render_loved(_this[0].loved_by_user_name.value);
			
			return false;
		})
		$('#lfm-recomm-for-username',d).submit(function(e){
			var _this = $(this);
			render_recommendations_by_username(_this[0].recomm_for_username.value);
			
			return false;
		})
	
	
	
		
		
		$('#app_type', search_form).val(seesu.env.app_type);
		
		search_form.submit(function(){return false;})
		if (search_form) {
			$(d).keydown(function(e){
				if (!seesu.ui.els.slider.className.match(/show-search-results/)) {return}
				if (d.activeElement.nodeName == 'BUTTON'){return}
				arrows_keys_nav(e);
			})
		}
		
		
		
		var playlists = seesu.gena.playlists;
		//[{name: 'loved tracks'}, {name: 'killers'}, {name: 'top british 30'}, {name: 'vkontakte'}, {name: 'best beatles'}];
		var create_plr_entity = function(playlist, song){
			var entity = $('<li></li>', d).text(playlist.playlist_title).click(function(){
				pl_search.attr('style', '');
				su.gena.add(song, playlist);
			});
			return entity;
		};
		var pl_search  = ui.els.pl_search = $('#playlist-search', d).click(function(e){
			e.stopPropagation();
			test_pressed_node(e)
		});
		
		var new_playlist_desc = 'new playlist named '
		var pl_r = $('.pl-r', pl_search);
		
		var pl_q = ui.els.pl_r = $('#pl-q',pl_search).bind('change keyup focus', function(e){
			
			
			var searching_for = this.value;
			if (searching_for && searching_for == pl_q.data('lastv')){return false;}
			
			var current_song = pl_search.data('current_song');
			if (searching_for){
				var matches = [];
				for (var i=0; i < playlists.length; i++) {
					if (playlists[i].playlist_title == searching_for){
						matches.unshift(i);
						matches.full_match = true;
					} else if (playlists[i].playlist_title.match(new  RegExp('\\b' + searching_for))){
						 matches.push(i);
					}
	
				};
				var pl_results = $();
				
				if (!matches.full_match && searching_for){
					var new_pl_button = $('<li></li>')
						.text('"'+searching_for+'"')
						.prepend($('<span></span>').text(new_playlist_desc));
					new_pl_button.click(function(e){
							pl_search.attr('style', '');
							su.gena.add(current_song, su.gena.create_userplaylist(searching_for));
						});
						
					pl_results = pl_results.add(new_pl_button);
				}
				for (var i=0; i < matches.length; i++) {
					pl_results = pl_results.add(create_plr_entity(playlists[matches[i]], current_song));
				};
				pl_r.empty();
				if (pl_results.length > 0){
					pl_r.append(pl_results);
				}
			} else{
				console.log(current_song)
				var pl_results = $();
				for (var i=0; i < playlists.length; i++) {
					pl_results = pl_results.add(create_plr_entity(playlists[i], current_song));
				};
				pl_r.empty();
				if (pl_results.length > 0){
					pl_r.append(pl_results);
				}
			}
			pl_q.data('lastv', searching_for);
			
		});
		
		
		$('.ext-playlists', pl_search).click(function(){
			$(this).parent().toggleClass('not-want-to')
			return false;
		});
		if (!state_recovered){
			ui.views.show_start_page(true, true, true);
			var ext_search_query = seesu.ui.els.search_input.val();
			if (!hashchangeHandler({
					oldURL:'',
					newURL: location.hash.replace(/^\#/,'')
				}, true) && ext_search_query){
				su.ui.search(ext_search_query);
			}
			console.log('bg');
		}
		
		
		ui.create_playlists_link();
		
		
		
		
		var wow_hart = function(lfm_hartist){
			var link = $('<div></div>').css({
				float:'left',
				overflow:'hidden',
				height:'160px',
				width:'96px',
				'margin-right': '15px',
				'margin-bottom': '25px'
			}).click(function(){
				seesu.ui.show_artist(lfm_hartist.name);
				seesu.track_event('Artist navigation', 'hyped at start page', artist_name);
			});
			var image = $('<img/>').attr('src', lfm_hartist.image[1]['#text']);
			link.append(image).appendTo(su.ui.els.hyped_arts);
			link.append('<p>' + lfm_hartist.name + '</p>');
			lfm('artist.getInfo',{artist:lfm_hartist.name},  function(r){
				var atags = (r && r.artist && r.artist.tags && r.artist.tags.tag) && ((r.artist.tags.tag.length && r.artist.tags.tag) || [r.artist.tags.tag]);
				if (atags){
					var tags_el = $('<div></div>')
					for (var i=0, l = ((atags.length < 3) && atags.length) || 3; i < l; i++) {
						tags_el.append('<em>' + atags[i].name + '</em> ');
					}
					tags_el.appendTo(link);
				}
			});
		};
		false && lfm('chart.getHypedArtists', false, function(r){
			//su.ui.els.start_screen
			su.ui.els.hyped_arts = $('<div></div>').css({
				overflow:'hidden',
				'margin-top': '50px'
			}).appendTo(su.ui.els.start_screen);
			console.log(r);
			var h_arts  = (r && r.artists && r.artists.artist) && ((r.artists.artist.length && r.artists.artist) || [r.artists.artist]);
			if (h_arts){
				for (var i=0; i < h_arts.length; i++) {
					wow_hart(h_arts[i]);
				}
			}
			
		});
		
		var wow_tags= function(tag,c){
			$('<a class="js-serv hyped-tag"></a> ')
				.text(tag)
				.click(function(){
					su.ui.show_tag(tag)
					seesu.track_event('Navigation', 'hyped at start page', "tag: " + tag );
					return false;
				}).appendTo(c);
			c.append(' ')
			
		};
		var users_play = $('<div class="block-for-startpage users-play-this"></div>').appendTo(su.ui.els.start_screen);
		var users_limit = 6;
		var showUsers = function(listenings,c, above_limit_value){
			if (listenings.length){
				
					
					
				var uc = $('<ul></ul>');
				for (var i=0, l = Math.min(listenings.length, Math.max(users_limit, users_limit + above_limit_value)); i < l; i++) {
					var lig = listenings[i];
					if (lig.info){
						$('<li></li>')
							.append("<p class='vk-ava'><img alt='user photo' src='" + lig.info.photo + "'/></p>")
							.append($('<a class="external"></a>').attr('href', 'http://vk.com/id' + lig.vk_id).text(lig.info.first_name))
							.append(document.createTextNode(' слушает '))
							.append('<br/>')
							.append($('<a class="js-serv"></a>')
								.text(lig.artist + ' - ' +  lig.title)
								.data('artist', lig.artist)
								.data('track', lig.title)
								.click(function(){
									var a = $(this).data('artist');
									var t = $(this).data('track');	
									su.ui.show_artist(a, false, false, {artist: a, track: t});			
								}))
							.appendTo(uc)
					}
					listenings[i]
				};
				uc.appendTo(c)
			}
			return Math.max(users_limit - listenings.length, 0);
		};
		var getAndShowUsersListenings = function(){
			users_play.addClass('loading');
			$.ajax({
			  url: 'http://seesu.me/last_listenings/',
			  global: false,
			  type: "GET",
			  dataType: "json",
			  headers:{
				'x-requested-with': 'XMLHttpRequest'
			  },
			  error: function(){
			  	
			  },
			  success: function(r){
				if (r && r.length){
					if ([].concat.apply([],r).length){
						users_play.empty();
						var _header = $('<h3></h3>').appendTo(users_play)
						.append(localize('User-listening','Users are listening'));
						
						$('<a class="js-serv"></a>').text(localize('refresh')).click(function(){
							getAndShowUsersListenings();
							return false
						}).appendTo(_header);
						var above_limit_value = 0;
						for (var i=0; i < r.length; i++) {
							if (r[i] && r[i].length){
								above_limit_value = showUsers(r[i], users_play, above_limit_value);
							}
						};
					}
					
					
				}
			  }, complete: function(){
				users_play.removeClass('loading');
			  }
		  
			});
		}
		getAndShowUsersListenings();
		
		
		var _cmetro = $('<div class="block-for-startpage random-metro-chart"></div>').appendTo(su.ui.els.start_screen);
		var createTrackLink = function(artist, track, track_obj, playlist){
			return $('<a class="js-serv"></a>').text(artist + ' - ' + track).click(function(){
				su.ui.views.show_playlist_page(playlist);
				if (track_obj.ui && track_obj.ui.node){
					track_obj.ui.node.click();
				}
				return false;
			});
		};
		var showMetroRandom = function(){
			var random_metro = getSomething(lastfm_metros);
			_cmetro.addClass('loading');
			lfm('geo.getMetroUniqueTrackChart', {country:random_metro.country, metro:random_metro.name, start: new Date - 60*60*24*7}, function(r){
				_cmetro.removeClass('loading');
				if (r && r.toptracks && r.toptracks.track){
					_cmetro.empty()
					
					var plr = prepare_playlist('Chart of ' + random_metro.name, 'cplaylist', random_metro.name);
					
					var metro_tracks = r.toptracks.track;
					var _header =  $('<h3></h3>').appendTo(_cmetro)
						.append(localize('last-week-с') + ' ' + random_metro.name)
						.append('<span class="desc"> (' + random_metro.country + ') </span>')
						.append(localize('listen-this') + " ");
					$('<a class="js-serv"></a>').text(localize('refresh')).click(function(){
						showMetroRandom();
						return false
					}).appendTo(_header);
						
		
					var ulm = $('<ul class="metro-tracks"></ul>');
					var counter = 0;
					for (var i=0; i < metro_tracks.length; i++) {
						if (counter <30){
							var _trm = metro_tracks[i];
							
							if (_trm.image){
								var con = $('<li></li>').appendTo(ulm);
								$('<img alt="artist image"/>').attr('src', _trm.image[0]['#text']).appendTo(con);
								
								var tobj = {artist: _trm.artist.name, track: _trm.name};
								plr.push(tobj);
								createTrackLink(_trm.artist.name, _trm.name, tobj, plr).appendTo(con);
								
								
								++counter;
							
							}
						} else{
							break
						}
					};
					_cmetro.append(ulm)
				} else{
					showMetroRandom();
				}
			})
		};
		showMetroRandom();
		
		
		
		if (window.lastfm_toptags && lastfm_toptags.length){
			var _c = $('<div class="block-for-startpage tags-hyped"></div>').appendTo(su.ui.els.start_screen);
			$('<h3></h3>').appendTo(_c)
							.append(localize('Pop-tags','Popular tags'));
			for (var i=0; i < lastfm_toptags.length; i++) {
				wow_tags(lastfm_toptags[i], _c);
			};
		}
		
		false && lfm('chart.getTopTags', false, function(r){
			var _c = $('<div class="block-for-startpage tags-hyped"></div>').appendTo(su.ui.els.start_screen);
			var pop_tags  = (r && r.tags && r.tags.tag) && ((r.tags.tag.length && r.tags.tag) || [r.tags.tag]);
			var wtags = [];
			dizi = wtags;
			if (pop_tags){
				var nbsp_char= String.fromCharCode(160);
				for (var i=0; i < pop_tags.length; i++) {
					wtags.push(pop_tags[i].name.replace(' ', nbsp_char));
					
				}
				wtags.sort();
				for (var i=0; i < wtags.length; i++) {
					wow_tags(wtags[i], _c);
				};
			}
			console.log(r)
			
		});
		
	
	
	
	});
	

	
	
	
	
}