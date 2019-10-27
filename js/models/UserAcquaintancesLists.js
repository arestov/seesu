define(function(require) {
'use strict';
var pv = require('pv');
var app_serv = require('app_serv');
var spv = require('spv');
var BrowseMap = require('js/libs/BrowseMap');

var pvUpdate = require('pv/update');
var UserAcquaintance = spv.inh(pv.Model, {
    init: function(target, opts, params) {
    target.sender = params.sender;
    target.user_photo = params.user_photo;
    target.receiver = params.sender;
    //target.current_user = params.current_user;
    target.remainded_date = params.remainded_date;
    pvUpdate(target, 'remainded_date', params.remainded_date);
    target.accepted = params.accepted;
    pvUpdate(target, 'user_info', params.info);
    pvUpdate(target, 'user_photo', params.user_photo);

    target.current_user_is_sender = params.current_user_is_sender;

    pvUpdate(target, 'current_user_is_sender', params.current_user_is_sender);
    pvUpdate(target, 'accepted', params.accepted);
  }
}, {
  "+states": {
    "userlink": [
      "compx",
      ['accepted', 'user_info'],
      function(accepted, user_info) {
        if (accepted){
          if (user_info && user_info.full_name && (user_info.domain || user_info.uid)){
            return {
              href: '#/users/vk:' + user_info.uid,
              text: user_info.full_name
            };
          }
        }
      }
    ],

    "after_accept_desc": ["compx", [
      'accepted', 'remainded_date', 'userlink',
      '#locales.wget-link', '#locales.attime', '#locales'
    ], function(
        accepted, remainded_date, userlink,
        lo_will_get, lo_time, locales
      ) {
      if (!lo_will_get || !lo_time || !locales) {return;}
      if (accepted && !userlink){
        var d = new Date(remainded_date);
        var lo_month = locales['m'+(d.getMonth()+1)];
        return app_serv.getRemainTimeText(d, true, lo_will_get, lo_month, lo_time);
      }

    }],

    "needs_accept_b": [
      "compx",
      ['accepted', 'current_user_is_sender'],
      function(accepted, current_user_is_sender) {
        if (!accepted && !current_user_is_sender){
          return true;
        }
      }
    ]
  },

  acceptInvite: function() {
    var _this = this;
    var su = this.app;
    su.s.api('relations.acceptInvite', {from: this.sender}, function(r){
      if (r.done){
        pvUpdate(_this, 'remainded_date', r.done.est);
        pvUpdate(_this, 'accepted', true);
        su.trackEvent('people likes', 'accepted', false, 5);

        if (new Date(r.done.est) < new Date()){
          su.s.susd.ri.getData();
          //checkRelationsInvites();
        }
      }
    });
  }
});

var UserAcquaintancesLists = spv.inh(BrowseMap.Model, {
  init: function(target) {
    target.app.on('state_change-su_server_api', function(e) {
      if (e.value){
        target.bindDataSteams();
      }
    });
  }
}, {
  "+states": {
    "current_user": ["compx", ['#su_userid']],

    "wait_me_desc": [
      "compx",
      ['@every:accepted:acqs_from_someone', '#locales.if-you-accept-one-i', '#locales.will-get-link'],
      function(not_wait_me, accept_desc, get_desc) {
        if (!not_wait_me && accept_desc && get_desc){
          return accept_desc + ' ' + get_desc;
        }
      }
    ],

    "wait_someone_desc": [
      "compx",
      ['@every:accepted:acqs_from_me'],
      function(not_wait_someone, accept_desc, get_desc) {
        if (!not_wait_someone && accept_desc && get_desc){
          return accept_desc + ' ' + get_desc;
        }

      }
    ]
  },
  'nest_rqc-acqs_from_someone': UserAcquaintance,
  'nest_rqc-acqs_from_me': UserAcquaintance,

  sub_pager: {
    item: [
      UserAcquaintance,
      [[]],
      {
        search_name: 'decoded_name'
      }
    ]
  },
  model_name: 'user_acqs_list',

  bindDataSteams: function() {
    if (this.data_st_binded){
      return;
    }
    this.data_st_binded = true;
    var _this = this;
    this.app.s.susd.rl.regCallback('user_acqes', function(r){
      _this.replaceChildrenArray('acqs_from_me', r.done);
    });
    this.app.s.susd.ri.regCallback('user_acqes', function(r){
      _this.replaceChildrenArray('acqs_from_someone', r.done);
    });
  },

  replaceChildrenArray: function(array_name, new_array) {
    if (!this.state('current_user')){
      throw new Error('there is no current_user!');
    }

    var filtered = spv.filter(new_array, 'item.accepted', function(v){
      return !!v;
    });

    var concated = [].concat(filtered, filtered.not);

    for (var i = 0; i < concated.length; i++) {
      var cur = concated[i];
      var key = cur.item.from + '-' + cur.item.to;

      var user_acq = this.getSPI(key);
      user_acq.updateManyStates({
        current_user_is_sender: this.state('current_user') == cur.item.from,
        sender: cur.item.from,
        receiver: cur.item.to,
        sended_date: cur.item.ts,
        accepted_date: cur.item.ats,
        remainded_date: cur.item.est,
        accepted: cur.item.accepted,
        info: cur.info,
        user_photo: cur.info && cur.info.photo
      })

      concated[i] = user_acq;
    }
    // this.removeChildren(array_name);

    pv.updateNesting(this, array_name, concated);

  },

  // removeChildren: function(array_name) {
  //   var array = this.getNesting(array_name) || [];
  //   for (var i = 0; i < array.length; i++) {
  //     array[i].die();
  //   }
  // }
});
return UserAcquaintancesLists;
});
