define(function(require) {
'use strict';
var View= require('View');
var spv = require('spv');

return function createRootBwlevView (RootView) {
  return spv.inh(View, {}, {
    resortQueue: function() {
      return function (queue) {
        if (queue){
          queue.removePrioMarks();
        } else if (this.all_queues)  {
          for (var i = 0; i < this.all_queues.length; i++) {
            this.all_queues[i].removePrioMarks();
          }
        }

        if (this.important_bwlev_view){
          this.important_bwlev_view.setPrio();
        }
      };
    },
    'collch-pioneer': true,
    children_views: {
      pioneer: RootView
    }
  });
};
});
