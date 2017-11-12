define(function(require) {
'use strict';
var spv = require('spv');
var $ = require('jquery');

  var using_mime_type = "video/quicktime";
  //"application/x-quicktimeplayer"

  var createAE = function(id, url, cb) {
    //var a//
    //application/x-quicktimeplayer
    //'<object id="sound_#{track}_#{id}" width="0" height="0" type="application/x-quicktimeplayer" data="#{url}"/>')


  /*

  application/x-vlc-plugin

VLC media player Web Plugin 2.0.0


video/quicktime


var a = document.createElement("embed");a.onload = function(){console.log("load")}; a.width = 0;a.height = 0; a.type="video/quicktime"; document.body.appendChild(a);

var a = document.createElement("object");a.onload = function(){console.log("load")}; a.type="application/x-ms-wmp"; $(document.body).append(a);


*/

    var a = document.createElement("embed");
    a.type = using_mime_type;
    a.style.position = "absolute";
    a.style.top = "-1000px";
    a.id = a.name = id + "_" + (new Date()).valueOf();

    a.EnableJavaScript = true;
    a.postdomevents = true;
    a.QTSRCDONTUSEBROWSER = true;
    //a.QTSRC = url;

    $(document.body).append(a);

    a.SetURL(url);

    //a.src = url;


    return a;


    var a = new Audio(url);
    a.volume = 1;
    spv.addEvent(a, 'play', function(){
      cb('play', id);
    });
    spv.addEvent(a, 'pause', function(){
      cb('pause', id);
    });
    spv.addEvent(a, 'ended', function(){
      cb('finish', id);
    });
    spv.addEvent(a, 'timeupdate', function(){
      cb('playing', id, {
        duration:  a.duration,
        position: a.currentTime
      });
    });
    var at_finish;
    var fireProgress = function() {
      cb('loading', id, {
        duration: a.duration,
        fetched: a.buffered.end(0)
      });
    };
    spv.addEvent(a, 'progress', function(){
      clearTimeout(at_finish);
      if (a.buffered.length){
        fireProgress();
        if (a.buffered.end(0)/a.duration != 1){
          at_finish = setTimeout(function() {
            fireProgress();
          }, 5000);
        }
      }
    });
    spv.addEvent(a, 'error', function(){
      cb('error', id);
    });
    return a;
  };
  var QuickTimeSound = function(opts, cb) {
    this.url = opts.url;
    this.id = opts.id;
    this.cb = cb;
    //this.requireAE();

  };
  QuickTimeSound.prototype = {
    requireAE: function() {
      if (!this.a){
        this.a = createAE(this.id, this.url, this.cb);
      }
    },
    unload: function() {
      if (this.a){
        try {
          this.a.Pause();
        } catch (e){}
        $(this.a).remove();
        //this.a
        //this.a.url = null;
        delete this.a;
      }
    },
    play: function() {
      this.requireAE();
      this.a.Play();
    },
    load: function() {
      this.requireAE();
      //this.a.load();
    },
    stop: function() {
      try{
        this.a.pause();
        this.a.currentTime = 0;
      } catch(e){}
    },
    pause: function() {
      this.a.Pause();
    },
    setVolume: function(vol) {
      this.a.volume = vol/100;
    },
    setPosition: function(pos) {
      try{
        this.a.currentTime = Math.min(this.a.buffered.end(0), pos);
      } catch(e){}
    }
  };


  var AudioCoreQuickTime = function() {
    var _this = this;
    this.sounds_store = {};
    this.feedBack = function() {
      if (_this.subr){
        _this.subr.apply(_this, arguments);
      }
    };
  };

  AudioCoreQuickTime.prototype = {
    subscribe: function(cb){
      this.subr = cb;
      return this;
    },
    desubscribe: function(cb){
      if (this.subr === cb){
        delete this.subr;
      }
    },

    createSound: function(opts) {
      if (!this.sounds_store[opts.id]){
        this.sounds_store[opts.id] = new QuickTimeSound(opts, this.feedBack);
      }
    },
    removeSound: function(id) {
      if (this.sounds_store[id]){
        this.sounds_store[id].unload();
        delete this.sounds_store[id];
      }
    },
    getSound: function(id) {
      return this.sounds_store[id];
    },
    plc: {
      create: function(s, opts){
        if (!s || s.url != opts.url){
          this.removeSound(opts.id);
          this.createSound(opts);
        }
      },
      remove: function(s){
        if (s){
          this.removeSound(s.id);
        }
      },

      play: function(s){
        s.play();
      },
      stop: function(s){
        if (s){
          s.stop();
        }
      },
      pause: function(s){
        if (s){
          s.pause();
        }
      },
      setVolume: function(s, vol){
        if (s){
          s.setVolume(parseFloat(vol));
        }
      },
      setPosition: function(s, pos){
        if (s){
          s.setPosition(parseFloat(pos));
        }
      },
      load: function(s){
        if (s){
          s.load();
        }
      },
      unload: function(s){
        if (s){
          s.unload();
        }
      }
    },

    callCore: function(method, id, opts) {
      if (method && this.plc[method] && id){
        if (opts && opts === Object(opts)){
          spv.cloneObj(opts, {id: id});
        }
        this.plc[method].call(this, this.getSound(id), opts);
      }
    },
    callSongMethod: function() {
      this.callCore.apply(this, arguments);
    }
  };
return AudioCoreQuickTime;

});
