define(function(require) {
"use strict";
var invstg = require('../invstg');
var comd = require('../comd');
var pv = require('pv');
var pvUpdate = require('pv/update');
var spv = require('spv');
var SongActPlaylisting;

var playlistSuggest = spv.inh(invstg.BaseSuggest, {
  init: function(self, opts, data) {
    self.pl = data.playlist;
    self.mo = data.mo;
    self.rpl = data.rpl;
    self.text_title = self.getTitle();
    pvUpdate(self, 'text_title', self.text_title);
  }
}, {
  valueOf: function(){
    return this.pl.state('nav_title');
  },
  onView: function(){
    this.pl.add(this.mo);
    this.rpl.hide();
  }
});

var PlaylistRSSection = spv.inh(invstg.SearchSection, {}, {
  resItem: playlistSuggest,
  model_name: "section-playlist"
});


var PlaylistRowSearch = spv.inh(invstg.Investigation, {
  init: function(self) {
    self.rpl = self.map_parent;
    self.mo = self.rpl.mo;
  }
}, {
  skip_map_init: true,
  'nest-section': [[PlaylistRSSection]],
  searchf: function() {
    var
      pl_results = [],
      pl_sec = this.g('section-playlist');
    if (!pl_sec) {
      return;
    }
    pl_sec.setActive();
    pl_sec.changeQuery(this.q);


    var serplr = this.app.getPlaylists(this.q);
    if (serplr.length){
      for (var i = 0; i < serplr.length; i++) {
        pl_results.push({
          playlist: serplr[i],
          mo: this.mo,
          rpl: this.rpl
        });
      }
    }

    pl_sec.appendResults(pl_results, true, true);
  }
});




SongActPlaylisting = spv.inh(comd.BaseCRow, {
  init: function(target){
    target.mo = target.map_parent.map_parent;
    target.app.gena.on('child_change-lists_list', target.checkFullMatch, target.getContextOpts());
  }
}, {
  actionsrow_src: '^',
  'nest-searcher': [PlaylistRowSearch],
  model_name: 'row-playlist-add',
  search: function(q) {
    pvUpdate(this, 'query', q);
    var searcher = this.getNesting('searcher');
    if (searcher) {
      searcher.changeQuery(q);
    }


    this.checkFullMatch();

  },

  checkFullMatch: function() {
    var current_query = this.state('query');
    pvUpdate(this, 'has_full_match', current_query && !!this.app.gena.matchTitleStrictly(current_query));
  },
  findAddPlaylist: function() {
    var current_query = this.state('query');
    if (current_query){
      this.app.gena.findAddPlaylist(current_query, this.mo);
    }
    this.hide();
    pvUpdate(this, 'query', '');
    this.getNesting('searcher').changeQuery('');
    this.checkFullMatch();
  }
});
return SongActPlaylisting;
});
