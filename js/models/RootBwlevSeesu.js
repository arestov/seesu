define(function(require) {
'use strict';
var SearchQueryModel = require('./SearchQueryModel');
var FakeSpyglass = require('./FakeSpyglass');

return {
  "+states": {
    "show_search_form": [
      "compx",
      ['@one:needs_search_from:selected__md'],
      function(needs_search_from) {
        return needs_search_from;
      }
    ]
  },
  'nest-search_criteria': [SearchQueryModel],
  'nest-fake_spyglass': [FakeSpyglass],
}
});
