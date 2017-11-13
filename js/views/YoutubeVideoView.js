define(function(require) {
'use strict';
var $ = require('jquery');
var coct = require('./coct');
var spv = require('spv');
var app_serv = require('app_serv');

var app_env = app_serv.app_env;
var YoutubeVideoView = spv.inh(coct.PageView, {}, {
  full_page: true,
  createBase: function() {
    this.c = $('<div class="youtube-video-page"></div>');
  },
  'stch-yt_id': function(target, state) {
    $(create_youtube_video(state)).appendTo(target.c);
  }
});

function create_youtube_video(id){
  var youtube_video = window.document.createElement('embed');
  if (!app_env.chrome_like_ext){
    if (app_env.opera_widget){
      youtube_video.setAttribute('wmode',"transparent");
    } else if (app_env.opera_extension){
      youtube_video.setAttribute('wmode',"opaque");
    }
  }


  youtube_video.setAttribute('type',"application/x-shockwave-flash");
  youtube_video.setAttribute('src', 'https://www.youtube.com/v/' + id + '&autoplay=1');
  youtube_video.setAttribute('allowfullscreen',"true");
  youtube_video.setAttribute('class',"you-tube-video");

  return youtube_video;
};

return YoutubeVideoView;
});
