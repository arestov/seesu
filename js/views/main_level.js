var LfmCommonLoginView = function(){};
LfmLoginView.extendTo(LfmCommonLoginView, {
	createBase: function(){
		this._super();
		this.un_form = app_view.samples.lfm_input.clone().appendTo(this.c);
		this.un_input = this.un_form.find('.lfm-username');

		var _this = this;
		this.un_form.on('submit', function(e) {
			_this.md.handleUsername(_this.un_input.val());
			return false;
		});
	},
	'stch-can-fetch-crossdomain': function(state) {
		if (state){
			this.un_form.removeClass('needs-cross-domain');
		} else {
			this.un_form.addClass('needs-cross-domain');
		}
		
	}
});




var LastfmRecommRowView = function(){};
BaseCRowUI.extendTo(LastfmRecommRowView, {
	createDetailes: function(){

		var parent_c = this.parent_view.row_context;
		var buttons_panel = this.parent_view.buttons_panel;
		var parent_c = this.parent_view.row_context; 
		var buttons_panel = this.parent_view.buttons_panel;
		var md = this.md;
		this.c = parent_c.children('.lfm-recomm');
		this.button = buttons_panel.find('#lfm-recomm').click(function(){
			if (!lfm.sk){
				md.switchView();
			} else {
				render_recommendations();
			}
			
			return false;
		});
	},
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}

		var lfm_reccoms = this.getCollection('lfm_reccoms', true);
		var lfm_reccoms_view = this.getFreeChildView('lfm_reccoms', lfm_reccoms, 'main');
		this.c.append(lfm_reccoms_view.getA());

		this.requestAll();
	},
	children_views: {
		'lfm_reccoms': LfmCommonLoginView
	}
});



var LastfmLoveRowView = function(){};
BaseCRowUI.extendTo(LastfmLoveRowView, {
	createDetailes: function(){
		var parent_c = this.parent_view.row_context; 
		var buttons_panel = this.parent_view.buttons_panel;
		var md = this.md;
		this.c = parent_c.children('.lfm-loved');
		this.button = buttons_panel.find('#lfm-loved').click(function(){
			if (!lfm.sk){
				md.switchView();
			} else {
				render_loved();
			}
			
			return false;
		});
	},
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}

		var lfm_loves = this.getCollection('lfm_loves', true);
		var lfmlove_view = this.getFreeChildView('lfm_loves', lfm_loves, 'main');
		this.c.append(lfmlove_view.getA());

		this.requestAll();
	},
	children_views: {
		'lfm_loves': LfmCommonLoginView
	}
});



var FastPSRowView = function(){};
ActionsRowUI.extendTo(FastPSRowView, {
	createBase: function(c){
		this.c = this.parent_view.els.fast_personal_start;
		this.row_context = this.c.find('.row-context');
		this.arrow = this.row_context.children('.rc-arrow');
		this.buttons_panel = this.c;
	},

	children_views: {
		"lastfm-recomm": {
			main: LastfmRecommRowView
		},
		"lastfm-love": {
			main: LastfmLoveRowView
		}
	}
});





var mainLevelUI = function(){};

suServView.extendTo(mainLevelUI, {
	createDetailes: function(){
		var _this = this;

		this.els = this.parent_view.els;
		this.els.search_form.find('#hint-query').text(su.popular_artists[(Math.random()*10).toFixed(0)]);

		this.els.search_form.find('#app_type').val(su.env.app_type);
		
		this.els.search_form.submit(function(){return false;});
		
		$(this.parent_view.d).keydown(function(e){
			if (!_this.els.slider.className.match(/show-search-results/)) {return;}
			if (_this.parent_view.d.activeElement.nodeName == 'BUTTON'){return;}
			arrows_keys_nav(e);
		});
		this.search_input = this.els.search_input;
	
		this.search_input.on('keyup change', function(e) {
			var input_value = this.value;
			_this.overrideStateSilently('search-query', input_value);
			_this.parent_view.md.search(input_value);
			
			
		});

		
	},
	'collch-fast_pstart': function(name, arr) {
		var view = this.getFreeChildView(name, arr[0], 'main');
		this.requestAll();
	},
	children_views: {
		fast_pstart: {
			main: FastPSRowView
		}
	},
	state_change: {
		'mp-show': function(opts) {
			if (opts){
				if (opts.userwant){
					this.search_input[0].focus();
					this.search_input[0].select();
				}
			} else {
				
			}
		},
		'mp-blured': function(state) {
			if (state){
				$(this.els.slider).removeClass("show-start");
			} else {
				$(this.els.slider).addClass("show-start");
			}
		},
		"can-expand": function(state) {
			if (state){
				this.requirePart('start-page-blocks');
			}
		},
		"have-playlists": function(state){
			if (state){
				if (!this.plts_link){
					this.plts_link =  this.els.fast_personal_start.children('.cus-playlist-b');
					var _this = this;
					this.plts_link.children('a').click(function(e){
						e.preventDefault();
						_this.md.fast_pstart.hideAll();
						_this.md.showPlaylists();
						
					});
				}
				this.plts_link.removeClass('hidden');
			}
		},
		"search-query": function(state) {
			this.search_input.val(state || '');
		},
		"ask-rating-help": function(link){
			var _this = this;

			if (link){
				var spm_c = this.els.start_screen.find('.start-page-messages');
				this.message_arh_c = $('<div class="attention-message"></div>');

				$("<a class='close-message'>×</a>").appendTo(this.message_arh_c).click(function() {
					_this.md.closeMessage('rating-help');
				});
				$('<img class="message-image"/>').attr({
					src: 'http://cs9767.userapi.com/u198193/b_b379d470.jpg',
					width: 100,
					height: 126,
					alt: "Gleb Arestov"
				}).appendTo(this.message_arh_c);


				

				var url = $("<a class='external'></a>").attr('href', link).text(localize('at-this-page'));
				this.message_arh_c.append(createComlexText(localize("ask-rating-help")).setVar("app_url", url[0]));
				spm_c.append(this.message_arh_c);

				/*
				

				Поддержи сису — поставь оценку
				
				*/
			} else {
				if (this.message_arh_c){
					this.message_arh_c.remove();
	
				}
			}
		}
	},
	parts_builder: {
		'start-page-blocks': function() {
			var _this = this;

			var users_play = $('<div class="block-for-startpage users-play-this"></div>').appendTo(this.els.start_screen);
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
										_this.parent_view.md.showTopTacks(a, {}, {artist: a, track: t});			
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
			
			var _cmetro = $('<div class="block-for-startpage random-metro-chart"></div>').appendTo(this.els.start_screen);
			var createTrackLink = function(artist, track, track_obj, playlist){
				return $('<a class="js-serv"></a>').text(artist + ' - ' + track).click(function(e){
					su.app_md.show_playlist_page(playlist);
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
							
									var plr = su.preparePlaylist({//fix params for cache
										title: 'Chart of ' + random_metro.name,
										type: 'chart', 
										data: {country: random_metro.country, metro: random_metro.name}
									});
									
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
					pui.lp.append(_this.parent_view.getAcceptedDesc(man));
				
				} else if (o.accept_button){
					var nb = _this.parent_view.createNiceButton();
						nb.b.text( localize('accept-inv', 'Accept invite'));
						nb.enable();
						
						var pliking;
						
						nb.b.click(function(){
							if (!pliking){
								//var p =
								su.s.api('relations.acceptInvite', {from: man.user}, function(r){
									
									if (r.done){
										su.trackEvent('people likes', 'accepted', false, 5);
										$('<span class="desc"></span>').text(su.app_md.getRemainTimeText(r.done.est, true)).appendTo(pui.lp);
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
			var rl_place = this.els.start_screen.find('.relations-likes-wrap');
			var ri_place = this.els.start_screen.find('.relations-invites-wrap');
			

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
						_this.parent_view.md.show_tag(tag);
						su.trackEvent('Navigation', 'hyped at start page', "tag: " + tag );
						e.preventDefault();
					}).appendTo(c);
				c.append(' ');
				
			};
			
			
			if (window.lastfm_toptags && lastfm_toptags.length){
				var _c = $('<div class="block-for-startpage tags-hyped"></div>').appendTo(this.els.start_screen);
				$('<h3></h3>').appendTo(_c)
								.append(localize('Pop-tags','Popular tags'));
				for (var i=0; i < lastfm_toptags.length; i++) {
					wow_tags(lastfm_toptags[i], _c);
				}
			}


			return true;
		}
	}
});
