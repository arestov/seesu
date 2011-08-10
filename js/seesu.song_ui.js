var createFilesButton = function(song_context){
	var files_list_nb = this.createNiceButton('left');

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
	var file_download_nb =  this.createNiceButton('right');
	file_download_nb.b.text(localize('Download', 'Download'));
	file_download_nb.c.appendTo(files_cc);
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


var songUI = function(mo){
	var _this = this;
	

	this.context = this.samples.track_c.clone(true);
	var tp = this.context.children('.track-panel');
	
	
	
	this.node = $("<a></a>")
		.data('mo', mo)
		.data('t_context', this.context)
		.addClass('track-node waiting-full-render')
		.click(empty_song_click)
		
		
	this.titlec = $("<span></span>").text(mo.getFullName()).appendTo(this.node);
	this.durationc = $('<a class="song-duration"></a>').prependTo(this.node);
	
	
	
	var buttmen = su.ui.els.play_controls.node.clone(true).data('mo', mo);
	tp.add(buttmen).find('.pc').data('mo', mo);
	
	
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
	
	
	
	
	
	if (mo.plst_titl.playlist_type != 'artist'){
		$('<a class="js-serv">' + localize('top-tracks') + '</a>')
			.data('artist', mo.artist)
			.appendTo(dominator_head.children('.closer-to-track'))
			.click(function(){
				su.ui.show_artist(mo.artist);
				su.track_event('Artist navigation', 'top tracks', mo.artist);
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
	
	
	var dlb = createDownloadButton(mo);
	
	
	
	
	this.files_control: {
		list_button: flb,
		quick_download_button: dlb
	};
	this.t_users: {
		c: users,
		list: users_list
	};
	this.extend_info: {
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
	this.rowcs:{
		song_context: song_context,
		users_context: users_context
	};
	this.files_time_stamp = 0;

	
	
	
	
	
	
	var ph = seesu.player.controls.ph.clone(true);
	var tpt = ph.children('.track-progress').data('mo', mo);
	this.mopla_title =  tpt.find('.track-node-text');
	this.ct = {
		tr_progress_t: tpt,
		tr_progress_l: tpt.children('.track-load-progress'),
		tr_progress_p: tpt.children('.track-play-progress'),
	};
	
	ph.prependTo(tp);
	

		
	this.mainc = $('<li></li>')
		.data('mo', mo)
		.append(buttmen)
		.append(this.node)
		.append(t_context);

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
	remove: function(){
		this.mainc.remove();
	}
};