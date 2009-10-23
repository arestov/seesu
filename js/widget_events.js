$(function() {
  $(document).click(function(e) {
  	var clicked_node = $(e.target);
  	
  	if(clicked_node.is('a')) {
  	  if(clicked_node.is('.song')) return song_click(clicked_node)
    		
  	  else if(clicked_node.is('.vk-reg-ref')) {
    	  
    	  widget.openURL(vkReferer);
    		return false
  	  }
  	}
  });
});
