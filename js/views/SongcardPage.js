define(['provoda', './etc_views', 'app_serv', 'jquery', 'spv', './ArtcardUI', './coct'],
function(provoda, etc_views, app_serv, $, spv, ArtcardUI, coct) {
'use strict';
var localize = app_serv.localize;
var app_env = app_serv.app_env;

var SongcardPage = function() {};
coct.SPView.extendTo(SongcardPage, {
	createBase: function() {
		this.c = this.root_view.getSample('songcard_page');

		var nart_dom = this.root_view.getSample('artist_preview-base');
		this.c.children('.nested_artist').append(nart_dom);

		this.createTemplate();
	},
	children_views: {
		fans: coct.ImagedListPreview,
		artist: ArtcardUI.ArtistInSongConstroller
	}
});

var FanPreview = function() {};
provoda.View.extendTo(FanPreview, {
	'compx-can_use_image':{
		depends_on: ['vis_image_loaded', 'selected_image'],
		fn: function(vis_image_loaded, selected_image) {
			return !!(vis_image_loaded && selected_image);
		}
	},
	'stch-selected_image': function(state) {
		var image_node = this.tpl.ancs['user-image'];
		image_node.src = '';
		var _this = this;
		if (state){
			var url = state.lfm_id ?
				'http://userserve-ak.last.fm/serve/64s/' + state.lfm_id : state.url;

			if (url.lastIndexOf('.gif') == url.length - 4){
				return;
			}
			var req = this.root_view.loadImage({
				url: url,
				cache_allowed: true
			}).done(function() {
				image_node[0].src = url;
				_this.setVisState('image_loaded', true);
			});
			this.addRequest(req);
		}
	}
});

var FansList = function() {};
provoda.View.extendTo(FansList, {
	children_views: {
		list_items: FanPreview
	}
});

var SongcardController = function() {};
provoda.View.extendTo(SongcardController, {
	dom_rp: true,
	children_views:{
		artist: ArtcardUI.ArtistInSongConstroller,
		fans: FansList
	},
	bindBase: function() {
		this.rowcs = {};
		this.wch(this.parent_view, 'vmp_show', function(e) {
			if (!e.value && this.rowcs && this.rowcs.users_context){
				this.rowcs.users_context.hide();
			}
			if (e.value){
				this.expand();
				this.updateSongListeners();
			}
		});



	},
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
			this.root_view.createUserAvatar(user_info, div);
			this.t_users.list.append(div);
			return div;
		}
	},
	updateSongListeners: function(){
		if (!this.expanded){
			return;
		}
		var su = window.su;
		var _this = this;
		var last_update = this.t_users.last_update;
		//var current_user = su.s.getId();
		var artist_name = this.state('artist_name');
		var track_name = this.state('track_name');

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
					_this.createCurrentUserUI(user_info);
				}
				_this.createListenersHeader();

			}
			su.s.api('track.getListeners', d, function(r){
				if (!_this.isAlive()){
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
								above_limit_value = _this.root_view.createSongListeners(
									r.done[i], uul, above_limit_value, current_user, _this.rowcs.users_context);
							}

						}
						if (_this.t_users.other_users){
							_this.t_users.other_users.remove();
						}

						_this.createListenersHeader();

						_this.t_users.c.addClass('many-users');
						uul.appendTo(_this.t_users.list);
						_this.t_users.other_users = uul;
					}
				}
				//console.log(r)

			});
			this.t_users.last_update = (+new Date());
		}
	}
});
SongcardPage.SongcardController = SongcardController;

return SongcardPage;
});