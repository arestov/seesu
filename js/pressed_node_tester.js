var test_pressed_node = function(original_node, mouseup){
	var node = original_node;
  	var class_name = node.className;
	var clicked_node = $(original_node);
	if (!mouseup) {
		if(clicked_node.is('a')) {
		  if (class_name.match(/song/)){
			return seesu.player.song_click(clicked_node);
		  }	
		  else if (class_name.match(/waiting-full-render/)){
			if (seesu.player.wainter_for_play) {seesu.player.wainter_for_play.removeClass('marked-for-play');}
			clicked_node.data('want_to_play', seesu.player.want_to_play += 1).addClass('marked-for-play');
			seesu.player.wainter_for_play = clicked_node;
			return false;
		  }
		  else if (class_name.match(/track-zoomin/)){
			$(document.body).addClass('track-zoomed')
		  }
		  else if (class_name.match(/track-zoomout/)){
			$(document.body).removeClass('track-zoomed')
		  }
		  else if (class_name.match(/vk-reg-ref/)){
			widget.openURL(vkReferer);
			return false;
		  }
		  else if (class_name.match(/flash-s$/)){
			widget.openURL('http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html');
			return false;
		  }
		  else if (class_name.match(/promo-twitter/)){
			var tweet_text = "Seesu plays last.fm for free and lets me to download tracks #seesu http://bit.ly/4s6CKa";
			if (seesu.player.current_artist) {tweet_text += " Now I'm listening «" + seesu.player.current_artist + "»" };
			widget.openURL( 'http://twitter.com/home/?status=' + encodeURIComponent(tweet_text));
			return false;
		  }
		  else if (class_name.match(/c2w-twitter/)){
			widget.openURL( 'http://bit.ly/aOtxrI');
			return false;
		  }
		  else if (class_name.match(/c2w-widget-rating/)){
			widget.openURL('http://b23.ru/ep3a');
			return false;
		  }
		  else if (class_name.match(/\bartist\b[^\-]/)){
			artist_name = decodeURIComponent(clicked_node.data('artist'));
			set_artist_page(artist_name);
			return false;
		  }
		  else if (class_name.match(/music-tag/)){
			tag_name = decodeURIComponent(clicked_node.data('music_tag'));
			render_tracks_by_artists_of_tag(tag_name);
			return false;
		  }
		  else if (class_name.match(/bbcode_artist/)){
			
			artist_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/music/',''));
			set_artist_page(artist_name);
			return false;
		  }
		  else if (class_name.match(/bbcode_tag/)){
			tag_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/tag/',''));
			render_tracks_by_artists_of_tag(tag_name);
			return false;
		  }
		  else if (class_name.match(/similar-artists/)){
		  	if (!clicked_node.data('clicked')){
		  		render_tracks_by_similar_artists(clicked_node.removeClass('js-serv').data('clicked', true).data('artist'));
		  	}
		  	
		  }
		  else if (class_name.match(/trackbutton/)){
			clicked_node.parent().toggleClass('tb-window');
		  }
		  else if (class_name.match(/search-music-files/)){
			clicked_node.parent().toggleClass('want-to-select-mp3-search');
		  }
		}  else if ((node.nodeName == 'INPUT')) {
			if (class_name.match(/flash-mess-switch/)) {
				if(clicked_node.attr('checked')) {
					widget.setPreferenceForKey('true', 'flash_internet');
					$(document.body).addClass('flash-internet');
				} else {
					widget.setPreferenceForKey('', 'flash_internet');
					$(document.body).removeClass('flash-internet');
				}
			} 
			else if (class_name.match(/tb-mess-wrap-close/)){
				clicked_node.parents('li').removeClass('tb-window');
			}
			else if(class_name.match(/mp3-search-switch-close/)){
				clicked_node.parents('#tracks-search').removeClass('want-to-select-mp3-search')
			}
			else if (class_name.match(/login-lastfm-button/)){
	
				if (lfm_auth.newtoken) {
					open_lfm_to_login(lfm_auth.newtoken);
				} else {
					get_lfm_token(lfm_auth,open_lfm_to_login);
				}
			}
			else if (class_name.match(/scrobbling-grant/)){
				if (!lfm_auth.newtoken || lfm_auth.sk){ return false}
				if(clicked_node.attr('checked')){
					lfm('auth.getSession',{'token':lfm_auth.newtoken },function(r){
						if (!r.error) {
							lfm_auth.login(r);
							log('lfm scrobble access granted')
						} else{
							log('error while granting lfm scrobble access')
						}
					});
				}
			} else if (class_name.match(/enable-scrobbling/)){
				widget.setPreferenceForKey('true', 'lfm_scrobbling_enabled');
				lfm_scrobble.scrobbling = true;
				
			} else if (class_name.match(/disable-scrobbling/)){
				widget.setPreferenceForKey('', 'lfm_scrobbling_enabled');
				lfm_scrobble.scrobbling = false;
				
			}else if (class_name.match(/mp3-audme/)){
				$(document.body).removeClass('vk-needs-login');
				seesu.delayed_search.switch_to_audme();
				return false;
				
			}else if (class_name.match(/mp3-vk/)){
				if (seesu.vk_logged_in){
					seesu.delayed_search.switch_to_vk()
				}else{
					$(document.body).addClass('vk-needs-login');
				}
				
				return false
			}else if (class_name.match(/mp3-vk-api/)){
				
				seesu.delayed_search.switch_to_vk_api()
				
				
				return false
			}
		}
	} else{
		if ((node.nodeName == 'IMG') && class_name.match(/pl-control/)){
			var class_name = node.parentNode.className;
			if (class_name.match(/pause/)){
				seesu.player.set_state('pause');
				return false; 
			} 
			else if (class_name.match(/play$/)){
				var current_state = seesu.player.get_state();
				if (current_state == 'playing') {
					seesu.player.set_state('pause');
				} else {
					seesu.player.set_state('play');
				}
				
				return false; 
			}
			else if (class_name.match(/stop/)){
				seesu.player.set_state('stop');
				return false; 
			}
			else if (class_name.match(/play_prev/)){
				if(seesu.player.current_song) {seesu.player.switch_to('prev');}
				return false;
			}
			else if (class_name.match(/play_next/)){
				if(seesu.player.current_song) {seesu.player.switch_to('next');}
				return false;
			}
		  
		}
	}
	
}
