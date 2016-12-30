define(function () {
'use strict';
return function (probe_name) {
  return '__run_probe_' + probe_name;
};
});
