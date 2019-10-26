define(function(require) {
'use strict';
var spv = require('spv');
var $ = require('jquery');
var UserCardPreview = require('./UserCardPreview');
var coct = require('./coct');


var finup = function(callback) {
  callback.finup = true;
  return callback;
};

var StartPageView = spv.inh(coct.SPView, {}, {
  "+states": {
    "autofocus": [
      "compx",
      ['mp_show_end', 'mp_has_focus'],
      function(shw_end, focus) {
        return focus && shw_end;
      }
    ],

    "lo_at_page": ["compx", []],

    "ask_rating_help": [
      "compx",
      ['ask-rating-help', '#locales.at-this-page', '#locales.ask-rating-help'],
      function(link, lo_at_page, text) {
        return link && lo_at_page && {
          link: link,
          link_text: lo_at_page,
          text: text
        };
      }
    ]
  },

  createDetails: function(){
    this.els = this.root_view.els;
    this.c = this.els.start_screen;
    this.createTemplate();
  },

  'nest_borrow-search_criteria': ['^^search_criteria'],
  'collch-muco': true,
  'collch-pstuff': true,
  'collch-tags': true,

  children_views: {
    pstuff: {
      main: UserCardPreview
    },
    tags: coct.ListPreview
  },

  'stch-autofocus': function(target, value) {
    target.parent_view.parent_view.updateState('startpage_autofocus', value);
  },

  state_change: {
    "can_expand": function(target, state) {
      if (state){
        target.requirePart('start-page-blocks');
      }
    },
    "ask_rating_help": finup(function(target, obj){
      var anchor = target.getCusomAncs().help_text;
      if (!obj) {
        // anchor.empty();
      } else {
        var url = $("<a class='external'></a>")
          .attr('href', obj.link)
          .text(obj.link_text);

        anchor.append(spv.createComlexText(obj.text).setVar("app_url", url[0]));
      }
    })
  },

  parts_builder: {
    'start-page-blocks': function() {
      return true;
    }
  }
});
return StartPageView;
});
