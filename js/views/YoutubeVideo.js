var YoutubePreview = function() {};
provoda.View.extendTo(YoutubePreview, {
	createBase: function() {
		var li = $('<li class="you-tube-video-link"></li>');
		this.c = li;
		var _this = this;

		this.c.click(function(e){
			e.stopPropagation();
			e.preventDefault();
			_this.md.requestVideo();
			
			
		});

		this.user_link = $("<a class='video-preview external'></a>").appendTo(li);

		this.addWayPoint(li);
	},
	'stch-title': function(state) {
		this.c.attr('title', state || "");
	},
	'stch-cant_show': function(state) {
		this.c.toggleClass('cant-show', !!state);
	},
	'stch-yt_id': function(state) {
		var link = 'http://www.youtube.com/watch?v=' + state;
		this.user_link.attr('href', link);
	},
	'stch-previews': function(thmn) {
		var imgs = $();

		if (thmn.start && thmn.middle &&  thmn.end){
			$.each(["start","middle","end"], function(i, el) {

				var span = $("<span class='preview-slicer'></span>");

				$('<img  alt=""/>').addClass('preview-part preview-' + el).attr('src', thmn[el]).appendTo(span);

				imgs = imgs.add(span);

			});
		} else {
			imgs.add($('<img  alt="" class="whole"/>').attr('src', thmn['default']));
		}
		this.user_link.empty().append(imgs);
						
	}
});


var YoutubeVideoView = function() {};
PageView.extendTo(YoutubeVideoView, {
	full_page: true,
	createBase: function() {
		this.c = $('<div class="youtube-video-page"></div>');
	},
	'stch-yt_id': function(state) {
		$(this.root_view.create_youtube_video(state)).appendTo(this.c);
	}
});