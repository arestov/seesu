define(function () {
'use strict';
return function standart(callback) {
  return function standart(motivator, fn, lnwatch, args) {
    var md = lnwatch.md;
    var old_value = md.current_motivator;
    md.current_motivator = motivator;

    var one_item = lnwatch.one_item_mode && (lnwatch.ordered_items && lnwatch.ordered_items[0]);

    var items = lnwatch.one_item_mode ? ( lnwatch.state_name ? [one_item] : one_item ) : lnwatch.ordered_items;

    callback(md, items, lnwatch, args, motivator, fn);

    md.current_motivator = old_value;
  };
};
});
