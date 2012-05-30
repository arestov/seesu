var ShareRow;
(function(){
"use strict";


var struserSuggestView = function() {};
var struserSuggest = function(wrap) {
	var user = wrap.user;

	this.init();
	this.mo = wrap.mo;
	this.row = wrap.row;
	this.user_id = user.uid;
	this.photo = user.photo;
	this.online = this.online;
	//this.name = user.name;
	this.text_title = user.first_name + " " + user.last_name;
};
baseSuggest.extendTo(struserSuggest, {
	valueOf: function(){
		return this.user_id;
	},
	onView: function(){
		//this.pl.add(this.mo);
		//this.rpl.hide();
		//su.views.showStaticPlaylist(this.pl, true);
		this.mo.postToVKWall();
		this.row.hide();
	},
	ui_constr: struserSuggestView
});
baseSuggestUI.extendTo(struserSuggestView, {
	createItem: function() {
		var that = this.md;
		this.a = $('<a></a>')
			.text(that.text_title)
			.appendTo(this.c);
		$('<img />').attr("src", that.photo).prependTo(this.a);
		this.c.addClass('share-user-suggest');
		return this;
	}
});

var StrusersRSSection = function() {
	this.init();
};
searchSection.extendTo(StrusersRSSection, {
	resItem: struserSuggest,
	ui_constr: searchSectionUI
});


var StrusersRowSearch = function(rpl, mo) {
	this.init(rpl, mo);
};
investigation.extendTo(StrusersRowSearch, {
	init: function(rpl, mo) {
		this._super();
		this.rpl = rpl;
		this.mo = mo;
		this.addSection('users', new StrusersRSSection());
	},
	ui_constr: investigationUI,
	handleVKFriendsSearch: function(list){
		var r = (this.q ? searchInArray(list, this.q, ["first_name", "last_name"]) : list);
		if (r.length){
			r = r.concat();
			for (var i = 0; i < r.length; i++) {
				r[i] = {
					mo: this.mo,
					user: r[i],
					row: this.rpl
				};
			}
		}

		this.g('users').appendResults(r, true);
	},
	searchf: function() {
		var
			_this = this,
			pl_sec = this.g('users');

		pl_sec.setActive();
		pl_sec.changeQuery(this.q);

		su
			.once("vk-friends.share-row", function(list){
				_this.handleVKFriendsSearch(list);
			}, true)
			.getVKFriends();
	}
});





var ShareRowUI = function(){};
BaseCRowUI.extendTo(ShareRowUI, {
	init: function(md, parent_c, buttons_panel){
		this.md = md;
		this._super();
		this.c = parent_c.children('.share-song');
		this.button = buttons_panel.find('.pc-place .pc-rupor');
		
		this.users_c = $('<div class="users-list"></div>').appendTo(this.c);

		$("<h3></h3>").text("Поместить песню").appendTo(this.users_c);

		this.bindClick();
		this.setModel(md);
	},
	state_change: cloneObj(cloneObj({},BaseCRowUI.prototype.state_change), {

		"share-url": {
			fn: function(state){
				this.getPart("share_input").val(state || "")
			//	dep_vp
			},
			dep_vp: ['share_input']
		}
	}),
	parts_builder: {
		share_input: function(){
			var share_input = this.c.find('.song-link');
			share_input.bind("click focus", function() {
				this.select();
			});
			return share_input;
		}
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		var _this = this;

		this.requirePart("share_input");
		/*
		this.share_input = this.c.find('.song-link').val();
		this.share_input.bind("click focus", function() {
			this.select();
		});
*/

		var oldv;
		var inputSearch = debounce(function(e) {
			var newval = this.value;
			if (oldv !== newval){
				_this.md.search(newval);
				oldv = newval;
			}
			
		}, 100);

		var input_place = $("<div class='list-search-input-place'></div>").appendTo(this.users_c);


		this.input = $("<input type='text'/>").appendTo(input_place)
			.bind('keyup change search mousemove', inputSearch);

		this.mywall_button = $("<div class='post-to-my-vk-wall'></div>").click(function(){
			_this.md.mo.postToVKWall();
		}).text("на свою стену").appendTo(this.users_c);

		var current_user_info = su.s.getInfo('vk');
		if (current_user_info && current_user_info.photo){
			$("<img />").attr("src", current_user_info.photo).prependTo(this.mywall_button)
		}

		this.users_c.append($("<div class='friends-search-desc desc'></div>").text("или на стену одного из друзей"));
		var searcher_ui = this.md.searcher.getFreeView();
		if (searcher_ui){
			this.users_c.append(searcher_ui.getC());
			searcher_ui.expand();
			searcher_ui.appended();
		}

		this.md.search("");
	}
});

ShareRow = function(traackrow, mo){
	this.init(traackrow, mo);
};
BaseCRow.extendTo(ShareRow, {
	init: function(traackrow, mo){
		var _this = this;
		this.traackrow = traackrow;
		this.mo = mo;
		this._super();
		if (app_env.vkontakte || su.vk_api){
			this.updateState("can-post-to-current-user", true);
		} 

		this.searcher = new StrusersRowSearch(this, mo);
		this.addChild(this.searcher);

		var updateSongURL = function(){
			_this.updateState('share-url', _this.mo.getShareUrl());
		};
		updateSongURL();

		this.mo.on("url-change", function(){
			updateSongURL();
		});
		//this.share_url = this.mo.getShareUrl();
		
	},
	search: function(q) {
		this.updateState('query', q);
		this.searcher.changeQuery(q);
	},
	row_name: 'share',
	ui_constr: ShareRowUI
});
})()


