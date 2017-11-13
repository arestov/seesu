define(function(require) {
'use strict';
var pv = require('pv');
var spv = require('spv');
var ArtcardUI = require('./ArtcardUI');
var coct = require('./coct');
var View = require('View');
var loadImage = require('./utils/loadImage');

var pvUpdate = pv.update;

var SongcardPage = spv.inh(coct.SPView, {}, {
  base_tree: {
    sample_name: 'songcard_page',
    children_by_selector: [{
      sample_name: 'artist_preview-base',
      selector: '.nested_artist',
      children_by_selector: [{
        sample_name: 'photo-cont',
        selector: '.possible_images_con'
      }]
    }]
  },
  children_views: {
    fans: coct.ImagedListPreview,
    artist: ArtcardUI.ArtistInSongConstroller
  }
});

var FanPreview = spv.inh(View, {}, {
  "+states": {
    "can_use_image": [
      "compx",
      ['vis_image_loaded', 'selected_image'],
      function(vis_image_loaded, selected_image) {
        return !!(vis_image_loaded && selected_image);
      }
    ]
  },

  'stch-selected_image': function(target, state) {
    var image_node = target.tpl.ancs['user-image'];
    image_node.src = '';
    if (state){
      var url = state.lfm_id ?
        'http://userserve-ak.last.fm/serve/64s/' + state.lfm_id : state.url;

      if (url.lastIndexOf('.gif') == url.length - 4){
        return;
      }
      var req = loadImage(target, {
        url: url,
        cache_allowed: true
      });
      req.then(function() {
        image_node[0].src = url;
        target.setVisState('image_loaded', true);
      });
      target.addRequest(req);
    }
  }
});

var FansList = spv.inh(View, {}, {
  children_views: {
    list_items: FanPreview
  }
});

var selected = spv.inh(View, {}, {
  children_views: {
    auth_part: coct.SoftVkLoginUI
  },
  'collch-auth_part': {
    place: 'tpl.ancs.auth_con',
  },
});

var SongcardController = spv.inh(View, {}, {
  "+states": {
    "disallow_seesu_listeners": [
      "compx",
      ['#disallow_seesu_listeners'],
      function(state) {
        return state;
      }
    ],

    "can_expand_listeners": [
      "compx",
      ['^vmp_show', 'artist_name', 'track_name', 'disallow_seesu_listeners', 'expanded'],
      function (vmp_show, artist_name, track_name, disallow_seesu_listeners, expanded) {
        return vmp_show && artist_name && track_name && expanded && !disallow_seesu_listeners;
      }
    ]
  },

  dom_rp: true,

  children_views:{
    artist: ArtcardUI.ArtistInSongConstroller,
    fans: FansList,
    selected: selected
  }
});
SongcardPage.SongcardController = SongcardController;

return SongcardPage;
});
