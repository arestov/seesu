var notifyCounterUI = function() {};
provoda.View.extendTo(notifyCounterUI, {
	createBase: function() {
		this.c = $('<span class="notifier hidden"></span>');
	},
	state_change: {
		counter: function(state) {
			this.c.toggleClass('hidden', !state);
		}
	}
});

var mfComplectUI = function() {};
provoda.View.extendTo(mfComplectUI, {
	children_views: {
		'file-torrent': fileInTorrentUI,
		'file-http': songFileModelUI
	},
	'collch-moplas_list': {
		place: 'tpl.ancs.listc',
		by_model_name: true
	}
});

var get_youtube = function(q, callback){
	var cache_used = cache_ajax.get('youtube', q, callback);
	if (!cache_used){
		var data = {
			q: q,
			v: 2,
			alt: 'json-in-script'
			
		};
		aReq({
			url: 'http://gdata.youtube.com/feeds/api/videos',
			dataType: 'jsonp',
			data: data,
			resourceCachingAvailable: true,
			afterChange: function(opts) {
				if (opts.dataType == 'json'){
					data.alt = 'json';
					opts.headers = null;
				}

			},
			thisOriginAllowed: true
		}).done(function(r){
			if (callback) {callback(r);}
			cache_ajax.set('youtube', q, r);
		});
	}
};

var mfCorUI = function(md) {};
provoda.View.extendTo(mfCorUI, {
	children_views:{
		notifier: notifyCounterUI,
		vk_auth: VkLoginUI,
		sorted_completcs: mfComplectUI,
		yt_videos: YoutubePreview
	},
	state_change: {
		"want_more_songs": function(state) {
			if (state){
				this.c.addClass('want_more_songs');
			} else {
				this.c.removeClass('want_more_songs');
			}
		},
		"must-be-expandable": function(state) {
			if (state){
				this.tpl.ancs.sall_songs.removeClass('hidden');
			}
		},
		"cant_play_music": function(state) {
			this.tpl.ancs.cant_play_music_message.toggleClass('hidden', !state);
		}
	},
	'collch-vk_auth': {
		place: 'tpl.ancs.messages_c',
		strict: true
	},
	'collch-yt_videos': 'tpl.ancs.video_list',
	bindBase: function() {
		this.createTemplate();
		var _this = this;
		this.tpl.ancs.more_songs_b.click(function() {
			_this.RPCLegacy('switchMoreSongsView');
		});
		this.addWayPoint(this.tpl.ancs.more_songs_b);
		this.parent_view.on('state-change.mp_show_end', function(e){
			_this.setVisState('is_visible', !!e.value);
		});
	},
	createBase: function() {
		this.c = this.root_view.getSample('moplas-block');
		this.bindBase();

	},
	showYoutubeVideo: function(id, c, link){
		if (this.video){
			this.hideYoutubeVideo();
		}
		this.video = {
			link: link.addClass('active'),
			node: $(this.root_view.create_youtube_video(id)).appendTo(c)
		};
	},
	hideYoutubeVideo: function(){
		if (this.video){
			if (this.video.link){
				this.video.link.removeClass('active');
				this.video.link[0].showed = false;
				this.video.link = false;
				
			}
			if (this.video.node){
				this.video.node.remove();
				this.video.node = false;
			}
			delete this.video;
		}
	}
});


