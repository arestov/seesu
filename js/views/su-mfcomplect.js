var notifyCounterUI = function() {};
provoda.View.extendTo(notifyCounterUI, {
	useBase: function(node) {
		this.c = node;
		this.createTemplate();
	},
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
		place: 'lc',
		by_model_name: true
	},
	createBase: function() {
		this.c = $('<div class="moplas-list"></div>');
		this.header_c = $('<h4></h4>').appendTo(this.c);
		this.lc = $('<ul></ul>').appendTo(this.c);
	},
	state_change: {
		overstock: function(state) {
			if (state){
				var _this = this;
				var header = $('<a class="js-serv"></a>').click(function() {
					_this.md.toggleOverstocked();
				}).text(this.state('complect_name'));
				this.addWayPoint(header, {
					canUse: function() {
						return _this.parent_view.state('want_more_songs');
					}
				});
				this.header_c.empty().append(header);
			}
		},
		"show-overstocked": function(state, oldstate){
			if (state){
				this.c.addClass('want-overstocked-songs');
			} else if (oldstate){
				this.c.removeClass('want-overstocked-songs');
			}
		},
		'complect_name': function(state) {
			this.header_c.text(state);
		}
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
		complect: mfComplectUI,
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
	'collch-sorted_completcs': function(name, array) {
		var _this = this;
		$.each(array, function(i, el) {
			var el_view = _this.getFreeChildView('complect', el);
			var el_dom = el_view && el_view.getA();
			if (el_dom){
				var prev_dom_hook = _this.getPrevView(array, i);
				if (prev_dom_hook){
					$(prev_dom_hook).after(el_dom);
				} else {
					var next_dom_hook = _this.getNextView(array, i);
					if (next_dom_hook){
						$(next_dom_hook).before(el_dom);
					} else {
						_this.tpl.ancs.mufils_c.append(el_dom);
					}
				}

			}
		});
		this.requestAll();
	},
	'collch-vk_auth': {
		place: 'tpl.ancs.messages_c',
		strict: true
	},
	'collch-yt_videos': 'tpl.ancs.video_list',
	createBase: function() {
		this.c = this.root_view.getSample('moplas-block');
		this.createTemplate();
		var _this = this;
		this.tpl.ancs.more_songs_b.click(function() {
			_this.md.switchMoreSongsView();
		});
		this.addWayPoint(this.tpl.ancs.more_songs_b);

	},
	getNextSemC: function(packs, start) {
		for (var i = start; i < packs.length; i++) {
			var cur_name = packs[i];
			var cur_mf = cur_name && this.md.complects[cur_name];
			
			return cur_mf && cur_mf.getThing();
		}
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


