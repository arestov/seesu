provoda.addPrototype("songsListBaseView", {
	state_change: {
		'list_loading': function(loading){
			if (loading){
				this.lc.addClass('loading');
			} else {
				this.lc.removeClass('loading');
			}
		},
		"more_load_available": function(state) {
			
			if (state){
				this.requirePart("load-more-b").removeClass("hidden");
			} else {
				var button = this.getPart("load-more-b");
				if (button){
					button.addClass("hidden");
				}
			}
		},
		"can_play": function(state) {
			if (state){
				//make-trs-plable
				this.c.addClass('has-files-in-songs');
			} else {
				this.c.removeClass('has-files-in-songs');
			}
		}
	},
	dom_rp: true,
	parts_builder: {
		"load-more-b": function() {
			var _this = this;
			var node = $("<a class='load-more-list-data'></a>").click(function() {
				_this.RPCLegacy('requestMoreData', true);
			}).text(localize("load-more")).appendTo(this.c);

			this.addWayPoint(node, {
				canUse: function() {
					return _this.state('more_load_available');
				}
			});
			
			return node;
		}
	},
	createListBase: function() {
		this.lc = $('<ul class="tracks-for-play list-overview"></ul>').appendTo(this.c);
		this.dom_related_props.push('lc');
	},
	createBase: function() {
		this.c = $('<div class="playlist-container"></div>');
		if (this.createPanel){
			this.createPanel();
		}
		this.createListBase();

	},
	'collch-songs-list': {
		place: 'lc',
		space: 'main',
		opts: function(){
			return {lite: this.opts && this.opts.overview};
		}
	}
});