var appTelegrapher = function(){};
appTelegrapher.prototype = {
	init: function(wd, tracking_opts, can_die) {

		var md = su;


		var view = (new this.appView());
		md.addView(view);

		view.init(md, false, {d: wd.document, allow_url_history: true, can_die: can_die});
		view.requestAll();
		this.app_view = view;
	},
	appView: appModelView
};