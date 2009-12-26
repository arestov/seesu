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
	want_to_play = 0,
	wainter_for_play,
	current_artist = '',
	iframe_player = true,
	iframe_doc = null,

    holy_vk_string = 
      '<embed width="342" height="14" ' + 
      'flashvars="debug=false&amp;volume=:volume&amp;' +
      'url=:url" allowscriptaccess="always" wmode="transparent" swliveconnect="true" quality="high" ' +
      'bgcolor=":background_color" name="player" class="player" style="" ' +
      'src="http://vkontakte.ru/swf/AudioPlayer_mini.swf?0.9.9" ' +
      'type="application/x-shockwave-flash"/>',
      
    player_volume = (widget.preferenceForKey('vkplayer-volume') && widget.preferenceForKey('vkplayer-volume') != 'undefined') || 80,
    
    background_color = '#FFFFFF',
    events = new Array,
    
    
    current_song = null;

	widget.test_message = 'Hello, world!';
log(player_volume);
// VK player actions

function call_event(event, data) {
  //log('Event: ' + event);
  if(events[event]) events[event](data);
}

function player_DoFSCommand(c, args) {
  if(args.match('playing')) {call_event(PLAYED)};
  
  if(args.match('paused')) {call_event(PAUSED)};
  
  if(args.match('finished')) {call_event(FINISHED)};
  
  if(args.match('init')) {call_event(INIT)};
  
  if(args.match('created')) {call_event(CREATED)};

  if(args.match('volume')) {
	call_event(VOLUME, parse_volume_value(args) )
  };
}

function set_var(variable, value) {
	var player = $(".player",player_holder);
	player[0].SetVariable("audioPlayer_mc." + variable, value);
	log(player[0])
	log(player[0].SetVariable)
	//$(".player",player_holder)[0].SetVariable("audioPlayer_mc." + variable, value);
}  
function play_song_by_url(song_url){
	if (iframe_doc) {
		iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'play','file':song_url}),'*');
	} else {
		create_player(song_url)
	}
	player_state = PLAYED;
}
function create_player(song_url) {
	player_holder.html(
		holy_vk_string
		  .replace(':url', song_url)
		  .replace(':volume', player_volume)
		  .replace(':background_color', background_color)
	);
}

// Player internal functions

function set_current_song(node) {
  song_url = node.attr('href');
  var artist = node.data('artist_name');
  if (artist) {update_artist_info(artist);}
  
  
  if(current_song) current_song.removeClass('active-play');
  play_song_by_url(song_url);
  current_song = node.addClass('active-play');
  
  
}

// Player actions

function play_pause() {
  if (iframe_doc) {
	iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'play_pause'}),'*');
  } else{
  	log('piu')
	set_var('buttonPressed', 'true');
  }
  
}

function play() {
  //log('Играй гормонь!')
  play_pause();
  player_state = PLAYED;
}

ej_postMessage = function(message_obj){
	iframe_doc.contentWindow.postMessage(JSON.stringify(message_obj),'*');
}
ej_do = function(to_eval){
	iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'eval','toeval': to_eval}),'*');
}
function stop() {
  //log('Стой сука');
  if (iframe_doc) {
	iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'stop'}),'*');
  } else{
	set_var('setState', 'stop');
  }
  player_state = STOPPED;
}


function pause() {
  //log('Паузе')
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

  //log('Old state: ' + player_state);
  //log('Set state! ' + new_player_state);

  //log(player_state - new_player_state);

  switch(player_state - new_player_state) {
  case(STOPPED - PLAYED):
    play_song_by_url('');
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
    //log('Do nothing');
  }
}

// Click by song

function song_click(node) {
  set_current_song(node);
  current_playlist = node.data('link_to_playlist');
  return false;
}


function parse_volume_value(volume_value_raw) {
	var volume_level_regexp = /\"((\d{1,3}\.?\d*)|(NaN))\"/,
		pre_pesult = volume_level_regexp.exec(volume_value_raw);
	return pre_pesult.slice(1, pre_pesult.length - 1)[0];
}
function switch_to_next(){
  switch_to('next');
}
function change_volume(volume_value){
  widget.setPreferenceForKey(volume_value, 'vkplayer-volume');
  player_volume = volume_value;	
}
widget.switch_to_next = switch_to_next;
widget.change_volume = change_volume;

events[FINISHED] = function() {
  if (source_window) {
	source_window.switch_to_next();
  } else {
	switch_to_next();
  }
  
};
events[VOLUME] = function(volume_value) {
  if (source_window) {
	source_window.change_volume();
  } else { 
	change_volume(volume_value);
  }
  
};
// Ready? Steady? Go!
$(function() {
  player_holder = $('.player-holder');
  iframe_doc = $('#ejohn')[0];
  if (iframe_doc) {
	$(iframe_doc).load(function(){
		iframe_doc.contentWindow.postMessage(JSON.stringify({'command': 'init'}),'*');
	})
	
	
  };
  $('#stop, #pause, #play').click(
    function() { set_state($(this).attr('id')); return false; }
  );

  $('#play_prev, #play_next').click(
    function() { if(current_song) switch_to($(this).attr('id').replace(/play_/, '')); return false; }
  );


});
