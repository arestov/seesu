var appTelegrapher = function(){};
appTelegrapher.prototype = {
	init: function(wd, tracking_opts) {

		var md = su.app_md;


		var view = (new this.appView());
		md.addView(view);

		view.init(md, false, {d: wd.document, allow_url_history: true});
		view.requestAll();
	},
	appView: appModelView
};