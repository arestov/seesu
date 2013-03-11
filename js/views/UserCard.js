var SoftVkLoginUI = function() {};
VkLoginUI.extendTo(SoftVkLoginUI, {
	createBase: function() {
		this._super();
		this.c.removeClass('attention-focuser');
	}
});




var PersonalListPreview = function() {};
ListPreview.extendTo(PersonalListPreview, {
	clickAction: function() {
		this.md.requestList();
	},
	'stch-pmd_vswitched': function(state) {
		this.c.toggleClass('access-request', state);
	},
	children_views: {
		auth_block_lfm: LfmLoginView,
		auth_block_vk: SoftVkLoginUI,
		preview_list: ArtistsListPreviewLine
	},
	'collch-auth_part': {
		place: 'tpl.ancs.auth_con',
		by_model_name: true
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 9
	}
});
var PersonalAlbumsListPreview = function() {};
AlbumsListPreview.extendTo(PersonalAlbumsListPreview, {
	clickAction: function() {
		this.md.requestList();
	},
	'stch-pmd_vswitched': function(state) {
		this.c.toggleClass('access-request', state);
	},
	children_views: {
		auth_block_lfm: LfmLoginView,
		auth_block_vk: SoftVkLoginUI,
		preview_list: AlbumsListPreviewItem
	},
	'collch-auth_part': {
		place: 'tpl.ancs.auth_con',
		by_model_name: true
	},
	'collch-preview_list': {
		place: 'tpl.ancs.listc',
		limit: 15
	}
});


var UserCardPage = function(){};
PageView.extendTo(UserCardPage, {
	useBase: function(node) {
		this.c = node;
		this.bindBase();
	},
	createBase: function() {
		this.c = this.root_view.getSample('user_page');
		this.bindBase();
	},
	bindBase: function() {
		this.createTemplate();
	},
	children_views: {
		'user-playlists': LiListsPreview,
		users_acqutes: UserAcquaintancesListPreview,
		vk_audio: PersonalListPreview,
		arts_recomms: PersonalListPreview,
		lfm_loved: PersonalListPreview,
		new_releases: PersonalAlbumsListPreview,
		recomm_releases: PersonalAlbumsListPreview
	},
	'collch-users_acqutes': 'tpl.ancs.users_acqutes'
});

var UserCardPreview = function() {};
provoda.View.extendTo(UserCardPreview, {
	createBase: function() {
		this.c = this.root_view.els.pestf_preview;
		this.aqc_preview_c = this.c.find('.aqc_preview');

		//this.c.text('Персональная музыка');
		var _this = this;

		var button = this.c.find('.to-open-block').click(function() {
			_this.md.showOnMap();
		});
		this.addWayPoint(button);

		
	},
	'stch-can_expand': function(state){
		if (state){
			this.requirePart('start-page-blocks');
		}
	},
	children_views: {
		users_acqutes : {
			main: UserAcquaintancesListPreview
		}
	},
	'collch-users_acqutes': 'aqc_preview_c',
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
				
				$('<img/>').attr('src', img_src || 'http://vk.com/images/camera_b.gif').appendTo(img_c);
				
				ui.bp = $('<div class="button-place-people-el"></div>').appendTo(li);
				ui.lp = $('<div class="p-link-place"></div>').appendTo(li);
				return ui;
			};
			
			

			
			var buildPeopleLE = function(man, opts){
				opts = opts || {};
				
				var pui = createPeopleListEl(man.info.photo);
				
				
				if (opts.links){
					pui.lp.append(_this.root_view.getAcceptedDesc(man));
				
				} else if (opts.accept_button){
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
				opts = opts || {};
				
				var ul = $("<ul class='people-list'></ul>");
				if (opts.wide){
					ul.addClass('people-l-wide');
				}
				
				for (var i=0; i < people.length; i++) {
					if (people[i].info){
						ul.append(buildPeopleLE(people[i], opts));
					}
				}
				return ul;
			};
			return true;
			var rl_place = this.root_view.els.start_screen.find('.relations-likes-wrap').removeClass('hidden');
			var ri_place = this.root_view.els.start_screen.find('.relations-invites-wrap').removeClass('hidden');
			
			

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