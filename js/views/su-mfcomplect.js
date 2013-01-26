

var notifyCounterUI = function() {};

provoda.View.extendTo(notifyCounterUI, {
	createBase: function() {
		this.c = $('<span class="notifier hidden"></span>');
	},
	state_change: {
		counter: function(state) {
			if (state){
				this.c.text(state);
				this.c.removeClass('hidden');
			} else {
				this.c.addClass('hidden');
			}
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
				}).text(this.state('complect-name'));
				this.addWayPoint(header, {
					simple_check: true
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
		'complect-name': function(state) {
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
		vk_auth: vkLoginUI,
		complect: mfComplectUI
	},
	state_change: {
		"want-more-songs": function(state) {
			if (state){
				this.c.addClass('want-more-songs');
			} else {
				this.c.removeClass('want-more-songs');
			}
		},
		"must-be-expandable": function(state) {
			if (state){
				this.sall_songs.removeClass('hidden');
			}
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
						_this.mufils_c.append(el_dom);
					}
				}

			}
		});
		this.requestAll();
	},
	'collch-vk_auth': {
		place: 'messages_c',
		strict: true
	},
	'collch-notifier': {
		place: 'sall_songs',
		strict: true
	},
	createBase: function() {
		this.c = $('<div class="song-row-content moplas-block"></div>');
		var _this = this;

		this.sall_songs = $('<div class="show-all-songs hidden"></div>');

		this.more_songs_b = $('<a class=""></a>').appendTo(this.sall_songs);
		this.more_songs_b.click(function() {
			_this.md.switchMoreSongsView();
		});
		this.addWayPoint(this.more_songs_b, {
			simple_check: true
		});
		$('<span></span>').text(localize('Files')).appendTo(this.more_songs_b);
		this.c.prepend(this.sall_songs);

		

		this.messages_c = $('<div class="messages-c"></div>').appendTo(this.c);
		
		this.video_c = $('<div class="track-video hidden"></div>');
		if (this.md.mo.artist && this.md.mo.track){
			this.show_video_info(this.video_c, this.md.mo.artist + " - " + this.md.mo.track);
		}
		this.mufils_c = $("<div class='music-files-lists'></div>").appendTo(this.c);
		this.c.append(this.video_c);

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
	},
	show_video_info: function(vi_c, q){
		if (vi_c.data('has-info')){return true;}


		


		var _this = this;
		get_youtube(q, function(r){
			var vs = r && r.feed && r.feed.entry;
			if (vs && vs.length){
				vi_c.data('has-info', true);
				vi_c.empty();
				//vi_c.append('<span class="desc-name"><a target="_blank" href="http://www.youtube.com/results?search_query='+ q +'">' + localize('video','Video') + '</a>:</span>');
				var v_content = $('<ul class=""></ul>');
			
				var make_v_link = function(thmn, vid, _title, cant_show){
					var link = 'http://www.youtube.com/watch?v=' + vid;

					var li = $('<li class="you-tube-video-link"></li>')
					.attr({
						title: _title
					})
					.click(function(e){
						if (!cant_show){
							var showed = this.showed;
							
							if (!showed){
								_this.showYoutubeVideo(vid, vi_c, $(this));
								_this.md.pause();
								this.showed = true;
								su.trackEvent('Navigation', 'youtube video');
							} else{
								_this.hideYoutubeVideo();
								_this.md.play();
								this.showed = false;
							}
							
						} else{
							app_env.openURL(link);
						}
						e.stopPropagation();
						e.preventDefault();
					});
					if (cant_show){
						li.addClass("cant-show");
					}
					_this.addWayPoint(li, {
						simple_check: true
					});


					var imgs = $();

					//thmn $('<img  alt=""/>').attr('src', img_link);

					if (thmn.start && thmn.middle &&  thmn.end){
						$.each(["start","middle","end"], function(i, el) {

							var span = $("<span class='preview-slicer'></span>");

							$('<img  alt=""/>').addClass('preview-part preview-' + el).attr('src', thmn[el]).appendTo(span);

							imgs = imgs.add(span);

							tmn[el] = $filter(thmn_arr, 'yt$name', el)[0].url;
						});
					} else {
						imgs.add($('<img  alt="" class="whole"/>').attr('src', thmn.default));
					}
					
					$("<a class='video-preview external'></a>")
						.attr('href', link)
						.append(imgs)
						.appendTo(li);
					
					$('<span class="video-title"></span>')
						.text(_title).appendTo(li);
						
					li.appendTo(v_content);
				};
				var preview_types = ["default","start","middle","end"];

				//set up filter app$control.yt$state.reasonCode != limitedSyndication

				var video_arr = [];

				for (var i=0, l = Math.min(vs.length, 3); i < l; i++) {
					var
						_v = vs[i],
						tmn = {},
						v_id = _v['media$group']['yt$videoid']['$t'],
						v_title = _v['media$group']['media$title']['$t'];
					var cant_show = getTargetField(_v, "app$control.yt$state.name") == "restricted";
					cant_show = cant_show || getTargetField($filter(getTargetField(_v, "yt$accessControl"), "action", "syndicate"), "0.permission") == "denied";


					var thmn_arr = getTargetField(_v, "media$group.media$thumbnail");
					
					$.each(preview_types, function(i, el) {
						tmn[el] = $filter(thmn_arr, 'yt$name', el)[0].url;
					});

					video_arr.push({
						thmn: tmn,
						vid: v_id,
						title: v_title,
						cant_show: cant_show
					});

					
					
				}

				video_arr.sort(function(a, b){
					return sortByRules(a, b, ["cant_show"]);
				});
				$.each(video_arr, function(i, el) {
					make_v_link(el.thmn, el.vid, el.title, el.cant_show);
				});

				
				
				vi_c.append(v_content).removeClass('hidden');
				
			}
		});
		
	}
});


