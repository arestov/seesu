const INIT     = -11,
      CREATED  = -7,
      VOLUME   = -5,
      STOPPED  =  1,
      PLAYED   =  5,
      PAUSED   =  7,
      FINISHED =  11;

var player_state = STOPPED,
    player_holder = null,
    current_playlist,

    holy_vk_string = 
      '<embed width="342" height="14" ' + 
      'flashvars="debug=false&amp;volume=:volume&amp;' +
      'url=:url" allowscriptaccess="always" wmode="transparent" swliveconnect="true" quality="high" ' +
      'bgcolor=":background_color" name="player" id="player" style="" ' +
      'src="http://vkontakte.ru/swf/AudioPlayer_mini.swf?0.9.9" ' +
      'type="application/x-shockwave-flash"/>',
      
    start_volume = widget.preferenceForKey('vkplayer-volume') || 80,
     
    background_color = '#FFFFFF',
    events = new Array,
    
    
    current_song = null;

// VK player actions

function call_event(event, data) {
  log('Event: ' + event);
  if(events[event]) events[event](data);
}

function player_DoFSCommand(c, args) {

  if(args.match('playing')) call_event(PLAYED);
  
  if(args.match('paused')) call_event(PAUSED);
  
  if(args.match('finished')) call_event(FINISHED);
  
  if(args.match('init')) call_event(INIT);
  
  if(args.match('created')) call_event(CREATED);

  if(args.match('volume')) call_event(VOLUME/*, ??? */);
}

function set_var(variable, value) {
	window.document.player.SetVariable("audioPlayer_mc." + variable, value);
}  

function create_player(song_url) {
	player_holder.html(
		holy_vk_string
		  .replace(':url', song_url)
		  .replace(':volume', start_volume)
		  .replace(':background_color', background_color)
	);
	
	player_state = PLAYED;
}

// Player internal functions

function set_current_song(node) {
  song_url = node.attr('href');

  if(current_song) current_song.removeClass('active-play');
  create_player(song_url);
  current_song = node.addClass('active-play');
}

// Player actions

function play_pause() {
  set_var('buttonPressed', 'true');
}

function play() {
  log('Играй гормонь!')
  play_pause();
  player_state = PLAYED;
}


function stop() {
  log('Стой сука');
  set_var('setState', 'stop');
  player_state = STOPPED;
}


function pause() {
  log('Паузе')
  play_pause();
  player_state = PAUSED;
}

function switch_to(direction) {
  if(current_song) {
  	var playlist 		= current_song.data('link_to_playlist'),
  		current_number 	= current_song.data('number_in_playlist'),
  		total			= playlist.length || 0;
  	if (playlist.length > 1) {
  		if (direction == 'next') {
  			if (current_number == (total-1)) {
  				set_current_song(playlist[0]);
  			} else {
  				set_current_song(playlist[current_number+1]);
  			}
  		} else
  		if (direction == 'prev') {
  			if ( current_number == 0) {
  				set_current_song(playlist[total-1]);
  			} else {
  				set_current_song(playlist[current_number-1]);
  			}
  		}
  	}
  	
  }
}

// Player state switcher

function set_state(new_player_state_str) {

  var new_player_state =
    (new_player_state_str == "play" ? PLAYED :
      (new_player_state_str == "stop" ? STOPPED : PAUSED)
    );

  log('Old state: ' + player_state);
  log('Set state! ' + new_player_state);

  log(player_state - new_player_state);

  switch(player_state - new_player_state) {
  case(STOPPED - PLAYED):
    create_player();
    break;
  case(PAUSED - PLAYED):
    play();
    break;    
  case(PAUSED - STOPPED):
  case(PLAYED - STOPPED):
    stop();
    break;
  case(PLAYED - PAUSED):
    pause();
    break;
  default:
    log('Do nothing');
    // Do nothing
  }
}

// Click by song

function song_click(node) {
  set_current_song(node);
  current_playlist = node.data('link_to_playlist');
  return false;
}

// Ready? Steady? Go!

$(function() {
  player_holder = $('.player-holder:first');

  $('#stop, #pause, #play').click(
    function() { set_state($(this).attr('id')); return false; }
  );

  $('#play_prev, #play_next').click(
    function() { if(current_song) switch_to($(this).attr('id').replace(/play_/, '')); return false; }
  );

	events[FINISHED] = function() {
	  switch_to('next');
	};
});
