const INIT     = -11,
      CREATED  = -7,
      VOLUME   = -5,
      STOPPED  =  1,
      PLAYED   =  5,
      PAUSED   =  7,
      FINISHED =  11;

var player_state = STOPPED,
    song_url = '',
    player_holder = null,

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
    
    
    playing_song = null;

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

function create_player() {
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

  if(playing_song) playing_song.removeClass('active-play');
  playing_song = node.addClass('active-play');
  
  create_player();
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
  var to_song = null;
  
  while(!to_song && to_song != -1) {
    log('Ищу...');
    var to_li = null;
    to_li = playing_song.parents('li')[direction]('li');
    
    if(to_li.length) {
      log('Нашел...');
      var song_link = $('a', to_li);
      
      if(song_link.is('.song')) {to_song = song_link;
      
        log('О норма!');
      }
    } else
      to_song = -1;
  }
  
  if(to_song && to_song != -1) {set_current_song(to_song);
        log('Давай-давай!');
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
  return false;
}

// Ready? Steady? Go!

$(function() {
  player_holder = $('#player-holder');

  $('#stop, #pause, #play').click(
    function() { set_state($(this).attr('id')); return false; }
  );

  $('#play_prev, #play_next').click(
    function() { if(playing_song) switch_to($(this).attr('id').replace(/play_/, '')); return false; }
  );

	events[FINISHED] = function() {
	  switch_to('next');
	};
});
