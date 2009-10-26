$(function() {
  $(document).click(function(e) {
	var clicked_node = $(e.target);

	if(clicked_node.is('a')) {
	  if(clicked_node.is('.song')) {
		return song_click(clicked_node);
	  }	
	  else if(clicked_node.is('.waiting-full-render')) {
		if (wainter_for_play) {wainter_for_play.removeClass('marked-for-play');}
		clicked_node.data('want_to_play', want_to_play += 1).addClass('marked-for-play');
		wainter_for_play = clicked_node;
		return false;
	  }
	  else if(clicked_node.is('.vk-reg-ref')) {
		widget.openURL(vkReferer);
		return false;
	  }
	  else if (clicked_node.is('.flash-s')){
		widget.openURL('http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html');
		return false;
	  }
	  else if (clicked_node.is('.artist')){
		artist_name = decodeURIComponent(clicked_node.data('artist'));
		setArtistPage(artist_name);
		return false;
	  }
	  else if(clicked_node.is('.bbcode_artist')){
	  	artist_name = decodeURIComponent(clicked_node.attr('href').replace('http://www.last.fm/music/',''));
	  	setArtistPage(artist_name);
	    return false;
	  }
	}
  });
});
