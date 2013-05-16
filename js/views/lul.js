define(['provoda', './coct'], function(provoda, coct) {
"use strict";
var LULAPageVIew = function() {};
provoda.View.extendTo(LULAPageVIew, {
	createBase: function() {
		this.c = this.root_view.getSample('lula_page');
		this.createTemplate();
	},
	children_views: {
		all_time: coct.ListPreview
	}

});

var LULAsPageVIew = function() {};
provoda.View.extendTo(LULAsPageVIew, {
	createBase: function() {
		this.c = this.root_view.getSample('lulas_page');
		this.createTemplate();
	}
});
var UserTagPageView = function() {};
provoda.View.extendTo(UserTagPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('user_tag_page');
		this.createTemplate();
	},
	children_views: {
		tracks: coct.ListPreview,
		artists: coct.ListPreview,
		albums: coct.ListPreview
	}
});

var UserTagsPageView = function() {};
provoda.View.extendTo(UserTagsPageView, {
	createBase: function() {
		this.c = this.root_view.getSample('user_tags_page');
		this.createTemplate();
	}
});

return {
	LULAPageVIew: LULAPageVIew,
	LULAsPageVIew: LULAsPageVIew,
	UserTagsPageView: UserTagsPageView,
	UserTagPageView: UserTagPageView
};
});