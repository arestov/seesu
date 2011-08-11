var createFilesButton = function(song_context){
	var files_list_nb = su.ui.createNiceButton('left');

	files_list_nb.b.text( localize('Files', 'Files') + ' ▼');
	
	files_list_nb.b.click(function(){
		if (!$(this).data('disabled')){
			
			if (!song_context.isActive('files')){
				var p = su.ui.getRtPP(this);
				song_context.show('files', p.left + $(this).outerWidth()/2);
			} else{
				song_context.hide();
			}
		}
		
	});
	return files_list_nb;
};
var createDownloadButton = function(mo){
	var file_download_nb =  su.ui.createNiceButton('right');
	file_download_nb.b.text(localize('Download', 'Download'));
	
	file_download_nb.b.click(function(){
		if (!$(this).data('disabled')){
			var d = mo.mp3Downloads();
			if (d){
				open_url(d[0].link)
			}
			
		}
	});
	return file_download_nb;
};


var songUI = function(mo, complex){
	this.mo = mo;
	this.mainc = $('<li></li>').data('mo', mo);
	if (!complex){
		this.expand();
	}

};
songUI.prototype = {
	deactivate: function(){
		if (this.active){
			for (var a in this.rowcs) {
				this.rowcs[a].hide();
			};
			this.tidominator.removeClass('want-more-info');
			this.mainc.removeClass('viewing-song');
			
			su.ui.hidePopups();
			
			this.active = false;
		}
		
	},
	activate: function(){
		if (!this.active){
			
			
			var _this = this;
			this.mainc.addClass('viewing-song');
			this.active = true;
		}
		
	},
	expand: function(){
		var _this = this;
	
	
		this.context = su.ui.samples.track_c.clone(true);
		var tp = this.context.children('.track-panel');
		
		
		
		this.node = $("<a></a>")
			.data('mo', this.mo)
			.data('t_context', this.context)
			.addClass('track-node waiting-full-render')
			.click(empty_song_click)
			
			
		this.titlec = $("<span></span>").text(this.mo.getFullName()).appendTo(this.node);
		this.durationc = $('<a class="song-duration"></a>').prependTo(this.node);
		
		
		
		var buttmen = su.ui.els.play_controls.node.clone(true).data('mo', this.mo);
		tp.add(buttmen).find('.pc').data('mo', this.mo);
		
		
		var song_row_context = this.context.children('.row-song-context');
		var song_context  = new contextRow(song_row_context);
		
		this.files = song_row_context.children('.track-files');
		
		song_context.addPart(this.files, 'files');
		
		song_context.addPart(song_row_context.children('.last-fm-scrobbling'), 'lastfm');
		
		
		tp.find('.lfm-scrobbling-button').click(function(){
			if (!song_context.isActive('lastfm')){
				var p = su.ui.getRtPP(this);
				song_context.show('lastfm', p.left + $(this).outerWidth()/2);
			} else{
				song_context.hide();
			}
		});
		
		song_context.addPart(song_row_context.children('.flash-error'), 'flash-error');
		
		
		tp.find('.flash-secur-button').click(function(){
			if (!song_context.isActive('flash-error')){
				var p = su.ui.getRtPP(this);
				song_context.show('flash-error', p.left + $(this).outerWidth()/2);
			} else{
				song_context.hide();
			}
		});
		
		
		
		
		
		
		
		this.tidominator = this.context.children('.track-info-dominator');
		var dominator_head = this.tidominator.children('.dominator-head');
		this.a_info = this.tidominator.children('.artist-info');
		this.t_info = this.tidominator.children('.track-info');
		this.tv		= this.t_info.children('.track-video')
		
		
		
		
		
		if (this.mo.plst_titl.playlist_type != 'artist'){
			$('<a class="js-serv">' + localize('top-tracks') + '</a>')
				.data('artist', this.mo.artist)
				.appendTo(dominator_head.children('.closer-to-track'))
				.click(function(){
					su.ui.show_artist(_this.mo.artist);
					su.track_event('Artist navigation', 'top tracks', _this.mo.artist);
				});
		}
		
		
		
		var users = this.context.children('.track-listeners');
		var users_list = users.children('.song-listeners-list');
		
		
		var users_row_context =  this.context.children('.row-listeners-context');
		var users_context = new contextRow(users_row_context);
		var uinfo_part = users_row_context.children('.big-listener-info');
		users_context.addPart(uinfo_part, 'user-info');
		
		
		var extend_switcher = dominator_head.children('.extend-switcher').click(function(e){
			_this.tidominator.toggleClass('want-more-info');
			e.preventDefault();
		});
		
		var files_cc = $('<div class="files-control"></div>').prependTo(tp.children('.buttons-panel'));
		
		
		
		
		
		var flb = createFilesButton(song_context);
		flb.c.appendTo(files_cc);
		
		
		var dlb = createDownloadButton(this.mo);
		
		dlb.c.appendTo(files_cc);
		
		
		this.files_control= {
			list_button: flb,
			quick_download_button: dlb
		};
		this.t_users= {
			c: users,
			list: users_list
		};
		this.extend_info= {
			files: false,
			videos: false,
			base_info: false,
			extend_switcher: extend_switcher,
			updateUI: function(){
				var c = {
					str: '',
					prev: false
				};
				su.ui.infoGen(this.base_info, c, 'more «%s» info');
				su.ui.infoGen(this.files, c, 'files: %s');
				su.ui.infoGen(this.videos, c, 'video: %s');
				if (c.str){
					this.extend_switcher.find('.big-space').text(c.str);
				}
	
			}
		};
		this.rowcs={
			song_context: song_context,
			users_context: users_context
		};
		this.files_time_stamp = 0;
	
		
		
		
		
		
		
		var ph = seesu.player.controls.ph.clone(true);
		var tpt = ph.children('.track-progress').data('mo', this.mo);
		this.mopla_title =  tpt.find('.track-node-text');
		this.ct = {
			tr_progress_t: tpt,
			tr_progress_l: tpt.children('.track-load-progress'),
			tr_progress_p: tpt.children('.track-play-progress'),
		};
		
		ph.prependTo(tp);
		
		this.mainc
			.append(buttmen)
			.append(this.node)
			.append(this.context);
			
			
		
		var pi = this.mo.playable_info; 
		setTimeout(function(){
			_this.mo.makeSongPlayalbe(pi.full_allowing, pi.packsearch, pi.last_in_collection);	
		},100)
		
	},
	remove: function(){
		this.mainc.remove();
	},
	update: function(not_rend){
		var _this = this;
		
		
		var down = this.node.siblings('a.download-mp3').remove();
		this.node
			.addClass('song')
			.removeClass('search-mp3-failed')
			.removeClass('waiting-full-render')
			.removeClass('mp3-download-is-not-allowed')
			.data('mo', this.mo)
			.unbind()
			.click(function(){
				su.ui.views.freeze(_this.mo.plst_titl);
				su.player.song_click(_this.mo);
			});
		
		
		
		var mopla = this.mo.song();
		if (mopla){
			if (mopla.duration){
				this.displaySongMoplaInfo(mopla);
			}
		}
		
			

		
	},
	displaySongMoplaInfo: function(mopla){
		var duration = mopla.duration;
		var du = this.durationc;
		
		if (duration){
			var digits = duration % 60;
			var track_dur = (Math.floor(duration/60)) + ':' + (digits < 10 ? '0'+digits : digits );
			du.text(track_dur);
		} else{
			du.text('');
		}
		
		var filename = mopla.artist + ' - ' +  mopla.track;
		
		this.mopla_title.text(mopla.from + ": " + filename);
		this.mopla_title.attr('title', mopla.description || '');
		
		
	}
};