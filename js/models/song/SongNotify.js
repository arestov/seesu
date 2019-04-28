define(function(require) {
'use strict'
var pvUpdate = require('pv/update');
var spv = require('spv');
var NotifyCounter = require('./NotifyCounter')

return spv.inh(NotifyCounter, {}, {
  '+effects': {
    api: {
      "sf_notf": [
        ['_provoda_id'],
        ['#notf'],
        function(notf) {
          return notf.getStore('song-files');
        }
      ],
    },
    'produce': {
      "banMessage": {
        api: ["self", "sf_notf"],
        trigger: ["_provoda_id"],
        require: "_provoda_id",
        fn: function(self, sf_notf) {
          var rd_msgs = sf_notf.getReadedMessages();
          for (var i = 0; i < rd_msgs.length; i++) {
            self.banMessage(rd_msgs[i]);
          }

          sf_notf.on('read', self.hndNtfRead, self.getContextOpts());
        }
      },
      "playerReadyness": {
        api: ["self", '#player'],
        trigger: ["_provoda_id"],
        require: "_provoda_id",
        fn: function(self, player) {
            player
              .on('core-fail', self.hndPCoreFail, self.getContextOpts())
              .on('core-ready', self.hndPCoreReady, self.getContextOpts());
        }
      }
    }
  },
  hndPCoreFail: function() {
    pvUpdate(this, 'cant_play_music', true);
    this.addMessage('player-fail');
  },

  hndPCoreReady: function() {
    pvUpdate(this, 'cant_play_music', false);
    this.banMessage('player-fail');
  },
  hndNtfRead: function(message_id) {
    this.banMessage(message_id);
  },
})
})
