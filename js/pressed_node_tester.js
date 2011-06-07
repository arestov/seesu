var test_pressed_node = function(e, mouseup){
	var node = e.target;
	var class_name = node.className;
	var clicked_node = $(node);
	
		if(clicked_node.is('a')) {
		  if (class_name.match(/download-mp3/)){
			open_url(node.href);
			return false;
		  }
		  else if (class_name.match(/vk-reg-ref/)){
			open_url(vkReferer || 'http://vk.com/reg198193');
			seesu.track_event('Links', 'vk registration');
			return false;
		  }
		  else if (class_name.match(/flash-s$/)){
			open_url('http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html');
			seesu.track_event('Links', 'flash security');
			return false;
		  }
		  else if (class_name.match(/\bartist\b[^\-]/)){
			artist_name = decodeURIComponent(clicked_node.data('artist'));
			seesu.ui.show_artist(artist_name);
			seesu.track_event('Artist navigation', 'artist', artist_name);
			return false;
		  }
		  else if (class_name.match(/music-tag/)){
			tag_name = decodeURIComponent(clicked_node.data('music_tag'));
			su.ui.show_tag(tag_name);
			seesu.track_event('Artist navigation', 'tag', tag_name);
			return false;
		  }
		  else if (class_name.match(/bbcode_artist/)){
			
			artist_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/music/','').replace(/\+/g, ' '));
			seesu.ui.show_artist(artist_name);
			seesu.track_event('Artist navigation', 'bbcode_artist', artist_name);
			return false;
		  }
		  else if (class_name.match(/bbcode_tag/)){
			tag_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/tag/','').replace(/\+/g, ' '));
			su.ui.show_tag(tag_name);
			seesu.track_event('Artist navigation', 'bbcode_tag', tag_name);
			return false;
		  }
		  else if (class_name.match(/similar-artists/)){
			var artist = clicked_node.data('artist');
			render_tracks_by_similar_artists(artist);
			seesu.track_event('Artist navigation', 'similar artists to', artist);
		  }
		  else if (class_name.match(/trackbutton/)){
			clicked_node.parent().toggleClass('tb-window');
		  }
		  else if (class_name.match(/search-music-files/)){
			clicked_node.parent().toggleClass('want-to-select-mp3-search');
		  }
		  else if (bN(class_name.indexOf('external'))){
			open_url(clicked_node.attr('href'));
			seesu.track_event('Links', 'just link');
			return false;
		  }
		  else if (class_name.match(/seesu-me-link/)){
			open_url(node.href)
			return false;
		  }
		  else if (class_name.match(/hint-query/)){
			var query = clicked_node.text();
			su.ui.search(query);
			clicked_node.text(seesu.popular_artists[(Math.random()*10).toFixed(0)]);
			seesu.track_event('Navigation', 'hint artist');
			return false;
		  }
		}  else if ((node.nodeName == 'INPUT' || node.nodeName == 'BUTTON')) {
			if (class_name.match(/tb-mess-wrap-close/)){
				clicked_node.parents('li').removeClass('tb-window');
			}
			else if(class_name.match(/mp3-search-switch-close/)){
				clicked_node.parents('#tracks-search').removeClass('want-to-select-mp3-search')
			}
			else if (class_name.match(/login-lastfm-button/)){
				su.lfm_api.waiting_for = clicked_node.attr('name');
				su.ui.lfmRequestAuth();
				
			}
			else if (bN(class_name.indexOf('use-lfm-code'))){
				var token = clicked_node.parent().find('.lfm-code').val();
				if (token){
					su.lfm_api.newtoken = token;
					su.lfm_api.try_to_login(seesu.ui.lfm_logged);
				}
				console.log('sdffffffffffffffffffffffffff')
				return false;
			} else if (class_name.match(/enable-scrobbling/)){
				w_storage('lfm_scrobbling_enabled', 'true', true);
				su.lfm_api.scrobbling = true;
				su.ui.lfm_change_scrobbling(true);
				
			} else if (class_name.match(/disable-scrobbling/)){
				w_storage('lfm_scrobbling_enabled', '', true);
				su.lfm_api.scrobbling = false;
				su.ui.lfm_change_scrobbling();
			}
		}
	
		if ((node.nodeName == 'IMG') && (mouseup || class_name.match(/simple-clicks/) && class_name.match(/pl-control/) )){
			var class_name = node.parentNode.className;
			if (class_name.match(/pause/)){
				seesu.player.set_state('pause');
				seesu.track_event('Controls', 'pause', mouseup ? 'mouseup' : '');
				return false; 
			} 
			else if (class_name.match(/play$/)){
				var current_state = seesu.player.get_state();
				var mo = clicked_node.data('mo');
				if (mo && mo == su.player.c_song){
					if (current_state == 'playing') {
						su.player.set_state('pause');
						
						su.track_event('Controls', 'pause', mouseup ? 'mouseup' : '');
						
					} else {
						su.player.set_state('play');
						
						su.track_event('Controls', 'play', mouseup ? 'mouseup' : '');
						
					}	
				} else{
					su.player.play_song(mo);
				}
				
				
				return false; 
			}
			else if (class_name.match(/stop/)){
				seesu.player.set_state('stop');
				seesu.track_event('Controls', 'stop', mouseup ? 'mouseup' : '');
				return false; 
			}
			else if (class_name.match(/play_prev/)){
				if(seesu.player.c_song) {seesu.player.switch_to('prev');}
				seesu.track_event('Controls', 'prev', mouseup ? 'mouseup' : '');
				return false;
			}
			else if (class_name.match(/play_next/)){
				if(seesu.player.c_song) {seesu.player.switch_to('next');}
				seesu.track_event('Controls', 'next', mouseup ? 'mouseup' : '');
				return false;
			} else if (class_name.match(/add-to-playlist/)){

				
				var target_offset = clicked_node.offset();
				var container_offset = su.ui.els.pllistlevel.offset();
				var container_width = su.ui.els.pllistlevel.width();
				var left = target_offset.left - container_offset.left;
				su.ui.els.pl_search
					.data('current_song', clicked_node.data('mo'))
					.css({
						top: (target_offset.top - container_offset.top) + 'px',
						left: left + 'px',
						display: 'block'
					});
				if (left > container_width/2){
					su.ui.els.pl_search.addClass('close-to-right');
				} else{
					su.ui.els.pl_search.removeClass('close-to-right');
				}
				su.ui.els.pl_r.val('')[0].focus();
				return false;
			}
		  
		}
	
	
}
