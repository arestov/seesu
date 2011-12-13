var test_pressed_node = function(e, opts){
	su.ui.hidePopups(e, opts && opts.stay_popup);
	
	var mouseup = opts && opts.mouseup;
	
	var node = e.target;
	var class_name = node.className;
	var class_list = class_name.split(/\s/);
	var clicked_node = $(node);
	
	
		if(clicked_node.is('a')) {
		  e.preventDefault();
		  if (bN(class_list.indexOf('download-mp3'))){
			app_env.openURL(node.href);
			
		  }
		  else if (bN(class_list.indexOf('vk-reg-ref'))){
			app_env.openURL(vkReferer || 'http://vk.com/reg198193');
			seesu.track_event('Links', 'vk registration');
			
		  }
		  else if (bN(class_list.indexOf('flash-s'))){
			app_env.openURL('http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html');
			seesu.track_event('Links', 'flash security');
			
		  }
		  else if (bN(class_list.indexOf('artist'))){
			artist_name = decodeURIComponent(clicked_node.data('artist'));
			seesu.ui.views.showArtcardPage(artist_name);
			seesu.track_event('Artist navigation', 'artist', artist_name);
			
		  }
		  else if (bN(class_list.indexOf('music-tag'))){
			tag_name = decodeURIComponent(clicked_node.data('music_tag'));
			su.ui.show_tag(tag_name);
			seesu.track_event('Artist navigation', 'tag', tag_name);
			
		  }
		  else if (bN(class_list.indexOf('bbcode_artist'))){
			
			artist_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/music/','').replace(/\+/g, ' '));
			seesu.ui.views.showArtcardPage(artist_name);
			seesu.track_event('Artist navigation', 'bbcode_artist', artist_name);
			
		  }
		  else if (bN(class_list.indexOf('bbcode_tag'))){
			tag_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/tag/','').replace(/\+/g, ' '));
			su.ui.show_tag(tag_name);
			seesu.track_event('Artist navigation', 'bbcode_tag', tag_name);
			
		  }
		  else if (bN(class_list.indexOf('similar-artists'))){
			var artist = clicked_node.data('artist');
			su.ui.showSimilarArtists(artist);
			seesu.track_event('Artist navigation', 'similar artists to', artist);
		  }
		  else if (bN(class_list.indexOf('external'))){
			app_env.openURL(clicked_node.attr('href'));
			seesu.track_event('Links', 'just link');
			
		  }
		  else if (bN(class_list.indexOf('seesu-me-link'))){
			app_env.openURL(node.href)
			
		  }
		  else if (bN(class_list.indexOf('hint-query'))){
			var query = clicked_node.text();
			su.ui.search(query);
			clicked_node.text(seesu.popular_artists[(Math.random()*10).toFixed(0)]);
			seesu.track_event('Navigation', 'hint artist');
			
		  } else if (bN(class_list.indexOf('pc-pause'))){
			  	var mo = clicked_node.data('mo');
				if (mo){
					mo.pause();
				}
				seesu.track_event('Controls', 'pause', mouseup ? 'mouseup' : '');
				 
			} 
			else if (bN(class_list.indexOf('pc-play'))){
				var mo = clicked_node.data('mo');
				if (mo){
					mo.switchPlay();
				}
			}
			else if (bN(class_list.indexOf('pc-stop')) ){
				var mo = clicked_node.data('mo');
				if (mo){
					mo.stop();
				}
				seesu.track_event('Controls', 'stop', mouseup ? 'mouseup' : '');
				 
			}
			else if ( bN(class_list.indexOf('pc-prev'))){
				var mo = clicked_node.data('mo');
				if (mo){
					mo.playPrev();
				}
				seesu.track_event('Controls', 'prev', mouseup ? 'mouseup' : '');
				
			}
			else if (bN(class_list.indexOf('pc-next'))){
				var mo = clicked_node.data('mo');
				if (mo){
					mo.playNext();
				}
				seesu.track_event('Controls', 'next', mouseup ? 'mouseup' : '');
				
			} 
			else if (bN(class_list.indexOf('pc-add'))){

				var rpp = su.ui.getRtPP(node);
				su.ui.els.pl_search.wp
					.data('current_song', clicked_node.data('mo'))
					.css({
						top: rpp.top + 'px',
						left: rpp.left + 'px',
						display: 'block'
					});
					
				su.ui.els.pl_search.visible = true;
				
				if (rpp.left > rpp.cwidth/2){
					su.ui.els.pl_search.wp.addClass('close-to-right');
				} else{
					su.ui.els.pl_search.wp.removeClass('close-to-right');
				}
				su.ui.els.pl_r.val('')[0].focus();
				
			}  
		}  
		else if ((node.nodeName == 'INPUT' || node.nodeName == 'BUTTON')) {
			if (bN(class_list.indexOf('login-lastfm-button')) ){
				lfm.waiting_for = clicked_node.attr('name');
				su.ui.lfmRequestAuth();
				
			}
			else if (bN(class_list.indexOf('use-lfm-code'))){
				var token = clicked_node.parent().find('.lfm-code').val();
				if (token){
					lfm.newtoken = token;
					lfm.try_to_login(seesu.ui.lfm_logged);
				}
				
			} else if (bN(class_list.indexOf('use-vk-code'))){
				var vk_t_raw = clicked_node.parent().find('.vk-code').val();
				if (vk_t_raw){
					vkTokenAuth(vk_t_raw);
				}
				
			} else if (bN(class_list.indexOf('enable-scrobbling'))){
				suStore('lfm_scrobbling_enabled', 'true', true);
				lfm.scrobbling = true;
				su.ui.lfm_change_scrobbling(true);
				
			} else if (bN(class_list.indexOf('disable-scrobbling'))){
				suStore('lfm_scrobbling_enabled', '', true);
				lfm.scrobbling = false;
				su.ui.lfm_change_scrobbling();
			}
		}
	
	
}
