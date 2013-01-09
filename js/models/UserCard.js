var UsersList = function() {};
mapLevelModel.extendTo(UsersList, {
	
});


var UserCard = function() {};

mapLevelModel.extendTo(UserCard, {
	model_name: 'usercard',
	init: function(opts, params) {
		this._super.apply(this, arguments);
		this.app = opts.app;

		//this.
		//new
		this.for_current_user = params.for_current_user;
		if (this.for_current_user){
			this.permanent_md = true;
		}

		var _this = this;

		var postInit = function() {

			this.arts_recomms = new artistsRecommsList();
			this.arts_recomms.init({pmd: this, app: this.app});
			this.setChild('arts_recomms', this.arts_recomms);

			this.my_vkaudio = new MyVkAudioList();
			this.my_vkaudio.init({pmd: this, app: this.app});
			this.setChild('vk_audio', this.my_vkaudio);
		};
		jsLoadComplete({
			test: function() {
				return _this.app.p && _this.app.mp3_search;
			},
			fn: function() {
				postInit.call(_this);
			}
		});
		this.updateState('url-part', '/users/' + (this.for_current_user ? 'me' : params.username));

		this.updateState('nav-title', 'Персональная музыка, друзья и знакомства');
		/*

		аудиозаписи

		рекомендации артистов, альбомов, любимые

		последнее
		библиотека */

		return this;
	},
	'stch-mp-show': function(state) {
		if (state && state.userwant){
			var arts_recomms = this.getChild('arts_recomms');
			if (arts_recomms){
				arts_recomms.preloadStart();
			}
		}
	}
});