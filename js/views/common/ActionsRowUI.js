define(function(require){
'use strict';
var pv = require('pv');
var spv = require('spv');
var View = require('View');

var pvUpdate = pv.update;

var ActionsRowUI = spv.inh(View, {}, {
  "+states": {
    "key-button_owidth": [
      "compx",
      ['#workarea_width', 'active_part'],
      function(workarea_width, active_part) {
        if (workarea_width && active_part){
          //ширина кнопки, зависит типа вьюхи и активной части
          return this.getBoxDemensionKey('button_owidth', active_part);
        }
      }
    ],

    "key-button_offset": [
      "compx",
      ['#workarea_width', 'active_part'],
      function(workarea_width, active_part) {
        if (workarea_width && active_part){
          //расположение кнопки, зависит от ширины окна и названия части
          return this.getBoxDemensionKey('button_offset', workarea_width, active_part);
        }
      }
    ],

    "key-arrow_parent_offset": [
      "compx",
      ['#workarea_width', 'active_part'],
      function(workarea_width, active_part) {
        if (workarea_width && active_part){
          //расположенние позиционного родителя стрелки, зависит от ширины окна
          return this.getBoxDemensionKey('arrow_parent_offset', workarea_width);
        }
      }
    ],

    "arrow_pos": [
      "compx",
      ['button_owidth', 'button_offset', 'arrow_parent_offset'],
      function(button_width, button_offset, parent_offset) {
        if (button_offset && parent_offset){
          return ((button_offset.left + button_width/2) - parent_offset.left) + 'px';
        }
      }
    ]
  },

  bindBase: function() {
  },

  getCurrentButton: function() {
    var active_part = this.state('active_part');
    if (active_part){
      return this.getCusomAncs()['bt' + active_part];
    }
  },

  getArPaOffset: function() {
    return this.getCusomAncs()['arrow'].offsetParent().offset();
  },

  getCurrentButtonOWidth: function() {
    var current_button = this.getCurrentButton();
    return current_button.outerWidth();
  },

  getCurrentButtonOffset: function() {
    var current_button = this.getCurrentButton();
    return current_button.offset();
  },

  'stch-key-button_owidth': function(target, state) {
    if (state) {
      pvUpdate(target, 'button_owidth', target.getBoxDemensionByKey(target.getCurrentButtonOWidth, state));
    }
  },

  'stch-key-button_offset': function(target, state) {
    if (state) {
      pvUpdate(target, 'button_offset', target.getBoxDemensionByKey(target.getCurrentButtonOffset, state));
    }
  },

  'stch-key-arrow_parent_offset': function(target, state) {
    if (state) {
      pvUpdate(target, 'arrow_parent_offset', target.getBoxDemensionByKey(target.getArPaOffset, state));
    }
  }
});

return ActionsRowUI;
})
