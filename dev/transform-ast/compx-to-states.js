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

var ge = {
  type: "Property",
  key: {
    type: "Literal",
    value: "+states"
  },
  computed: false,
  value: {
    type: "ObjectExpression",
    properties: []
  },
  kind: "init",
  method: false,
  shorthand: false
};

function copy(prop) {
  var copied = Object.assign({}, prop.value);

  copied = Object.assign(copied, {
    loc: null,
    start: null,
    end: null,
    range: null,
  });

  return copied;
}

function moveToContainer(j, prop) {
  var or_value= prop.value.value;



  var copied = copy(prop);
  var parent = prop.parentPath;

  if (!or_value.elements) {
    console.warn(copied.key.value, or_value);
  }


  var check = copied.key.value.replace("compx-", "");
  copied.key.value = check;

  if (copied.value.elements) {
    var new_value;
    new_value = [j.literal('compx')].concat(copied.value.elements);
    copied.value = j.arrayExpression(new_value)
  } else {
    var wrap_call = j.callExpression(j.memberExpression(j.arrayExpression([j.literal('compx')]), j.identifier('concat')), [or_value])
    wrap_call.comments = [j.commentLine('check this compx', true, false)];
    copied.value = wrap_call;
  }


  j(prop).remove();
  var container_presented = parent.value.filter(item => {

    return getPropName(item) == "+states";
  });
  container_presented = container_presented && container_presented[0];

  if (container_presented) {
    var new_props = [].concat(container_presented.value.properties, [copied]).filter(item => item);
    // j.objectExpression(new_props);
    // j(container_presented.value).replaceWith(j.objectExpression(new_props));

    container_presented.value = j.objectExpression(new_props);
    return;
  }

  container_presented = j.objectExpression([copied]);
  var b = Object.assign({}, ge);
  b.value = container_presented;
  var props = [b].concat(parent.value).filter(item => item);

  // parent.value = props;
  j(parent.parentPath).replaceWith(j.objectExpression(props));
}

export default function transformer(file, api) {
  const j = api.jscodeshift;
  var ast = j(file.source);

  var getList = () => {
    return ast.find(j.Property).filter((item => {
      if (!item.value.key.value || !item.value.key.value.startsWith("compx-")) {
        return false;
      }

      return true;
    }));
  }

  var handleItem = (path) => {
    if (!path.value.key.value || !path.value.key.value.startsWith("compx-")) {
      return false;
    }

    moveToContainer(j, path);
  };

  var items = getList();


  while (items.size()) {
    var part = items.at(0);
    part.forEach(handleItem);
    items = getList();
  }

    // .forEach(handleItem);

  return ast.toSource({ wrapColumn: 25 });
}
