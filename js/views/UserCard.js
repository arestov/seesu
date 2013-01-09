var PlaylistPreview = function() {};
provoda.View.extendTo(PlaylistPreview, {
	createDetailes: function() {
		this.createBase();
	},
	createBase: function() {
		this.c = $('<div></div>');
		this.prew_c = $('<div class="playlist_preview-c">Рекоммендации артистов</div>').appendTo(this.c);
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