define(function(require) {
"use strict";
var $ = require('jquery');
var FuncsStack = require('js/libs/FuncsStack');
var spv = require('spv');
var pv = require('pv');
var Mp3Search = require('js/models/Mp3Search/index');
/*
var trackers = ["udp://tracker.openbittorrent.com:80",
          'udp://tracker.ccc.de:80',
          'udp://tracker.istole.it:80',
          //'udp://tracker.istole.it:6969',
          "udp://tracker.publicbt.com:80"];*/
var torrents_manager = require('./nodejs/troxent2');
var engine_opts = {
  connections: 23,
//	trackers: trackers,
  prevalidate: function(info) {
    if (info.files && info.files.length > 420) {
      return 'too much files in torrent';
    }
  }
};

var disallowed_links = {};

var FileNameSQMatchIndex = function(file, query) {
  this.trim_index = null;
  //this.filename = file.filename;

  this.under_consideration = {
    filename: file.filename,
    filepath: file.torrent_path,
    torrent_name: file.torrent_name
  };
  //filename.split(/\//);
  this.query = query;
  this.query_string = this.toQueryString(this.query);
  this.match_order = [this.matchers.bestMatch, this.matchers.anyGood];
  this.match();
};
Mp3Search.QueryMatchIndex.extendTo(FileNameSQMatchIndex, {
  init: function(file, query) {

    return this;
  },
  matchers: {
    bestMatch: function(file, query) {

    },
    almostMatch: function(file, query) {
      //если имя артиста в названиях папоп, а имя композиции совпадает с именем файла без порядкового номера
    },
    /*
    anyGood: function(filename, query) {
      if (filename.indexOf(query.artist) != -1 && filename.indexOf(query.track) != -1){
        return 0;
      }
    }
    */
    anyGood: function(file, query) {
      /*
      FIXME use hardTrimLimited instead of this.hardTrim;




      */

      var artist_match = file.filepath.indexOf(query.artist) != -1 || file.torrent_name.indexOf(query.artist) != -1;
      if (artist_match) {
        if ( file.filename.indexOf(query.track) != -1) {
          return 0;
        } else {
          var query_track = this.hardTrim(query.track, 3);
          if (this.hardTrim(file.filename, 3).indexOf(query_track) != -1) {
            return 5;
          }
        }
      } else {
        var query_artist = this.hardTrim(query.artist, 3);
        var artist_match = this.hardTrim(file.filepath, 3).indexOf(query_artist) != -1 || this.hardTrim(file.torrent_name, 3).indexOf(query_artist) != -1;
        var query_track = this.hardTrim(query.track, 3);
        if (artist_match && this.hardTrim(file.filename, 3).indexOf(query_track) != -1) {
          return 5;
        } else {
          if (file.filename.indexOf(query.track) != -1) {
            console.log(file);
          }
        }


      }
    }
  }
});

var getTorrentFile = function(raw, torrent, torrent_api) {
  return {
    from: 'btdigg',
    title: raw.name,
    filename: raw.name,
    torrent_name: torrent.name,
    torrent_path: raw.path,
    description: [torrent.name, torrent.infoHash + '\n', raw.path].join(', '),
    page_link: 'http://btdigg.org/search?info_hash=' + torrent.infoHash,
    media_type: 'mp3',
    link: raw.link,
    models: {},
    api: raw,
    getSongFileModel: function() {
      var md = Mp3Search.getSongFileModel.apply(this, arguments);
      pv.update(md, 'title', this.title);
      md.wlch(torrent_api, 'progress_info');

      md.on('state_change-load_file', function(e) {
        torrent_api.setStateDependence('file_data-for-song_file', md, e.value);
      });
      return md;
    }
  };
};
var isDepend = pv.utils.isDepend;

var Torrent = function() {};
pv.Model.extendTo(Torrent, {
  init: function(opts, data) {
    this._super();
    this.queue = opts.queue;
    this.remove_timeout = null;
    this.troxent = null;
    this.updateManyStates(data);
  },
  'compx-torrent_required': [
    ['file_data-for-song_file', 'list_loaded', 'files_list-for-search', 'invalid'],
    function(file_data, list_loaded, files_list, invalid) {
      if (invalid) {return false;}
      return isDepend(file_data) || (!list_loaded && isDepend(files_list));
    }
  ],
  'state-progress_info': [
    'troxent',
    function(update, troxent) {
      var swarm;

      var progresInfo = function() {
        update({
          total_peers:  (troxent.swarm && troxent.swarm.numPeers) || 0.1
        });
      };
      update({
        total_peers:  (troxent.swarm && troxent.swarm.numPeers) || 0.1
      });


      var gotHash = function() {
        swarm = troxent.swarm;
        swarm.on('numPeers', progresInfo);

        update({
          total_peers:  (troxent.swarm && troxent.swarm.numPeers) || 0.1
        });
      };

      troxent.on('infoHash', gotHash);


      return function() {
        troxent.removeListener('infoHash', gotHash);
        if (swarm) {
          swarm.removeListener('numPeers', progresInfo);
        }
      };
    }
  ],
  /*'state-progress_info': [
    'troxent',
    function(update, troxent) {

      this.onProgress = function(data) {
        pv.update(_this, 'progress_info', data);
      };


      _this.troxent.on('progress_info-change', _this.onProgress);
    }
  ],*/
  'state-invalid': [
    'troxent',
    function (update, troxent) {
      var validateError = function(error){
        update(error);
      };
      troxent.on('prevalidation-error', validateError);
      return function() {
        troxent.removeListener('prevalidation-error', validateError);
      };
    }
  ],
  'stch-invalid': function(target, state) {
    if (state) {
      disallowed_links[target.state('url')] = true;
    }
  },
  'state-files_list_raw': [
    'troxent',
    function (update, troxent) {
      var hndList = function(list) {

        update(list);
      };
      troxent.on('served-files-list', hndList);
      return function() {
        troxent.removeListener('served-files-list', hndList);
      };
    }
  ],
  'compx-files_list': [
    ['files_list_raw'],
    function (list) {
      if (!this.files_cache) {
        this.files_cache = {};
      }
      var files_cache = this.files_cache;
      var md = this;
      var getItem = function(el, i) {
        if (!files_cache[i]) {
          files_cache[i] = getTorrentFile(el, md.troxent.parsedTorrent, md);
        }
        return files_cache[i];
      };
      var result = list && list.map(getItem);
      return result;
    }
  ],
  'state-list_loaded': [
    'troxent',
    function (update, troxent) {
      var hndList = function(list) {
        update(!!list && true);
      };
      troxent.on('served-files-list', hndList);
      return function() {
        troxent.removeListener('served-files-list', hndList);
      };
    }
  ],
  'stch-torrent_required': function(target, state) {
    if (state ) {
      clearTimeout(target.remove_timeout);
      target.remove_timeout = null;
      if (!target.troxent && !target.queued) {
        target.queued = target.queue.add(function() {
          //torrents_manager.get(target.state('url'));
          //_this.troxent = true;
          target.troxent = torrents_manager.get(target.state('url'));
          target.useInterface('troxent', target.troxent);
          target.queued = null;
        });
      }
    } else {
      if (target.troxent && !target.remove_timeout) {
        target.remove_timeout = setTimeout(function() {
          target.destroyPeerflix();
        }, 7000);
      }
    }
  },
  destroyPeerflix: function() {
    this.useInterface('troxent', null);
    if (this.queued) {
      this.queued.abort();
      this.queued = null;
    }
    if (!this.troxent) {
      return;
    }

    torrents_manager.remove(this.state('url'), this.troxent);
    //this.troxent.destroy();
    this.troxent = null;
  }
});




var QueriedFileInTorrent = function(){};
pv.Model.extendTo(QueriedFileInTorrent, {
  model_name: 'file-torrent-promise',
  getSongFileModel: function() {
    return this;
  },
  'state-all_files': [
    'torrent',
    function(update, torrent) {
      var listen = function(e) {
        if (!e.value) {return;}
        update(e.value);
      };
      torrent.on('state_change-files_list', listen);
      return function() {
        torrent.off('state_change-files_list', listen);
      };
    }
  ],
  'compx-matched_files': [
    ['all_files', 'msq'],
    function (array, msq) {
      if (!array || !msq) {return;}
      var filtered = [];
      for (var i = 0; i < array.length; i++) {
        if (!array[i].filename.match(/\.mp3$/)) {
          continue;
        }
        var qmi = Mp3Search.setFileQMI(array[i], msq, FileNameSQMatchIndex);
        if (qmi != -1) {
          filtered.push( array[i] );
        }
      }
      return filtered;
    }
  ]
});

var push = Array.prototype.push;

var TorrentQuery = function(){};
pv.Model.extendTo(TorrentQuery, {
  init: function(opts, data, params){
    this._super.apply(this, arguments);
    this.updateManyStates(data);
  },
  'compx-@items': [
    ['@matched_files:queries', '@queries'],
    function (values, list) {
      if (!list) {return;}
      var good = [];
      var unknown = [];
      list.forEach(function(el, i){
        if (values && values[i] && values[i].length) {
          push.apply(good, values[i]);
        } else {
          unknown.push(list[i]);
        }
      });
      push.apply(good, unknown);
      return good;

    }
  ]

});

var TorqueSearch = function(opts) {
  var _this = this;
  this.queue = opts.queue;
  this.mp3_search = opts.mp3_search;
  this.torrent_search = opts.torrent_search;
  this.search = function() {
    return _this.findAudio.apply(_this, arguments);
  };
};
TorqueSearch.prototype = {
  name: "btdigg-torrents",
  s: {
    name:"Torque torrents",
    key:0,
    type: "mp3"
  },
  constructor: TorqueSearch,
  findAudio: function(msq, opts) {
    var
      core = this,
      deferred = $.Deferred(),
      complex_response = {
        abort: function(){
          //this.aborted = true;
          deferred.reject('abort');
          //if (this.queued){
          //	this.queued.abort();
        //	}
        //	if (this.xhr){
        //		this.xhr.abort();
        //	}
        }
      };
    deferred.promise(complex_response);

    //запросить troxent

    var push = Array.prototype.push;
    FuncsStack.chain([
      function() {
        var chain_link = this;
        var req = core.torrent_search
        .findAudio(msq);

        req.then(function(r) {
          chain_link.completePart(r);
        }, function() {
          deferred.reject();
        });
        //find torrents
      },
      function(links_list) {
        var answer_model = pv.create(TorrentQuery);

        var timeout = setTimeout(function() {
          pv.update(answer_model, 'query_complete', true);
        }, 1.2 * 60 * 1000);

        var arrays = [];


        var queries = [];
        links_list.slice(0, 6).forEach(function(el) {
          if (disallowed_links[el.torrent_link]) {
            return;
          }
          var obj = {
            items: null
          };
          arrays.push(obj);

          var torrent_obj = torrents_manager.parse(el.torrent_link);

          var torrent = new Torrent();
          torrent.init({
            queue: core.queue
          }, {
            url: el.torrent_link,
            torrent_obj: torrent_obj,
            infoHash: torrent_obj.infoHash
          });

          var query = pv.create(QueriedFileInTorrent, {
            link: el.torrent_link,
            torrent_obj: torrent_obj,
            infoHash: torrent_obj.infoHash,
            msq: msq
          }, {
            interfaces: {
              torrent: torrent
            }
          });

          queries.push(query);

          opts.bindRelation(function(e) {
            torrent.setStateDependence('files_list-for-search', e.target, !!e.value);
            //pv.update(torrent, 'must_load_list', e.value);
          });
        });
        answer_model.updateNesting('queries', queries);

        if (!links_list.length) {
          pv.update(answer_model, 'query_complete', true);
        }

        deferred.resolve(answer_model);
      }
    ]);






    return complex_response;
  }
};

return TorqueSearch;
});
