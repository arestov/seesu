$(function() {
  $(document).click(function(e) {
	var clicked_node = $(e.target);

	if(clicked_node.is('a')) {
	  if(clicked_node.is('.song')) {
		return song_click(clicked_node);
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
		artist_name = clicked_node.data('artist');
		artistsearch(artist_name);
		return false;
	  }
	}
  });
});
