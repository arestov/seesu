define(['provoda', './etc_views', 'app_serv', 'jquery', 'spv', './ArtcardUI'],
function(provoda, etc_views, app_serv, $, spv, ArtcardUI) {
'use strict';
var localize = app_serv.localize;
var app_env = app_serv.app_env;

var SongcardPage = function() {};
provoda.View.extendTo(SongcardPage, {
	createBase: function() {
		this.c = this.root_view.getSample('songcard_page');

		var nart_dom = this.root_view.getSample('artist_preview-base');
		this.c.children('.nested_artist').append(nart_dom);

		this.createTemplate();
	}
});


var SongcardController = function() {};
provoda.View.extendTo(SongcardController, {
	dom_rp: true,
	children_views:{
		artist: ArtcardUI.ArtistInSongConstroller
	},
	bindBase: function() {
		this.rowcs = {};
		var _this = this;
		this.parent_view.on('state-change.mp_show', function(e) {
			if (!e.value && _this.rowcs.users_context){
				_this.rowcs.users_context.hide();
			}
		});
		this.parent_view.on('state-change.mp_show', function(e) {
			if (e.value){
				_this.expand();
				_this.updateSongListeners();
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
		this.dom_related_props.push('song_actions_c', 'rowcs', 't_users');
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