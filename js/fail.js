var fail = function (arg) {
  if (typeof arg !== "object" || typeof arg.content !== "string")
    return false;
  var exit = function (fn) {
    var hm = $('<div/>').addClass('fail-hm').hide();
    $('.fail-list').html('').addClass('fail-loading').before(hm);
    hm.fadeIn(1000);
    setTimeout(function () {
      $('.fail-title').remove();
      $(arg.content).removeClass('fail');
      $('body').removeClass('no-color');
    }, 1000)
    setTimeout(function () {
      fn && fn();
      $('.fail-list').remove();
      hm.fadeOut(500);
      setTimeout(function () {
        hm.remove();
      }, 500)
    }, 1000)
  }
  $(arg.content).addClass('fail');
  $('body').addClass('no-color');
  var fdv = $('<div/>').addClass('fail-title');
  var tit = $('<div/>').addClass('title').html(arg.title || 'wasted');
  typeof arg.color === "string" && tit.css('color', arg.color);
  fdv.append(tit);
  if (typeof arg.subtitle === "string") {
    var sub = $('<div/>').addClass('subtitle').html(arg.subtitle);
    fdv.append(sub);
  } else {
    tit.addClass('single')
  }
  $('body').append(fdv);
  setTimeout(function () {
    fdv.show();
  }, 2000);
  setTimeout(function () {
    var s = $('<div/>').addClass('fail-list');
    var bts = [];
    if (typeof arg.button === "object") {
      for (var i = 0; i < arg.button.length; i++) {
        (function () {
          var id = i;
          var tmp = $('<div/>').addClass('item').html(arg.button[i]);
          tmp.click(function () {
            exit(function () {
              typeof arg.callback === "function" && arg.callback(id);
            })
          })
          s.append(tmp);
        })();
      }
    }
    $('body').append(s);
  }, 5000)
}