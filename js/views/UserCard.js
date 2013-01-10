var PlaylistPreview = function() {};
provoda.View.extendTo(PlaylistPreview, {
	createDetailes: function() {
		this.createBase();
	},
	createBase: function() {
		this.c = $('<div></div>');
		this.prew_c = $('<div class="playlist_preview-c"></div>').appendTo(this.c);
		var _this = this;
		this.prew_c.click(function() {
			_this.md.requestPlaylist();
		});
		this.auth_c = $('<div class="auth-con"></div>').appendTo(this.c);
		//this.
	},
	'stch-has-access': function(state) {
		this.prew_c.toggleClass('placeholdered-text', !state);
	},
	'stch-pmd-vswitched': function(state) {
		this.c.toggleClass('access-request', state);
	},
	'stch-nav-title': function(state) {
		this.prew_c.text(state);
	},
	'collch-auth_part': function(name, md) {
		var view = this.getFreeChildView(name, md);
		if (view){
			this.auth_c.append(view.getA());
		}
		this.requestAll();
	},
	children_views: {
		auth_part: {
			main: LfmLoginView
		}
	}
});


var UserCardView = function() {};
provoda.View.extendTo(UserCardView, {
	createDetailes: function() {
		this.createBase();
	},
	createBase: function() {
		this.c = $('<div></div>');
	},
	'stch-mp-show': function(state) {
		this.c.toggleClass('hidden', !state);
	},
	'collch-arts_recomms': function(name, md) {
		var view = this.getFreeChildView(name, md);
		if (view){
			this.c.append(view.getA());
		}
		this.requestAll();
	},
	'collch-vk_audio': function(name, md) {
		var view = this.getFreeChildView(name, md);
		if (view){
			this.c.append(view.getA());
		}
		this.requestAll();
	},
	children_views: {
		arts_recomms: {
			main: PlaylistPreview
		},
		vk_audio: {
			main: PlaylistPreview
		}
	}
});





var UserCardPreview = function() {};
provoda.View.extendTo(UserCardPreview, {
	createDetailes: function(){
		this.createBase();
	},
	createBase: function() {
		this.c = this.root_view.els.pestf_preview;
		//this.c.text('Персональная музыка');
		var _this = this;
		this.c.find('.to-open-block').click(function() {
			su.showUserPage(_this.md);
			//_this.md
		});


		
	},
	'stch-can-expand': function(state){
		if (state){
			this.requirePart('start-page-blocks');
		}
	},
	parts_builder: {
		'start-page-blocks': function() {
			var _this = this;
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
				
					$('<img width="50" height="50"/>').attr('src', img_src || 'http://vk.com/images/camera_b.gif').appendTo(img_c);
				
				ui.bp = $('<div class="button-place-people-el"></div>').appendTo(li);
				ui.lp = $('<div class="p-link-place"></div>').appendTo(li);
				return ui;
			};
			
			

			
			var buildPeopleLE = function(man, opts){
				var o = opts || {};
				var el_opts = {};
				
				var pui = createPeopleListEl(man.info.photo);
				
				
				if (o.links){
					pui.lp.append(_this.root_view.getAcceptedDesc(man));
				
				} else if (o.accept_button){
					var nb = _this.root_view.createNiceButton();
						nb.b.text( localize('accept-inv', 'Accept invite'));
						nb.enable();
						
						var pliking;
						
						nb.b.click(function(){
							if (!pliking){
								//var p =
								su.s.api('relations.acceptInvite', {from: man.user}, function(r){
									
									if (r.done){
										su.trackEvent('people likes', 'accepted', false, 5);
										$('<span class="desc"></span>').text(su.getRemainTimeText(r.done.est, true)).appendTo(pui.lp);
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
			var rl_place = this.root_view.els.start_screen.find('.relations-likes-wrap');
			var ri_place = this.root_view.els.start_screen.find('.relations-invites-wrap');
			

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
			return true;
		}
	}
});