define(function(require) {
'use strict';
var spv = require('spv');
var $ = require('jquery');


var AudioCoreSm2Proxy = function(origin, path, opts) {
  var _this = this;
  this.origin = origin;


  spv.addEvent(window, "message", function(e){
    if (_this.frame && _this.frame.contentWindow == e.source) {
      if (e.origin.indexOf(_this.origin) === 0){
        _this.handleFrameMessage.apply(_this, (e.data === Object(e.data) ? e.data : JSON.parse(e.data)));
      } else {
        _this.fail();
      }
    }

  });

  if (opts && opts === Object(opts)){
    var params_string = spv.stringifyParams(opts, false, '=', '&');
    if (params_string){
      path = path + '#' + params_string;
    }
  }
  this.modern_messaging = opts.modern_messaging;

  this.frame = document.createElement('iframe');
  this.frame.src = this.origin + path;
  this.def = $.Deferred();

};

AudioCoreSm2Proxy.prototype = {
  fail: function(cb){
    this.def.fail(cb);
    return this;
  },
  done: function(cb){
    this.def.done(cb);
    return this;
  },
  getC: function(){
    return this.frame;
  },
  handleFrameMessage: function(func){
    if (func){
      if (func === 'sm2loaded'){
        if (func){
          this.def.resolve();
        } else {
          this.def.reject();
        }
      } else {
        if (this.subr){
          this.subr.apply(this, arguments);
        }
      }
      //console.log(arguments)
    }
  },
  subscribe: function(cb){
    this.subr = cb;
    return this;
  },
  desubscribe: function(cb){
    if (this.subr === cb){
      delete this.subr;
    }
  },
  sendMsg: function(){
    var args = Array.prototype.slice.call(arguments);

    if (args.length){
      this.frame.contentWindow.postMessage(this.modern_messaging ? args : JSON.stringify(args), '*');
    }
  },
  callSongMethod: function() {
    //method, id
    this.sendMsg.apply(this, arguments);
  }
};
return AudioCoreSm2Proxy;
});
