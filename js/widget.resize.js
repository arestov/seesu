window.resizeWindow = function(w){
  var d = w.document;

  spv.domReady(d, function(){
    var wb = d.getElementById('wb');
    if (!wb) {return false;}
    var resz_b = d.createElement('img');
      resz_b.src="i/resize.png"; resz_b.id='resize-handle'; resz_b.alt='/';
    wb.appendChild(resz_b);

    var body = d.body;


    var old_win_height = w.innerHeight;
    w.resizeTo(610,old_win_height );
    var size_shift = old_win_height - w.innerHeight;

    var save_size = function(){
      app_serv.store('width', w.innerWidth, true);
      app_serv.store('height', w.innerHeight, true);

    }
    var drag = function(e0, x, y) {
      e0.preventDefault(); // Prevent text selection

      var width0 = width;
      var height0 = height;

      var mousemove = function (e1) {
        if (x === 1) {
        width = Math.round(Math.min(screen.availWidth, e1.clientX/e0.clientX*width0));
        }
        if (y === 1) {
        height = Math.round(Math.min(screen.availHeight, e1.clientY/e0.clientY*height0));
        }

        if (!timeout) {
        timeout = setTimeout(resizeWindow, 1);
        }
      };
      var mouseup = function (e) {
      spv.removeEvent(d, 'mousemove', mousemove);
      spv.removeEvent(d, 'mouseup', mouseup);
      }

      spv.addEvent(d, 'mousemove', mousemove);
      spv.addEvent(d, 'mouseup',   mouseup);




    };
    var resize_body = function(new_body_height){
      if (typeof new_body_height === 'number'){
        body.style.height = height + 'px';
      } else{
        var _win_height = w.innerHeight;

        body.style.height = _win_height + 'px';
      }
    }



    function widgetResize(width, height) {
      resize_body(height);
      w.resizeTo(width, height + size_shift);



    }
    var min_width = 640;
    var min_height = 610;


    var width = parseFloat(app_serv.store('width')) || min_width;
    var height = parseFloat(app_serv.store('height')) || min_height;

    var timeout = 0;
    function resizeWindow() {
      timeout = 0; // clearit.
      width = Math.max(width, min_width);
      height = Math.max(height, min_height);

      widgetResize(width, height);
    }


    spv.addEvent(w, "resize", spv.debounce(save_size, 500));

    spv.addEvent(resz_b, "mousedown", function(e) {
      drag(e, 1, 1);
    });

    resizeWindow();

  });

  return true;
};
window.window_resized = resizeWindow(window);
