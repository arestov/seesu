var songControlsView = function(){
	servView.prototype.init.call(this);
	var getClickPosition = function(e, node){
		//e.offsetX || 
		var pos = e.pageX - $(node).offset().left;
		return pos;
	};

	this.c = $('<div class="track-progress"></div>')
	var _this = this;
	this.c.click(function(e){
		var pos = getClickPosition(e, this);
		_this.song_file.setPositionByFactor(_this.width && ((pos/_this.width)));
		//su.ui.hidePopups();
		//e.stopPropagation();	
	});
	this.cloading = $('<div class="track-load-progress"></div>').appendTo(this.c);
	this.cplayng = $('<div class="track-play-progress"></div>').appendTo(this.c);
	this.track_text = $('<span class="track-node-text"></span>').appendTo(this.c);
	this.mopla_title = this.track_text;
};
songControlsView.prototype = new servView();
cloneObj(songControlsView.prototype, {
	constructor: songControlsView,
	state_change: {
		'playing-progress': function(factor){
			this.changeBar(this.cplayng, factor);
		},
		'loading-progress': function(factor){
			this.changeBar(this.cloading, factor);
		}
	},
	prop_change: {
		title: function(title){
			this.mopla_title.text(title || '')
		},
		desc: function(text){
			this.mopla_title.attr('title', text || "");
		}	
	},
	changeBar: function(bar, factor){
		if (factor){
			if (this.width){
				bar[0].style.width = factor * this.width + 'px'
			} else {
				bar[0].style.width = factor * 100 + '%'
			}
		} else {
			bar[0].style.width = 0;
		}
	},
	reset: function(){
		this.cplayng[0].style.width = this.cloading[0].style.width = '0';
		this.width = this.c.width();
	}
});