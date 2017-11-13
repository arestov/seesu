define(function () {
'use strict';
var push = Array.prototype.push;
var reusable_array = [];

return function orderItems(lnwatch) {
  if (!lnwatch.ordered_items_changed) {return;}
  lnwatch.ordered_items_changed = false;

  reusable_array.length = 0;
  for (var prop in lnwatch.model_groups) {
    var cur = lnwatch.model_groups[prop];
    reusable_array.push(cur);
  }

  reusable_array.sort(compareComplexOrder);

  var result = lnwatch.ordered_items || [];
  result.length = 0;
  for (var i = 0; i < reusable_array.length; i++) {
    var cur = reusable_array[i];
    if (cur.models_list) {
      push.apply(result, cur.models_list);
    }
  }

  reusable_array.length = 0;
  lnwatch.ordered_items = result;
};

function compareComplexOrder(item_one, item_two) {
  var cur_one = item_one;
  var cur_two = item_two;

  while (cur_one || cur_two) {
    var num_one = cur_one && cur_one.position;
    var num_two = cur_two && cur_two.position;

    if (typeof num_one == 'undefined' && typeof num_two == 'undefined'){
      // should not be possible
      return;
    }
    if (typeof num_one == 'undefined'){
      // should not be possible
      // __[1, 2] vs [1, 2, 3] => __[1, 2], [1, 2, 3]
      return -1;
    }
    if (typeof num_two == 'undefined'){
      // should not be possible
      // __[1, 2, 3] vs [1, 2] => [1, 2], __[1, 2, 3]
      return 1;
    }
    if (num_one > num_two){
      return 1;
    }
    if (num_one < num_two){
      return -1;
    }

    cur_one = cur_one.parent;
    cur_two = cur_two.parent;
  }
}

});
