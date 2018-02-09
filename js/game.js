;(function () {
  var c = 0
  var e = ["webkit", "moz"]
  for (var a = 0; a < e.length && !window.requestAnimationFrame; ++a) {
    window.requestAnimationFrame = window[e[a] + "RequestAnimationFrame"]
    window.cancelAnimationFrame = window[e[a] + "CancelAnimationFrame"] || window[e[a] + "CancelRequestAnimationFrame"]
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (y) {
      var h = new Date().getTime()
      var w = Math.max(0, 16.7 - (h - c))
      var x = window.setTimeout(function () {
        y(h + w)
      }, w)
      c = h + w
      return x
    }
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (h) {
      clearTimeout(h)
    }
  }
})();

var start_game = function (H = 700, W = 1000) {
  var canvas = document.getElementById('canvas')
  var ctx = canvas.getContext('2d')
  canvas.height = H
  canvas.width = W
  var clear = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
  var ctc = function (v1, v2, v3, v4) {
    return v1 * v4 - v2 * v3;
  }
  // 判断两线段是否香♂蕉
  var check = function (aax, aay, bbx, bby, ccx, ccy, ddx, ddy) {
    var delta = ctc(bbx - aax, ccx - ddx, bby - aay, ccy - ddy);
    if (!delta)
      return false;
    var namenda = ctc(ccx - aax, ccx - ddx, ccy - aay, ccy - ddy) / delta;
    if (namenda > 1 || namenda < 0)
      return false;
    var miu = ctc(bbx - aax, ccx - aax, bby - aay, ccy - aay) / delta;
    if (miu > 1 || miu < 0)
      return false;
    return true;
  }

  var go_into = function (stx, sty, edx, edy, ba, bb, bc, bd) {
    return (
      check(stx, sty, edx, edy, ba, bb, ba + bc, bb) || // up
      check(stx, sty, edx, edy, ba, bb, ba, bb + bd) || // left
      check(stx, sty, edx, edy, ba + bc, bb + bd, ba + bc, bb) || // right
      check(stx, sty, edx, edy, ba + bc, bb + bd, ba, bb + bd))   // bottom
  }

  var px = -100, py = -100
  var game_started = false
  var gaming = false
  var title = 'Connecting'
  var playerlist = undefined
  var die = false
  var rspx = 200, rspy = 500

  var draw_cursor = function (px, py, color) {
    ctx.fillStyle = color || 'rgba(108, 18, 202, .5)'
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px, py + 15)
    ctx.lineTo(px + 5, py + 10)
    ctx.lineTo(px + 11, py + 10)
    ctx.lineTo(px, py)
    ctx.fill()
    ctx.closePath()
  }
  var lava = [[20, 20, 100, 100], [125, 20, 10, 100], [400, 250, 100, 120], [510, 250, 100, 120], [400, 100, 20, 150], [590, 100, 20, 150], [420, 100, 170, 20]]
  var wall = [[50, 50, 10, 500], [70, 50, 10, 500], [150, 450, 100, 100], [260, 450, 100, 100], [150, 560, 210, 20]]
  var draw_lava = function () {
    for (var i = 0; i < lava.length; i++) {
      ctx.fillStyle = 'rgba(241, 63, 63, .5)'
      ctx.fillRect(lava[i][0], lava[i][1], lava[i][2], lava[i][3])
    }
  }
  var draw_wall = function () {
    for (var i = 0; i < wall.length; i++) {
      ctx.fillStyle = 'rgba(0, 0, 0, .5)'
      ctx.fillRect(wall[i][0] - 1, wall[i][1] - 1, wall[i][2] + 2, wall[i][3] + 2)
    }
  }
  var run = function (time) {
    clear()
    if (game_started) {
      draw_lava()
      draw_wall()
      if (playerlist) {
        for (var key in playerlist) {
          if (key != 'self' && key != playerlist.self) {
            value = playerlist[key]
            draw_cursor(value.px, value.py)
          }
        }
      }
      draw_cursor(px, py, 'rgba(108, 18, 202, .9)')
    } else {
      ctx.fillStyle = "#666666"
      ctx.font = "32px 'Courier New'"
      ctx.textAlign = 'center'
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 100)
    }
    window.requestAnimationFrame(run)
  }
  var pointerLockChange = function () {
    gaming = !gaming
  }
  document.addEventListener('pointerlockchange', pointerLockChange, false);
  document.addEventListener('mozpointerlockchange', pointerLockChange, false);
  document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  canvas.addEventListener('click', function (e) {
    if (gaming || die)
      return;
    canvas.requestPointerLock =
      canvas.requestPointerLock    ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock
    canvas.requestPointerLock()
    if (!game_started) {
      px = rspx
      py = rspy
      game_started = true
    }
  })

  var ws = new WebSocket('ws://10.176.20.73:18465')
  ws.onopen = function (e) {
    title = 'Click To Start'
  };
  ws.onmessage = function (e) {
    var [op, val] = e.data.split('|')
    if (op === 'upd') {
      playerlist = JSON.parse(val)
    } else if (op === 'pjn') {
      if (val == playerlist.self) return
      else playerlist[val] = {px: rspx, py: rspy}
    } else if (op === 'pft') {
      delete playerlist[val]
    } else if (op === 'pch') {
      var [id, x, y] = val.split(',').map(x => parseInt(x))
      playerlist[id].px = x
      playerlist[id].py = y
    }
  };
  ws.onclose = function (e) {
    game_started = false
    title = "Lost Connection";
  };

  canvas.addEventListener('mousemove', function (e) {
    if (!gaming || die)
      return;
    var rx = px, ry = py
    px += e.movementX
    if (px > W) px = W
    if (px < 0) px = 0
    py += e.movementY
    if (py > H) py = H
    if (py < 0) py = 0
    
    var into_wall = []
    for (var i = 0; i < wall.length; i++) {
      if (go_into(rx, ry, px, py, wall[i][0], wall[i][1], wall[i][2], wall[i][3]))
        into_wall.push(i)
    }

    if (into_wall.length) {
      var l = W, r = 0, t = H, b = 0;
      for (var s = 0; s < into_wall.length; s++) {
        l = Math.min(l, wall[into_wall[s]][0]);
        r = Math.max(r, wall[into_wall[s]][0] + wall[into_wall[s]][2]);
        t = Math.min(t, wall[into_wall[s]][1]);
        b = Math.max(b, wall[into_wall[s]][1] + wall[into_wall[s]][3]);
      }
      // console.log(`l = ${l}, r = ${r}, t = ${t}, b = ${b}`)
      // console.log(`rx = ${rx}, ry = ${ry}, px = ${px}, py = ${py}`)
      if (rx < l && l <= px)
        px = l - 1;
      if (rx > r && r >= px)
        px = r + 1;
      if (ry < t && t <= py)
        py = t - 1;
      if (ry > b && b >= py)
        py = b + 1;
    }

    for (var i = 0; i < lava.length; i++) {
      if (go_into(rx, ry, px, py, lava[i][0], lava[i][1], lava[i][2], lava[i][3]))
        die = true
    }

    if (die) {
      fail({
        content: '#canvas',
        title: 'wasted',
        subtitle: 'You submitted suicided.',
        button: ['复活'],
        callback: function () {
          px = rspx, py = rspy
          ws.send(px + ',' + py)
          canvas.requestPointerLock()
          die = false
        }
      })
      document.exitPointerLock()
      ws.send('-100,-100')
    } else {
      ws.send(px + ',' + py)
    }
  })
  run()
}