//vkontakte.ru player
var vk_flash_player_DoFSCommand = function(){
	seesu.player.musicbox.flash_js(arguments[1])
};

var vk_p = function(flash_node_holder){
	this.player_holder = flash_node_holder;
	log('using vkontakte player');
};
vk_p.prototype = {
	'module_title':'vk_p',
	'html': 
		('<embed width="342" height="8" ' + 
		'flashvars="debug=false&amp;volume=:volume&amp;duration=210&amp;' +
		'url=:url" allowscriptaccess="always" wmode="transparent" quality="low" ' +
		'name="vk_flash_player" class="vk_flash_player" ' +
		'src="http://vkontakte.ru/swf/AudioPlayer_mini.swf?0.9.9" ' +
		'type="application/x-shockwave-flash"/>'),
	'flash_js': function(args){
		log(args)
		if(args.match('playing')) {seesu.player.call_event(PLAYED);}
		if(args.match('paused')) {seesu.player.call_event(PAUSED);}
		if(args.match('finished')) {log('finish');seesu.player.call_event(FINISHED);}
		if(args.match('init')) {
			this.player_holder.removeClass('vk-p-initing');
			seesu.player.call_event(INIT);
		}
		if(args.match('created')) {seesu.player.call_event(CREATED);}
		if(args.match('stopped')) {seesu.player.call_event(STOPPED);}
		if(args.match('volume')) {seesu.player.call_event(VOLUME, this.parse_volume_value(args));}
	},
	'create_player': function(song_url,duration){
		var _this = this;
		this.player_holder.append(
			_this.html
			  .replace(':url', song_url)
			  .replace(':volume', seesu.player.player_volume)
			  .replace('duration=210', ('duration=' + duration))
		).addClass('vk-p-initing');
		setTimeout(function(){
			_this.player_holder.removeClass('vk-p-initing');
			
		},1000)
	},
	'parse_volume_value': function(volume_value_raw){
		var volume_level_regexp = /\"((\d{1,3}\.?\d*)|(NaN))\"/,
		pre_pesult = volume_level_regexp.exec(volume_value_raw);
		return pre_pesult.slice(1, pre_pesult.length - 1)[0];
	},
	'set_var': function(variable, value) {
	  $(".vk_flash_player",this.player_holder)[0].SetVariable("audioPlayer_mc." + variable, value);
	},
	"play_song_by_url": function (song_url,duration){
	  this.create_player(song_url,duration)
	},
	"play_song_by_node": function (node){
	  this.player_holder[0].innerHTML = ''; //we need for speed here! so.. say no to jquery
	  node[0].parentNode.appendChild(this.player_holder[0]);
	  node[0].parentNode.appendChild(track_buttons[0]);
	  this.create_player(node.attr('href'), node.data('duration'));
	  
	},
	'play': function () {
	  this.set_var('buttonPressed', 'true');
	},
	'stop': function () {
		this.set_var('setState', 'stop');
	},
	'pause': function () {
	  this.set_var('buttonPressed', 'true');
	} 
};
