// Press ctrl+space for code completion

var getPropName = function(node) {
  if (!node.key) {
    return;
  }
  return node.key.value || node.key.name;
};

var makeIndex = function(list) {
  var result = {};
  list.forEach(item => {
    var name = getPropName(item);
    result[name] = item;
  });
  return result;
};

export default function transformer(file, api) {
  const j = api.jscodeshift;
  return j(file.source)
    .find(j.Property)
    .forEach(path => {
      var prop_name = getPropName(path.value);
      if (prop_name !== "depends_on") {
        return;
      }

      var index = makeIndex(path.parentPath.value);
      if (!index.fn) {
        return;
      }

      j(path.parentPath.parentPath).replaceWith(j.arrayExpression([index.depends_on.value, index.fn.value]));

    })
    .toSource({wrapColumn: 35});
}
