var viewBlocks = function(sui, d){
	if (!getDefaultView(d)){
		return false;
	}
	$('#hint-query',d).text(su.popular_artists[(Math.random()*10).toFixed(0)]);
	$('#widget-url',d).val(location.href.replace('index.html', ''));
	var seesu_me_link = $('#seesu-me-link',d);
	seesu_me_link.attr('href', seesu_me_link.attr('href').replace('seesu%2Bapplication', su.env.app_type));
	
	
	
	
	
	
	//var vk_save_pass = $('#vk-save-pass',d);

	if ($.browser.opera && ((typeof window.opera.version == 'function') && (parseFloat(window.opera.version()) <= 10.1))){
		
		$('<a id="close-widget">&times;</a>',d)
			.click(function(){
				window.close();
			})
			.prependTo(sui.els.slider);
	}

	if (lfm.scrobbling) {
		sui.lfm_change_scrobbling(true);
	}
	
	if (lfm.sk) {
		sui.lfm_logged();	
	}
	
	
	

	var lfm_recomm = $('#lfm-recomm',d).click(function(){
		if(!lfm.sk){
			su.main_level.toggleState('lfm-auth-req-recomm');
		}else {
			render_recommendations();
		}
	});
	
	var lfm_loved = $('#lfm-loved',d).click(function(){
		if(!lfm.sk){
			su.main_level.toggleState('lfm-auth-req-loved');
		}else {
			render_loved();
		}
	});

	
	$('#lfm-loved-by-username',d).submit(function(){
		var _this = $(this);
		render_loved(_this[0].loved_by_user_name.value);
		
		return false;
	});
	$('#lfm-recomm-for-username',d).submit(function(e){
		var _this = $(this);
		render_recommendations_by_username(_this[0].recomm_for_username.value);
		
		return false;
	});



	
	
	$('#app_type', sui.els.search_form).val(su.env.app_type);
	
	sui.els.search_form.submit(function(){return false;});
	if (sui.els.search_form) {
		$(d).keydown(function(e){
			if (!sui.els.slider.className.match(/show-search-results/)) {return;}
			if (d.activeElement.nodeName == 'BUTTON'){return;}
			arrows_keys_nav(e);
		});
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
	
	
	


	jsLoadComplete({
		test: function(){
			return window.su && window.su.gena
		}, 
		fn: function(){
			sui.create_playlists_link();
		}
	});

	
	

	
	
	

	

	
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
						.appendTo(uc);
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
	
	var _cmetro = $('<div class="block-for-startpage random-metro-chart"></div>').appendTo(sui.els.start_screen);
	var createTrackLink = function(artist, track, track_obj, playlist){
		return $('<a class="js-serv"></a>').text(artist + ' - ' + track).click(function(e){
			su.views.show_playlist_page(playlist);
			playlist.showTrack(track_obj);
			e.preventDefault();
		});
	};
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
							return window.su && window.songsList
						},
						fn: function() {
							_cmetro.empty();
					
							var plr = su.preparePlaylist('Chart of ' + random_metro.name, 'chart', {country: random_metro.country, metro: random_metro.name});
							
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
	
	
	var createPeopleListEl = function(img_src, opts){
		var o = opts || {};
		
		var ui = {
			c: false,
			bp: false,
			imgc: false,
			lp: false
		};
		var li = ui.c = $('<li class="people-list-item"></li>');
		var img_c = ui.imgc = $('<div class="people-image"></div>').appendTo(li);
		if (img_src){
			$('<img width="50" height="50"/>').attr('src', img_src).appendTo(img_c);
		}
		ui.bp = $('<div class="button-place-people-el"></div>').appendTo(li);
		ui.lp = $('<div class="p-link-place"></div>').appendTo(li);
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
						});
						pliking = true;
					}
				});
			nb.c.appendTo(pui.bp);
		}
		
		return pui.c;
	};
	var createPeopleList = function(people, opts){
		var o = opts || {};
		
		var ul = $("<ul class='people-list'></ul>");
		if (o.wide){
			ul.addClass('people-l-wide');
		}
		
		for (var i=0; i < people.length; i++) {
			if (people[i].info){
				ul.append(buildPeopleLE(people[i], opts));
			}
		}
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
					},1000);
					
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
					},1000);
					
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
	
	var wow_tags= function(tag,c){
		$('<a class="js-serv hyped-tag"></a> ')
			.text(tag)
			.click(function(e){
				sui.show_tag(tag);
				su.track_event('Navigation', 'hyped at start page', "tag: " + tag );
				e.preventDefault();
			}).appendTo(c);
		c.append(' ');
		
	};
	
	
	if (window.lastfm_toptags && lastfm_toptags.length){
		var _c = $('<div class="block-for-startpage tags-hyped"></div>').appendTo(sui.els.start_screen);
		$('<h3></h3>').appendTo(_c)
						.append(localize('Pop-tags','Popular tags'));
		for (var i=0; i < lastfm_toptags.length; i++) {
			wow_tags(lastfm_toptags[i], _c);
		}
	}
	
};

