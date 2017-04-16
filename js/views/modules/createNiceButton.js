define(function (require) {
'use strict';
var $ = require('jquery');

return function createNiceButton(position) {
  var c = $('<span class="button-hole"><a class="nicebutton"></a></span>');
  var b = c.children('a');

  if (position == 'left'){
    c.addClass('bposition-l');
  } else if (position == 'right'){
    c.addClass('bposition-r');
  }

  var bb = {
    c: c,
    b: b,
    _enabled: true,
    enable: function(){
      if (!this._enabled){
        this.b.addClass('nicebutton').removeClass('disabledbutton');
        this.b.data('disabled', false);
        this._enabled = true;
      }
      return this;

    },
    disable: function(){
      if (this._enabled){
        this.b.removeClass('nicebutton').addClass('disabledbutton');
        this.b.data('disabled', true);
        this._enabled = false;
      }
      return this;
    },
    toggle: function(state){
      if (typeof state != 'undefined'){
        if (state){
          this.enable();
        } else {
          this.disable();
        }
      }

    }
  };
  bb.disable();
  return bb;
};
});
