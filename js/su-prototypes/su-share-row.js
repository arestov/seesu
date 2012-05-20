

var ShareRow;
(function(){
"use strict";


var struserSuggestView = function() {};
var struserSuggest = function(user) {
	this.init();
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
	},
	ui_constr: struserSuggestView
});
baseSuggestUI.extendTo(struserSuggestView, {
	createItem: function() {
		var that = this.md;
		this.a = $('<a></a>')
			.text(that.text_title)
			.appendTo(this.c);
		$('<img width="25" height="25"/>').attr("src", that.photo).prependTo(this.a);
		this.c.addClass('share-user-suggest')
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
		this.g('users').appendResults((this.q ? searchInArray(list, this.q, ["first_name", "last_name"]) : list), true);
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
		
		this.users_c = $('<div class="users-list"></div>').appendTo(this.c)

		this.bindClick();
		this.setModel(md);
	},
	expand: function(){
		if (this.expanded){
			return;
		} else {
			this.expanded = true;
		}
		var _this = this;
		this.share_input = this.c.find('.song-link').val(this.md.mo.getShareUrl());
		this.share_input[0].select();
		this.share_input.bind("click focus", function() {
			this.select();
		});


		var oldv;
		var inputSearch = debounce(function(e) {
			var newval = this.value;
			if (oldv !== newval){
				_this.md.search(newval);
				oldv = newval;
			}
			
		}, 100);

		this.input = $("<input type='text'/>").appendTo(this.users_c)
			.bind('keyup change search mousemove', inputSearch);


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
		this.traackrow = traackrow;
		this.mo = mo;
		this._super();
		this.searcher = new StrusersRowSearch(this, mo);
		this.addChild(this.searcher);
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


