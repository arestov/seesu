define(function (require) {
'use strict';

var spv = require('spv');

var subPageHeaded = function(Constr, head, key, getKey) {
  if (!key) {
    throw new Error('should be key');
  }

  return {
    key: key,
    constr: Constr,
    byType: null,
    can_be_reusable: null,
    head: head,
    getKey: getKey,
    getHead: head && spv.mmap({
      props_map: head
    })
  };
};

return function getSubpageItem(cur, key, byType) {
  var item;
  if (Array.isArray(cur)) {
    if (!cur[1] && !cur[2]) {
      /* EXAMPLE
      'sub_page-similar': [
        SimilarTags
      ]
      */
      throw new Error('keep code clean: use short `sub_page` declaration if you do not have special title');
      // instance = cur[0];
    } else {
      /* EXAMPLE
      'sub_page-similar': [
        SimilarTags,
        [
          ['locales.Tags', 'locales.Similar-to', 'tag_name'],
          function (tags, similar, name) {
            return similar + ' ' + name + ' ' + tags.toLowerCase();
          }
        ]
      ]
      */

      var instance = cur[1] ? spv.inh(cur[0], {}, {
        '+states': {
          nav_title: [
            'compx'
          ].concat(cur[1])
        }
      }) : cur[0];
      item = subPageHeaded(instance, cur[2], key);
    }
  } else if (typeof cur == 'object') {
    // semi compatibility (migration) mode

    /* EXAMPLE
    'sub_page-similar': {
      constr: SimilarTags,
      title: [[...]]
    }
    */

    if (!cur.constr.prototype.compx_check['nav_title'] && (!cur.title || typeof cur.title != 'object')) {
      // title should be. in array or object presentation
      throw new Error('keep code clean: use short `sub_page` declaration if you do not have special title');
    }

    var extend = {};
    if (cur.title) {
      extend['nav_title'] = ['compx'].concat(cur.title);
    }
    if (cur.reusable) {
      extend['$$reusable_url'] = ['compx'].concat(cur.reusable);
    }

    item = subPageHeaded(spv.inh(cur.constr, {
      skip_code_path: true
    }, {
      '+states': extend
    }), cur.head, key, cur.getKey);

    item.can_be_reusable = Boolean(cur.reusable);

  } else {
    /* EXAMPLE
    'sub_page-similar': SimilarTags
    */
    item = subPageHeaded(cur, null, key);
  }

  var prototype = item.constr.prototype;

  if (prototype['__required-nav_title'] && !prototype.compx_check['nav_title']) {
    throw new Error('sub_page shoud have `title`');
  }

  item.byType = Boolean(byType);

  return item;
};
});
