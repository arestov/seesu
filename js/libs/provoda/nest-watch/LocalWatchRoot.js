define(function(){
'use strict';

var lw_count = 0;
return function LocalWatchRoot(md, nwatch, data) {
    this.num = ++lw_count;
    this.selector = nwatch.selector;
    this.md = md;
    this.state_name = nwatch.state_name;
    this.short_state_name = nwatch.short_state_name;
    // this.itemChange = handler;

    this.ordered_items = null;
    this.ordered_items_changed = 0;
    this.one_item_mode = false;

    // this.state_handler = nwatch.state_handler;
    this.distance = 0;

    this.state_handler = nwatch.handle_state_change;
    // handle state change

    this.handler = nwatch.handle_count_or_order_change;
    // handle count/order change

    this.addHandler = nwatch.addHandler;
    this.removeHandler = nwatch.removeHandler;

    if (!this.handler) {
      // debugger;
    }

    this.data = data;
    // если есть state_name значит массив будет состоять не из моделей
    // а из состояния этих моделей с соостветствующим названим

    this.nwatch = nwatch;
  };
});
