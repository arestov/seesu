const INIT     = -11,
	  CREATED  = -7,
	  VOLUME   = -5,
	  STOPPED  =  1,
	  PLAYED   =  5,
	  PAUSED   =  7,
	  FINISHED =  11;

//vkontakte.ru player
var vk_p = {
	'html': 
		('<embed width="342" height="14" ' + 
		'flashvars="debug=false&amp;volume=:volume&amp;duration=210&amp;' +
		'url=:url" allowscriptaccess="always" wmode="transparent" quality="high" ' +
		'name="vk_flash_player" class="vk_flash_player" ' +
		'src="http://vkontakte.ru/swf/AudioPlayer_mini.swf?0.9.9" ' +
		'type="application/x-shockwave-flash"/>'),
	'flash_js': function(c, args){
		log(c)
		log(args)
		if(args.match('playing')) {call_event(PLAYED)};
		if(args.match('paused')) {call_event(PAUSED)};
		if(args.match('finished')) {call_event(FINISHED)};
		if(args.match('init')) {call_event(INIT)};
		if(args.match('created')) {call_event(CREATED)};
		if(args.match('stopped')) {call_event(STOPPED)};
		if(args.match('volume')) {
		  call_event(VOLUME, parse_volume_value(args) );
		};
	},
	'create_player': function(song_url,duration){
		player_holder.html(
			vk_p.html
			  .replace(':url', song_url)
			  .replace(':volume', player_volume)
			  .replace('duration=210', ('duration=' + duration))
		);
	},
	'parse_volume_value': function(volume_value_raw){
		var volume_level_regexp = /\"((\d{1,3}\.?\d*)|(NaN))\"/,
		pre_pesult = volume_level_regexp.exec(volume_value_raw);
		return pre_pesult.slice(1, pre_pesult.length - 1)[0];
	},
	'set_var': function(variable, value) {
		$(".vk_flash_player",player_holder)[0].SetVariable("audioPlayer_mc." + variable, value);
	}  
};
function call_event(event, data) {
  if(events[event]) events[event](data);
}

var player_state = STOPPED,
	player_holder = null,
	current_playlist,
	want_to_play = 0,
	wainter_for_play,
	current_artist = '',
	iframe_player = false,
	iframe_doc = null,
	player_volume = (widget.preferenceForKey('vkplayer-volume') && widget.preferenceForKey('vkplayer-volume') != 'undefined') || 80,
	events = new Array,
	current_song = null;
	widget.test_message = 'Hello, world!';
// VK player actions
events[PAUSED] = function(){
  player_state = PAUSED;
}
events[PLAYED] = function(){
  player_state = PLAYED;
}
events[STOPPED] = function(){
  player_state = STOPPED;
}
events[FINISHED] = function() {
  if (typeof(source_window) != 'undefined') {
	source_window.switch_to_next();
  } else {
	switch_to_next();
  }
};
events[VOLUME] = function(volume_value) {
  if (typeof(source_window) != 'undefined') {
	source_window.change_volume();
  } else { 
	change_volume(volume_value);
  }
  
};
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
	if (current_song) {play_song_by_url(current_song.attr('href'),current_song.data('duration') )};
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
var vk_flash_player_DoFSCommand = vk_p.flash_js;
function play_song_by_url(song_url,duration){
	if (iframe_doc) {
		iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'play','file':song_url}),'*');
	} else {
		vk_p.create_player(song_url,duration)
	}
	
}

// Player actions
function play_pause() {
  if (iframe_doc) {
	iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'play_pause'}),'*');
  } else{
	vk_p.set_var('buttonPressed', 'true');
  }
}
function play() {
  play_pause();
}

function stop() {
  if (iframe_doc) {
	iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'stop'}),'*');
  } else{
	vk_p.set_var('setState', 'stop');
  }
}
function pause() {
  play_pause();
}


function set_current_song(node) {
  play_song_by_url(node.attr('href'), node.data('duration'));
  if (current_song) current_song.removeClass('active-play');
  current_song = node.addClass('active-play');
  var artist = node.data('artist_name');
  if (artist) {update_artist_info(artist);}
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

// Click by song
function song_click(node) {
  set_current_song(node);
  current_playlist = node.data('link_to_playlist');
  return false;
}
var parse_volume_value = vk_p.parse_volume_value;

function switch_to_next(){
  switch_to('next');
}
function change_volume(volume_value){
  widget.setPreferenceForKey(volume_value, 'vkplayer-volume');
  player_volume = volume_value;	
}
widget.switch_to_next = switch_to_next;
widget.change_volume = change_volume;


var ej_postMessage = function(message_obj){
	iframe_doc.contentWindow.postMessage(JSON.stringify(message_obj),'*');
}
var ej_do = function(to_eval){
	iframe_doc.contentWindow.postMessage(JSON.stringify({'command':'eval','toeval': to_eval}),'*');
}
// Ready? Steady? Go!
$(function() {
  player_holder = $('.player-holder');
  iframe_doc = $('#ejohn')[0];
  if (iframe_doc) {
	$(iframe_doc).load(function(){
		iframe_doc.contentWindow.postMessage(JSON.stringify({'command': 'init'}),'*');
	})
  };
  $('#stop, #pause, #play').click( function() {
	set_state($(this).attr('id')); return false; }
  );
  $('#play_prev, #play_next').click( function() { 
	if(current_song) switch_to($(this).attr('id').replace(/play_/, '')); return false; }
  );
});