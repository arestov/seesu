define(function(require) {
'use strict';

var uacq = require('./uacq');
var spv = require('spv');
var View = require('View');

var UserCardPreview = spv.inh(View, {}, {
	dom_rp: true,
	createBase: function() {
		this.c = this.root_view.els.pestf_preview;
		this.aqc_preview_c = this.c.find('.aqc_preview');

		var _this = this;

		var button = this.c.find('.to-open-block').click(function() {
			_this.requestPage();
		});
		this.addWayPoint(button);
		this.button = button;
		this.dom_related_props.push('button');
	},
	'stch-mp_show': function(target, state) {
		target.button.toggleClass('button_selected', !!state);
	},
	children_views: {
		users_acqutes : {
			main: uacq.UserAcquaintancesListPreview
		}
	},
	'collch-users_acqutes': 'aqc_preview_c',
});
return UserCardPreview;
});
