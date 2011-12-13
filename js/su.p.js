var seesuPlayer = function(){
	this.init();
};
seesuPlayer.prototype = new playerComplex();

cloneObj(seesuPlayer.prototype, {
	constructor: seesuPlayer,
	init: function(){
		playerComplex.prototype.init.call(this);
	},
	nowPlaying: function(mo){
		if (!su.ui.now_playing.link || su.ui.now_playing.link[0].ownerDocument != su.ui.d){
			if (su.ui.views.nav){
				su.ui.now_playing.link = $('<a class="np"></a>').click(function(){
					su.ui.views.show_now_playing(true);
				}).appendTo(su.ui.views.nav.justhead);
			}
		}
		if (su.ui.now_playing.link){
			su.ui.now_playing.link.attr('title', (localize('now-playing','Now Playing') + ': ' + mo.artist + " - " + mo.track));	
		}
	}
});

su.p = new seesuPlayer();
suReady(function(){
	var pcore = new sm2proxy();
	var pcon = $(pcore.getC());
	$(document.body).append(pcon);

	
	pcore
		.done(function(){
			su.p.setCore(pcore);
			pcon.css('border', '1px solid #666')
		})
		.fail(function(){
			pcon.css('border', '1px solid red')
		})

	//$(document.body).append(_this.c);
});



	