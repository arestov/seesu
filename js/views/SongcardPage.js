define(['pv', './etc_views', 'app_serv', 'jquery', 'spv', './ArtcardUI', './coct'],
function(pv, etc_views, app_serv, $, spv, ArtcardUI, coct) {
'use strict';
var localize = app_serv.localize;
var pvUpdate = pv.update;

var SongcardPage = function() {};
coct.SPView.extendTo(SongcardPage, {
	base_tree: {
		sample_name: 'songcard_page',
		children_by_selector: [{
			sample_name: 'artist_preview-base',
			selector: '.nested_artist',
			children_by_selector: [{
				sample_name: 'photo-cont',
				selector: '.possible_images_con'
			}]
		}]
	},
	children_views: {
		fans: coct.ImagedListPreview,
		cloudcasts: coct.ImagedListPreview,
		artist: ArtcardUI.ArtistInSongConstroller
	}
});

var FanPreview = function() {};
pv.View.extendTo(FanPreview, {
	'compx-can_use_image':{
		depends_on: ['vis_image_loaded', 'selected_image'],
		fn: function(vis_image_loaded, selected_image) {
			return !!(vis_image_loaded && selected_image);
		}
	},
	'stch-selected_image': function(target, state) {
		var image_node = target.tpl.ancs['user-image'];
		image_node.src = '';
		if (state){
			var url = state.lfm_id ?
				'http://userserve-ak.last.fm/serve/64s/' + state.lfm_id : state.url;

			if (url.lastIndexOf('.gif') == url.length - 4){
				return;
			}
			var req = target.root_view.loadImage({
				url: url,
				cache_allowed: true
			}).done(function() {
				image_node[0].src = url;
				target.setVisState('image_loaded', true);
			});
			target.addRequest(req);
		}
	}
});

var FansList = function() {};
pv.View.extendTo(FansList, {
	children_views: {
		list_items: FanPreview
	}
});

var SongcardController = function() {};
pv.View.extendTo(SongcardController, {
	dom_rp: true,
	children_views:{
		artist: ArtcardUI.ArtistInSongConstroller,
		fans: FansList
	},
	bindBase: function() {
		this.rowcs = {};
		this.wch(this.parent_view, 'vmp_show', function(e) {
			if (!this.isAlive()) {
				return;
			}
			if (!e.value && this.rowcs && this.rowcs.users_context){
				this.rowcs.users_context.hide();
			}
			if (e.value){
				this.expand();
			}
		});



	},
	'compx-disallow_seesu_listeners': [
		['#disallow_seesu_listeners'],
		function(state) {
			return state;
		}
	],
	'compx-can_expand_listeners': [
		['^vmp_show', 'artist_name', 'track_name', 'disallow_seesu_listeners', 'expanded'],
		function (vmp_show, artist_name, track_name, disallow_seesu_listeners, expanded) {
			return vmp_show && artist_name && track_name && expanded && !disallow_seesu_listeners;
		}
	],
	expand: function() {
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}

		var users = this.tpl.ancs['track-listeners'];
		var users_list = this.tpl.ancs['song-listeners-list'];


		var users_row_context =  this.tpl.ancs['row-listeners-context'];
		var users_context = new etc_views.contextRow(users_row_context);
		var uinfo_part = this.tpl.ancs['big-listener-info'];
		users_context.addPart(uinfo_part, 'user_info');

		this.t_users= {
			c: users,
			list: users_list
		};

		this.rowcs.users_context = users_context;
		this.dom_related_props.push('rowcs', 't_users');

		pvUpdate(this, 'expanded', true);
	},
	createListenersHeader: function(){
		if (this && this.t_users){
			if (!this.t_users.header){
				this.t_users.header = $('<div></div>').text(localize('listeners-looks')).prependTo(this.t_users.c);
			}
		}
	},
	createCurrentUserUI: function(user_info){
		if (this.t_users && !this.t_users.current_user){
			var div = this.t_users.current_user = $('<div class="song-listener current-user-listen"></div>');
			this.createUserAvatar(user_info, div);
			this.t_users.list.append(div);
			return div;
		}
	},
	'stch-can_expand_listeners': function(target, state) {
		if (!target.expanded){
			return;
		}
		if (!target.isAlive()) {
			return;
		}
		
		if (!state) {
			return;
		}
		var su = window.su;
		var last_update = target.t_users.last_update;
		//var current_user = su.s.getId();
		var artist_name = target.state('artist_name');
		var track_name = target.state('track_name');

		if (artist_name && track_name && (!last_update || (Date.now() - last_update) > 1000 * 60 * 1)){
			var d = {
				artist: artist_name,
				title: track_name
			};
			var current_user = su.s.getId('vk');
			var user_info;
			if (current_user){
				user_info = su.s.getInfo('vk');
				if (user_info){
					target.createCurrentUserUI(user_info);
				}
				target.createListenersHeader();

			}
			su.s.api('track.getListeners', d, function(r){
				if (!target.isAlive()){
					return;
				}
				var raw_users = r && r.done && [].concat.apply([], r.done);
				if (raw_users){
					var users = spv.filter(raw_users, 'user', function(value){
						if (value != current_user){
							return true;
						}
					});
					if (users.length){

						var above_limit_value = 0;
						var uul = $("<ul></ul>");
						for (var i=0; i < r.done.length; i++) {
							if (r.done[i] && r.done[i].length){
								above_limit_value = target.createSongListeners(
									r.done[i], uul, above_limit_value, current_user, target.rowcs.users_context);
							}

						}
						if (target.t_users.other_users){
							target.t_users.other_users.remove();
						}

						target.createListenersHeader();

						target.t_users.c.addClass('many-users');
						uul.appendTo(target.t_users.list);
						target.t_users.other_users = uul;
					}
				}
				//console.log(r)

			});
			target.t_users.last_update = (+new Date());
		}

	},

	showBigListener: function(c, lig){
		var _this = this;
		c.empty();

		if (lig.info && lig.info.photo_big){
			var algd;
			var img = _this.root_view.preloadImage(lig.info.photo_big, 'user photo', function(img){
				if (!algd){
					algd = true;
					_this.root_view.verticalAlign(img, {
						target_height: 252,
						animate: true,
						animate_time: 30
					});
				}

			}, $('<div class="big-user-avatar"></div>').appendTo(c));

			var real_height = (img.naturalHeight ||  img.height);
			if (real_height){
				algd = true;
				this.root_view.verticalAlign(img, {
					real_height: real_height,
					target_height: 252
				});

			}

		}

		if (su.s.loggedIn()){
			var liked = su.s.susd.isUserLiked(lig.user);
			var user_invites_me = su.s.susd.didUserInviteMe(lig.user);

			if (liked){

				if (liked.item.accepted){
					c.append(this.root_view.getAcceptedDesc(liked));
				} else{

					c.append(localize('you-want-user'));
					c.append('<br/>');

					c.append($('<span class="desc people-list-desc"></span>').text(localize('if-user-accept-i') + " " + localize('will-get-link')));
				}


			} else if (user_invites_me){
				if ( user_invites_me.item.accepted){
					c.append(this.root_view.getAcceptedDesc(user_invites_me));
				} else{
					c.append(localize('user-want-you'));
					c.append('<br/>');
					var lb = this.createAcceptInviteButton(lig);
					lb.c.appendTo(c);
				}

			} else {
				var current_user_info = su.s.getInfo('vk');

				if (current_user_info && current_user_info.photo_big) {
					this.createLikeButton(lig).c.appendTo(c);
				} else {
					var photoupreq_c = this.createPhotoUploadRequest();
					c.append(photoupreq_c);

					this.root_view.on('vip_state_change-vk_info.song-listener', function(e) {
						if (e.value && e.value.photo_big){
							photoupreq_c.before(this.createLikeButton(lig).c);

							photoupreq_c.remove();
						}
					}, {
						exlusive: true,
						immediately: true
					});
				}
			}

		} else{
			c.append(this.root_view.samples.vk_login.clone(localize('to-meet-man-vk')));

		}


	},
	createSongListener: function(lig, uc){
		var _this = this;

		var li = $('<li class="song-listener"></li>').click(function() {

			if (!uc.isActive('user_info') || uc.D('user_info', 'current-user') != lig.user){



				uc.D('user_info', 'current-user', lig.user);


				var c = uc.C('user_info');

				_this.showBigListener(c, lig);

				var callback = function(){
					_this.showBigListener(c, lig);
				};
				su.s.auth.regCallback('biglistener', callback);


				uc.showPart('user_info', function() {
					return {
						left: li.offset().left,
						owidth: li.outerWidth()
					};
				});
				su.trackEvent('peoples', 'view');
				_this.onDie(function() {
					su.s.auth.removeCallback('biglistener', callback);
				});
			} else{
				uc.hide();
			}

		});
		this.createUserAvatar(lig.info, li);


		return li;


	},
	createSongListeners: function(listenings, place, above_limit_value, exlude_user, users_context){
		var users_limit = 5;
		for (var i=0, l = Math.min(listenings.length, Math.max(users_limit, users_limit + above_limit_value)); i < l; i++) {
			if (!exlude_user || (listenings[i].user != exlude_user && listenings[i].info)){
				place.append(this.createSongListener(listenings[i], users_context));
			}
		}
		return Math.max(users_limit - listenings.length, 0);
	},
	createPhotoUploadRequest: function() {
		var con = $('<div></div>');

		var vk_photo_meet_need = localize('vk_photo_meet_need');
		var vk_photo_update = localize('vk_photo_update');

		var nb = this.root_view.createNiceButton();
		nb.b.text( vk_photo_update );
		nb.enable();
		nb.c.addClass('get-vk-photo-request-b');
		var _this = this;
		nb.b.click(function(){
			_this.root_view.RPCLegacy('getPhotoFromVK');
		});
		con.append(nb.c);


		var big_string = vk_photo_meet_need.replace('%button_name%', vk_photo_update);
		var desc = document.createTextNode(big_string);
		con.append(desc);
		return con;

	},
	createUserAvatar: function(info, c, size){
		var imageplace = $("<div class='image-cropper'></div>").appendTo(c);
		$('<img alt="user photo" />').attr('src', info.photo).appendTo(imageplace);

	},
	createLikeButton: function(lig){
		var nb = this.root_view.createNiceButton();
		nb.b.text( localize('want-meet', 'Want to meet') + '!');
		nb.enable();
		var pliking = false;
		nb.b.click(function(){
			if (!pliking){
				su.s.api('relations.setLike', {to: lig.user}, function(r){
					if (r.done){
						su.trackEvent('people likes', 'liked');
						var gc = $("<div></div>");
						nb.c.after(gc);

						gc.append($('<span class="desc people-list-desc"></span>').text(localize('if-user-accept-i') + " " + localize('will-get-link')));
						nb.c.remove();
					}
					pliking = false;
				});
				pliking = true;
			}



		});
		return nb;
	},
	createAcceptInviteButton: function(lig){
		var nb = this.root_view.createNiceButton();
		nb.b.text( localize('accept-inv', 'Accept invite'));
		nb.enable();
		var pliking = false;
		nb.b.click(function(){
			if (!pliking){
				su.s.api('relations.acceptInvite', {from: lig.user}, function(r){

					if (r.done){
						su.trackEvent('people likes', 'accepted', false, 5);
						nb.c.after(
							$('<span class="people-list-desc desc"></span>')
								.text(app_serv.getRemainTimeText(r.done.est, true))
						);
						nb.c.remove();
					}
					pliking = false;
				});
				pliking = true;
			}



		});
		return nb;
	}

});
SongcardPage.SongcardController = SongcardController;

return SongcardPage;
});

