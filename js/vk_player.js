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
    events = new Array;    

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

// Ready? Steady? Go!

$(function() {
  player_holder = $('#player-holder');

  var playingNode;

  $(document).click(function(e) {
  	var node = e.target,
  	    nodeClass = node.className;
  	
  	if(node.nodeName == 'A') {
  	if(nodeClass.indexOf('song') != -1) {
   		
   		song_url = node.getAttribute('href');
   	
   		$(playingNode).removeClass('active-play');
  		
  		create_player();
  		
  		$(node).addClass('active-play');
  		playingNode = node;
  		return false
   	} else if(nodeClass.indexOf('vk-reg-ref') != -1) {
  		
  		widget.openURL(vkReferer);
  		return false
  	}
  }
  });

  $('#stop, #pause, #play').click(
    function() { set_state($(this).attr('id')); return false; }
  );
});
