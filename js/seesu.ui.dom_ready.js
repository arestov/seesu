window.connect_dom_to_som = function(d, sui, callback){
	if (window.resizeWindow && d && d.defaultView && !d.defaultView.window_resized){
		resizeWindow(d.defaultView);
	}
	var viewBlocks = function(sui, opts){
		if (callback){
			callback(opts);	
		}
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
				.prependTo(sui.els.slider)
		}

		if (su.lfm_api.scrobbling) {
			sui.lfm_change_scrobbling(true);
		}
		
		if (su.lfm_api.sk) {
			sui.lfm_logged();	
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
	
	
	
		
		
		$('#app_type', sui.els.search_form).val(seesu.env.app_type);
		
		sui.els.search_form.submit(function(){return false;})
		if (sui.els.search_form) {
			$(d).keydown(function(e){
				if (!sui.els.slider.className.match(/show-search-results/)) {return}
				if (d.activeElement.nodeName == 'BUTTON'){return}
				arrows_keys_nav(e);
			})
		}
		var wtm_wrap = $('#people-connecting', d);
		var wtm_content = wtm_wrap.find('.people-connecting-content');
		sui.els.wtm = {
			wp:wtm_wrap,
			con: wtm_content,
			visible: false,
			id: false
		};
		
		sui.els.wtm.id = sui.addPopup(wtm_wrap, function(){
			return sui.els.wtm.visible;
		}, function(){
			wtm_wrap.hide();
			wtm_content.empty();
			sui.els.wtm.visible = false;
		});
		
		
		
		
		
		var pl_search_wrap = $('#playlist-search', d);
		
		sui.els.pl_search = {
			wp: pl_search_wrap,
			visible: false,
			hide: function(){
				this.wp.attr('style', '');
				this.visible = false	
			}
		}
		
		var playlists = seesu.gena.playlists;
		

		//[{name: 'loved tracks'}, {name: 'killers'}, {name: 'top british 30'}, {name: 'vkontakte'}, {name: 'best beatles'}];
		var create_plr_entity = function(playlist, song){
			var entity = $('<li></li>', d).text(playlist.playlist_title).click(function(){
				sui.els.pl_search.hide();
				playlist.add(song);
			});
			return entity;
		};
		
		
		
		sui.addPopup(pl_search_wrap, function(){
			return sui.els.pl_search.visible;
			
		}, function(){
			sui.els.pl_search.hide();
		});

		
		
			
		
		
		var new_playlist_desc = 'new playlist named ';
		var pl_r = $('.pl-r', pl_search_wrap);
		
		var pl_q = sui.els.pl_r = $('#pl-q',pl_search_wrap).bind('change keyup focus', function(e){
			
			
			var searching_for = this.value;
			if (searching_for && searching_for == pl_q.data('lastv')){return false;}
			
			var current_song = pl_search_wrap.data('current_song');
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
							sui.els.pl_search.hide();
							su.gena.create_userplaylist(searching_for).add(current_song);
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
		
		
		$('.ext-playlists', pl_search_wrap).click(function(e){
			$(this).parent().toggleClass('not-want-to')
			e.preventDefault();
		});
		
		
		sui.create_playlists_link();
		
		
		
		/*
		var wow_hart = function(lfm_hartist){
			var link = $('<div></div>').css({
				float:'left',
				overflow:'hidden',
				height:'160px',
				width:'96px',
				'margin-right': '15px',
				'margin-bottom': '25px'
			}).click(function(){
				sui.show_artist(lfm_hartist.name);
				seesu.track_event('Artist navigation', 'hyped at start page', artist_name);
			});
			var image = $('<img/>').attr('src', lfm_hartist.image[1]['#text']);
			link.append(image).appendTo(sui.els.hyped_arts);
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
			//sui.els.start_screen
			sui.els.hyped_arts = $('<div></div>').css({
				overflow:'hidden',
				'margin-top': '50px'
			}).appendTo(sui.els.start_screen);
			console.log(r);
			var h_arts  = (r && r.artists && r.artists.artist) && ((r.artists.artist.length && r.artists.artist) || [r.artists.artist]);
			if (h_arts){
				for (var i=0; i < h_arts.length; i++) {
					wow_hart(h_arts[i]);
				}
			}
			
		});
		*/
		var wow_tags= function(tag,c){
			$('<a class="js-serv hyped-tag"></a> ')
				.text(tag)
				.click(function(e){
					sui.show_tag(tag)
					seesu.track_event('Navigation', 'hyped at start page', "tag: " + tag );
					e.preventDefault();
				}).appendTo(c);
			c.append(' ')
			
		};
		
		
		var users_play = $('<div class="block-for-startpage users-play-this"></div>').appendTo(sui.els.start_screen);
		var users_limit = 6;
		var showUsers = function(listenings,c, above_limit_value){
			if (listenings.length){
				
					
					
				var uc = $('<ul></ul>');
				for (var i=0, l = Math.min(listenings.length, Math.max(users_limit, users_limit + above_limit_value)); i < l; i++) {
					var lig = listenings[i];
					if (lig.info){
						$('<li></li>')
							.append("<p class='vk-ava'><img width='50' height='50' alt='user photo' src='" + lig.info.photo + "'/></p>")
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
									sui.showTopTacks(a, {}, {artist: a, track: t});			
								}))
							.appendTo(uc)
					}
				};
				uc.appendTo(c)
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
					};
				}
				
				
			}
			
			

		}
		su.s.susd.ligs.regCallback('start-page', showUsersListenings, function(){
			users_play.addClass('loading');
		});
		
		var _cmetro = $('<div class="block-for-startpage random-metro-chart"></div>').appendTo(sui.els.start_screen);
		var createTrackLink = function(artist, track, track_obj, playlist){
			return $('<a class="js-serv"></a>').text(artist + ' - ' + track).click(function(e){
				sui.views.show_playlist_page(playlist);
				playlist.showTrack(track_obj);
				e.preventDefault();
			});
		};
		var showMetroRandom = function(){
			var random_metro = getSomething(lastfm_metros);
			_cmetro.addClass('loading');
			lfm('geo.getMetroUniqueTrackChart', {country: random_metro.country, metro: random_metro.name, start: new Date - 60*60*24*7}, function(r){
				_cmetro.removeClass('loading');
				if (r && r.toptracks && r.toptracks.track){
					_cmetro.empty()
					
					var plr = prepare_playlist('Chart of ' + random_metro.name, 'chart', {country: random_metro.country, metro: random_metro.name});
					
					var metro_tracks = r.toptracks.track;
					var _header =  $('<h3></h3>').appendTo(_cmetro)
						.append(localize('last-week-с') + ' ' + random_metro.name)
						.append('<span class="desc"> (' + random_metro.country + ') </span>')
						.append(localize('listen-this') + " ");
					$('<a class="js-serv"></a>').text(localize('refresh')).click(function(e){
						showMetroRandom();
						e.preventDefault();
					}).appendTo(_header);
						
		
					var ulm = $('<ul class="metro-tracks"></ul>');
					var counter = 0;
					for (var i=0; i < metro_tracks.length; i++) {
						if (counter <30){
							var _trm = metro_tracks[i];
							
							if (_trm.image){
								var con = $('<li></li>').appendTo(ulm);
								$('<img width="32" height="32" alt="artist image"/>').attr('src', _trm.image[0]['#text']).appendTo(con);
								
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
		
		
		var createPeopleListEl = function(img_src, opts){
			var o = opts || {};
			
			var ui = {
				c: false,
				bp: false,
				imgc: false,
				lp: false
			}
			var li = ui.c = $('<li class="people-list-item"></li>');
			var img_c = ui.imgc = $('<div class="people-image"></div>').appendTo(li);
			if (img_src){
				$('<img width="50" height="50"/>').attr('src', img_src).appendTo(img_c);
			}
			ui.bp = $('<div class="button-place-people-el"></div>').appendTo(li);
			ui.lp = $('<div class="p-link-place"></div>').appendTo(li);;
			return ui;
		};
		
		
		 
		
		var buildPeopleLE = function(man, opts){
			var o = opts || {};
			var el_opts = {};	
			
			var pui = createPeopleListEl(man.info.photo);
			
			
			if (o.links){
				pui.lp.append(sui.getAcceptedDesc(man));
			
			} else if (o.accept_button){
				var nb = sui.createNiceButton();
					nb.b.text( localize('accept-inv', 'Accept invite'));
					nb.enable();
					
					var pliking;
					
					nb.b.click(function(){
						if (!pliking){
							var p =
							su.s.api('relations.acceptInvite', {from: man.user}, function(r){
								
								if (r.done){
									$('<span class="desc"></span>').text(sui.getRemainTimeText(r.done.est, true)).appendTo(pui.lp);
									if (new Date(r.done.est) < new Date()){
										checkRelationsInvites();
									}
									nb.c.remove();
								}
								pliking = false;
							})
							pliking = true
						}
					});
				nb.c.appendTo(pui.bp);
			}
			
			return pui.c;
		};
		var createPeopleList = function(people, opts){
			var o = opts || {};
			
			var ul = $("<ul class='people-list'></ul>")
			if (o.wide){
				ul.addClass('people-l-wide')
			}
			
			for (var i=0; i < people.length; i++) {					
				ul.append(buildPeopleLE(people[i], opts));
				
			};
			return ul;
		};
		var rl_place = sui.els.start_screen.find('.relations-likes-wrap');
		var ri_place = sui.els.start_screen.find('.relations-invites-wrap');
		

		su.s.susd.rl.regCallback('start-page', function(r){
			rl_place.empty();
			if (r.done && r.done.length){
				var filtered = $filter(r.done, 'item.accepted', function(v){
					return !!v;
				});
				$('<h3></h3>')
					.text(localize('rels-you-people'))
					.appendTo(rl_place)
					.append($('<a class="js-serv"></a>').text(localize('refresh')).click(function(){
						$(this).remove();
						setTimeout(function(){
							su.s.susd.rl.getData();
						},1000)
						
					}));
				if (filtered.length){
					createPeopleList(filtered, {links: true, wide: true}).appendTo(rl_place);
				}
				if (filtered.not.length){
					createPeopleList(filtered.not).appendTo(rl_place);
					$('<p class="desc people-list-desc"></p>').text(localize('if-one-accept-i') + ' ' + localize('will-get-link')).appendTo(rl_place);
				}
			}
			
		});
		su.s.susd.ri.regCallback('start-page', function(r){
			ri_place.empty();
			if (r.done && r.done.length){
				var filtered = $filter(r.done, 'item.accepted', function(v){
					return !!v;
				});
				$('<h3></h3>')
					.text(localize('rels-people-you'))
					.appendTo(ri_place)
					.append($('<a class="js-serv"></a>').text(localize('refresh')).click(function(){
						$(this).remove();
						setTimeout(function(){
							su.s.susd.ri.getData();
						},1000)
						
					}));
					
					
					
				if (filtered.length){
					createPeopleList(filtered, {links: true, wide: true}).appendTo(ri_place);
				}
				if (filtered.not.length){
					createPeopleList(filtered.not, {wide: true, accept_button: true}).appendTo(ri_place);
					$('<p class="desc people-list-desc"></p>').text(localize('if-you-accept-one-i') + ' ' + localize('will-get-link')).appendTo(ri_place);
				}
			}
			
		});
		
		
		if (window.lastfm_toptags && lastfm_toptags.length){
			var _c = $('<div class="block-for-startpage tags-hyped"></div>').appendTo(sui.els.start_screen);
			$('<h3></h3>').appendTo(_c)
							.append(localize('Pop-tags','Popular tags'));
			for (var i=0; i < lastfm_toptags.length; i++) {
				wow_tags(lastfm_toptags[i], _c);
			};
		}
		
		false && lfm('chart.getTopTags', false, function(r){
			var _c = $('<div class="block-for-startpage tags-hyped"></div>').appendTo(sui.els.start_screen);
			var pop_tags  = (r && r.tags && r.tags.tag) && ((r.tags.tag.length && r.tags.tag) || [r.tags.tag]);
			var wtags = [];
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
		
	};

	
	
	seesu.player.controls = (function(volume){
		var o = {};
		var get_click_position = function(e, node){
			//e.offsetX || 
			var pos = e.pageX - $(node).offset().left;
			return pos
		}
		o.track_progress_total = $('<div class="track-progress"></div>',d).click(function(e){
				
			var ui = $(this).data('mo').ui;
			if (ui && ui.ct){
				var pos = get_click_position(e, this);
				var new_play_position_factor = pos/ui.ct.track_progress_width;
				seesu.player.musicbox.set_new_position(new_play_position_factor);
			}
		
			
			//su.ui.hidePopups();
			//e.stopPropagation();
			
			
		})
		
		o.track_progress_load = $('<div class="track-load-progress"></div>',d).appendTo(o.track_progress_total);
		o.track_progress_play = $('<div class="track-play-progress"></div>',d).appendTo(o.track_progress_total);
		o.track_node_text = $('<span class="track-node-text"></span>',d).appendTo(o.track_progress_total);
		
		
		o.volume_state = $('<div class="volume-state"></div>',d).click(function(e){
			var pos = get_click_position(e, this);
			var new_volume_factor = pos/50;
			seesu.player.musicbox.changhe_volume(new_volume_factor * 100);
			seesu.player.call_event(VOLUME, new_volume_factor * 100);
			((sui.els.volume_s.sheets && sui.els.volume_s.sheets.cssRules) || sui.els.volume_s.sheet.rules)[0].style.width = pos + 'px';
		})
		o.volume_state_position = $('<div class="volume-state-position"></div>',d)
			.appendTo(o.volume_state);
			
		o.ph = $('<div class="player-holder"></div>',d)
			.prepend(o.track_progress_total)
			.prepend(o.volume_state);
			
		return o;
	})(seesu.player.player_volume);
	domReady(d, function() {
		console.log('dom ready')
		d.head = d.head || d.getElementsByTagName('head')[0];
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
		if (volume_s.styleSheet){
			volume_s.styleSheet.cssText = volume_style;
		} else{
			volume_s.appendChild(d.createTextNode(volume_style));
		}
		d.documentElement.firstChild.appendChild(volume_s);
		
		dstates.connect_ui(sui);
		var pllistlevel = $('#playlist-level',d);
		
		var search_form = $('#search',d); 
		

		var ui_samples = $('#ui-samples',d);
		var buttmen_node =  ui_samples.children('.play-controls.buttmen');
		if (buttmen_node){
			seesu.buttmen = new button_menu(buttmen_node);
		}
		
		
		sui.els = {
			scrolling_viewport: su.env.as_application ? {node:$('#screens',d)} : {node: $(d.body), offset: true},
			make_trs: $("#make-trs-plable",d).click(function(){
				
				var pl = su.player && su.player.c_song && su.player.c_song.plst_titl;
				if (pl){
					make_tracklist_playable(pl, true);
					seesu.track_event('Controls', 'make playable all tracks in playlist'); 
				}
				
			}),
			slider: slider,
			nav_playlist_page: d.getElementById('nav_playlist_page'),
			nav_track_zoom: $('#nav_track_zoom',d),
			export_playlist: $('#open-external-playlist',d).click(function(e){
				make_external_playlist();
				if (seesu.player.current_external_playlist.result) {
					app_env.openURL(
						'http://seesu.me/generated_files/seesu_playlist.m3u?mime=m3u&content=' + escape(seesu.player.current_external_playlist.result)
					)
				}
				e.preventDefault();
			}),
			start_screen: $('#start-screen',d),
			artcards: $('#art-cards', d),
			pllistlevel: pllistlevel,
			artsTracks: pllistlevel.find('#tracks-magic'),
			art_tracks_w_counter: $('#tracks-waiting-for-search',d),
			
			
			searchres: $('#search_result',d),
			search_input: $('#q',d),
			play_controls: seesu.buttmen,
			search_form: search_form,
			volume_s: volume_s
			
		};
		var track_c = ui_samples.children('.track-context');
		sui.samples = {
			artcard: ui_samples.children('.art-card'),
			track_c : track_c,
			vk_login: {
				o: ui_samples.children('.vk-login-context'),
				oos: $(),
				hideLoadIndicator: function(){
					this.oos.removeClass("waiting-vk-login");
					this.load_indicator = false;
				},
				showLoadIndicator:function() {
					this.oos.addClass("waiting-vk-login");
					this.load_indicator = true;
				},
				remove: function(){
					this.oos.remove();
					this.oos = $();
					su.vk.wait_for_finish = false;
				},
				resetAuth: function(){
					this.oos.find('.auth-container').empty();
				},
				finishing: function(){
					su.vk.wait_for_finish = true;	
					
					this.oos.addClass('vk-finishing');
				},
				vk_login_error: $(),
				captcha_img: $(),
				clone: function(request_description){
					var _this = this;
					var nvk = this.o.clone();
					if (su.vk.wait_for_finish){
						nvk.addClass('vk-finishing');
					}
					
					
					if (this.load_indicator){
						nvk.addClass("waiting-vk-login");
					}
					if (request_description){
						nvk.find('.login-request-desc').text(request_description);
					}
					var auth_c =  nvk.find('.auth-container');
					nvk.find('.sign-in-to-vk').click(function(e){
						var class_name = this.className;
						var clicked_node = $(this);
						
			
						var vkdomain = class_name.match(/sign-in-to-vk-ru/) ? 'vkontakte.ru' : 'vk.com';
						if (su.vk_app_mode){
							if (window.VK){
								VK.callMethod('showSettingsBox', 8);
							}
						} else{
							
							vk_auth_box.requestAuth({
								ru: class_name.match(/sign-in-to-vk-ru/) ? true: false,
								c: _this
							})
						
						}
							
						
						e.preventDefault();
					});
					
					_this.oos =  _this.oos.add(nvk);
					return nvk;
				}
			}
			
		};
		vk_auth_box.setUI(sui.samples.vk_login);
		
			
		sui.els.search_label = sui.els.search_form.find('#search-p').find('.lbl');
		var justhead = $(sui.els.slider).children('.navs');
		sui.views.setNav({
			justhead: justhead,
			daddy: justhead.children('.daddy'),
			start: $('#start_search',d),
			results: $('#search_result_nav',d),
			playlist: $(sui.els.nav_playlist_page).parent(),
			track: sui.els.nav_track_zoom.parent()
		});
		
		sui.els.search_input.bind('keyup change', input_change);
	
		var state_recovered;	
		if (window.su && su.player && su.player.c_song){
			if (su.player.c_song && su.player.c_song.plst_titl){
				
				/*
				sui.views.show_start_page(false, true, true);
				if (su.player.c_song.plst_titl.with_search_results_link){
					delete su.player.c_song.plst_titl.with_search_results_link ;
				}
				sui.views.show_playlist_page(su.player.c_song.plst_titl, false, true);
				su.player.view_song(su.player.c_song, true, true, true);
				
				sui.views.freeze(su.player.c_song.plst_titl, true);
				*/
				sui.views.m.restoreFreezed();
				su.ui.views.show_track_page(su.player.c_song, true);
				
				sui.mark_c_node_as(su.player.player_state);
				su.player.nowPlaying(su.player.c_song);
				state_recovered = true;
			}
		}
	
		$(d).click(function(e) {
			return test_pressed_node(e);
		});
		var ext_search_query = sui.els.search_input.val();
		if (ext_search_query) {
			sui.search(ext_search_query);
		}
		viewBlocks(sui, {state_recovered: state_recovered, has_query: !!ext_search_query});
		
		
		
	
	
	
	});
	

	
	
	
	
}