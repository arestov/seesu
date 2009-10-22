 function player_DoFSCommand(c, args) {

    if(args.match('playing')) alert('играю йоу');
    if(args.match('paused')) alert('пауза');
    if(args.match('finished')) alert('кончилось');
alert('тыдыщь!');
    /*flashDebug(0, false, "flashvars,debug,false", "undefined");
    
    flashDebug(66027115, false, "flashvars,dbid,66027115", "undefined");
    
    flashDebug(66027115, false, "flashvars,url,http://cs4507.vkontakte.ru/u18157945/audio/d8b60a4e9ba1.mp3", "undefined");
    
    stateChanged(66027115, false, "playing", "id=no_file,debugInfo=[empty]");
    
    stateChanged(66027115, false, "init", "id=no_file,debugInfo=[empty]");
    
    stateChanged(66027115, false, "created", "id=no_file,debugInfo=[empty]");
    
    // Измненена громкость
    
    stateChanged(66027115, false, "volume", "47.1428571428571");
    
    stateChanged(66027115, false, "paused", "id=no_file,debugInfo=[empty]");
    stateChanged(66027115, false, "finished", "id=no_file,debugInfo=[empty]");
  */}

  function set_var(func, value){
  
		var player = window.document.player;//$('.played-song embed').get();
		var counter = 0;
		var interval = 0;
		var cycle = function(){
			try {
				if (player.SetVariable) {
					player.SetVariable("audioPlayer_mc." + func, value);
					clearInterval(interval);
					return true;
				}
			}
			catch (e) {
				//alert(e.message)
			}

			if (counter++ > 3) {
				clearInterval(interval);
			}
			return false;
		};
		if (!cycle()) {
			interval = setInterval(cycle, 50);
		}
	}
	
$(function() {
 var playholder = $('#player-holder');
 $(document).click(function(e){
 	var node = e.target,
 	nodeClass = node.className;
 	if ((node.nodeName == 'A') && (nodeClass.indexOf('song') != -1)){
 		var song_url = node.getAttribute('href');
		playholder.html(
			holy_vk_string
			  .replace(':url', song_url)
			  .replace(':volume', start_volume)
			  .replace(':background_color', background_color)
		)
		return false
 	}
 });
 var holy_vk_string = 
   '<embed width="342" height="14" ' + 
   'flashvars="debug=false&amp;volume=:volume&amp;' +
	 'url=:url" allowscriptaccess="always" wmode="transparent" swliveconnect="true" quality="high" ' +
	 'bgcolor=":background_color" name="player" id="player" style="" ' +
	 'src="http://vkontakte.ru/swf/AudioPlayer_mini.swf?0.9.9" ' +
	 'type="application/x-shockwave-flash"/>',
	 
	 background_color = '#FFFFFF',
	 start_volume = 80;
 /*
  $('a.song').live('click', function() {
    var song_url = $(this).attr('href');
    
        
    playholder.html(
    	holy_vk_string
        .replace(':url', song_url)
        .replace(':volume', start_volume)
        .replace(':background_color', background_color)
    )    
        /*
    $('.played-song').each(function() {
      $(this).parent().html($(this).find('span').html());
        //.remove();
    });

    $(this).wrap(
      '<div class="played-song"><span></span>' +
      holy_vk_string
        .replace(':url', song_url)
        .replace(':volume', start_volume)
        .replace(':id', id)
        .replace(':background_color', background_color) +
      '</div>'
    );
    return false;
  });
  */
  
  $('#stop').click(function() {
	  set_var("setState", "stop");
	  //  window.document.SetVariable("setState", "stop", false);
	   // $('.played-song embed').SetVariable("setState", "stop", false);//("audioPlayer_mc." + func, value);
	    return false;
  });
  /*
	$('#pause').click(function() {
		set_var("setState", "pause");
		return false;
	});
	$('#play').click(function() {
		set_var("setState", "play");
		return false;
	});*/
  // VK player events handler

 
});
