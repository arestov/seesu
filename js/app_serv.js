define(function(require) {
'use strict';
var spv = require('spv');
var w_storage = require('./libs/w_storage');
var preloaded_nk = require('./preloaded_nk');
var env = require('env');

var app_serv = {};

app_serv.getRemainTimeText = function(d, full, lo_will_get, lo_month, lo_time){
  var remain_desc = '';

  if (full){
    remain_desc += lo_will_get + ' ';
  }

  remain_desc += d.getDate() +
  " " + lo_month +
  " " + lo_time + ' ' + d.getHours() + ":" + d.getMinutes();

  return remain_desc;
};


app_serv.complexEach = function(items, callback, start) {
  if (!items) {return;}

  var length = 0;

  for (var i = 0; i < items.length; i++) {
    if (!items[i]) {continue;}

    if (items[i].length > length) {
      length = items[i].length;
    }
  }

  var start_result = start || [];
  var result;

  for (var bb = 0; bb < length; bb++) {
    var args = [start_result];
    for (var kk = 0; kk < items.length; kk++) {
      args.push(items[kk] && items[kk][bb]);
    }
    result = callback.apply(null, args);
  }

  return result;
};

(function(){

if (!env.bro.browser) {
  app_serv.loadJS = function(){
    console.log('can`t load js file');
  };
  return;
}

function isFileReady ( readyState ) {
  // Check to see if any of the ways a file can be ready are available as properties on the file's element
  return ( ! readyState || readyState == 'loaded' || readyState == 'complete' );
}

var p = document.documentElement.firstElementChild.getElementsByTagName('script');
p = p[p.length-1];

app_serv.loadJS = function(src, callback){
  var s = document.createElement('script'),
    done;
  s.onreadystatechange = s.onload = function () {

  if ( ! done && isFileReady( s.readyState ) ) {

    // Set done to prevent this function from being called twice.
    done = true;
    callback();

    // Handle memory leak in IE
    s.onload = s.onreadystatechange = null;
  }
  };
  s.src = src;
  p.parentNode.insertBefore(s, p);
};

})();

app_serv.getInternetConnectionStatus = function(cb) {
  var img = new Image();
  img.onload = function() {
    cb(true);
  };
  img.onerror = function() {
    cb(false);
  };
  img.src = "http://www.google-analytics.com/__utm.gif?" + Math.random() + new Date();
};

var get_url_parameters = function(str, decode_uri_c){
  var url_vars = str.replace(/^\?/,'').split('&');
  var full_url = {};
  for (var i=0; i < url_vars.length; i++) {
    var _h = url_vars[i].split('=');
    var prop_name = _h[0];
    var prop_value = _h[1];
    if (decode_uri_c){
      prop_name = decodeURIComponent(prop_name);
      prop_value = decodeURIComponent(prop_value);
    }


    full_url[prop_name] = prop_value;
  }
  return full_url;
};
app_serv.get_url_parameters = get_url_parameters;

(function(){
  var sensitive_keys = ['vk_token_info', 'dg_auth', 'lfm_scrobble_s', 'lfmsk', 'big_vk_cookie'];
  var parse = function(r_value){
    if (r_value === Object(r_value)){
      return r_value;
    } else if (typeof r_value == 'string'){
      var str_start = r_value.charAt(0),
        str_end   = r_value.charAt(r_value.length - 1);
      if ((str_start == '{' && str_end == '}') || (str_start == '[' && str_end == ']')){
        try {
          r_value = JSON.parse(r_value);
        } catch (e) {

        }
      }
      return r_value;
    } else{
      return r_value;
    }
  };
  app_serv.store = function(key, value, opts){
    var sensitive = !!key && sensitive_keys.indexOf(key) > -1;
    if (typeof value != 'undefined'){
      if (value && sensitive && env.pokki_app){
        value = pokki.scramble(value);
      }

      return w_storage(key, value, opts);

    } else{

      value =  w_storage(key, value, opts);
      if (sensitive && env.pokki_app){
        value = pokki.descramble(value);
      }

      return parse(value);
    }
  };
  app_serv.getPreloadedNK = function(key){
    if (env.pokki_app){
      var rv = pokki.getScrambled(key);
      if (rv){
        return rv;
      }
    }
    var nk = preloaded_nk;
    if (nk && nk[key]){
      return nk[key];
    }

  };

})();

app_serv.app_env = env;

var is_nodewebkit = env.app_type == 'nodewebkit';
app_serv.getSafeIframe = function() {
  var iframe = document.createElement('iframe');
  if (is_nodewebkit) {
    iframe.setAttribute('nwdisable', true);
    iframe.setAttribute('nwfaketop', true);
  }
  return iframe;
};

app_serv.localize = env.localize;

app_serv.parseArtistInfo = function(r){
  var ai = {};
  if (r && r.artist){
    var info = r.artist;

    ai.artist = spv.getTargetField(info, 'name');
    ai.bio = (ai.bio = spv.getTargetField(info, 'bio.summary')) && ai.bio.replace(new RegExp("ws.audioscrobbler.com",'g'),"www.last.fm");
    ai.similars = (ai.similars = spv.getTargetField(info, 'similar.artist')) && spv.toRealArray(ai.similars);
    ai.tags = (ai.tags = spv.getTargetField(info, 'tags.tag')) && spv.toRealArray(ai.tags);
    ai.images = (ai.images = spv.getTargetField(info, 'image')) && (ai.images = spv.toRealArray(ai.images)) && spv.filter(ai.images, '#text');

  }
  return ai;
};




return app_serv;
});
