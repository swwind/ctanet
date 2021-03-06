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

var start_game = function (name, H = 700, W = 1000) {
  var canvas = document.getElementById('canvas')
  var ctx = canvas.getContext('2d')
  canvas.height = H
  canvas.width = W
  name = name || 'unnamed'

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
  var connect_lost = false
  var rspx = 50, rspy = 50
  var lava = [[140, 70, 840, 50], [140, 0, 840, 50]]
  var wall = [[100, 0, 20, 100], [0, 120, 980, 20]]

  var draw_cursor = function (px, py, name) {
    name = name || 'unnamed'
    ctx.fillStyle = 'rgba(108, 18, 202, .9)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px, py + 15)
    ctx.lineTo(px + 4, py + 10)
    ctx.lineTo(px + 11, py + 10)
    ctx.lineTo(px, py)
    ctx.fill()
    ctx.closePath()
    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(0, 0, 0, .9)'
    ctx.font = '16px sao'
    ctx.textAlign = 'center'
    ctx.strokeText(name, px + 2, py - 10)
    ctx.fillStyle = 'rgba(255, 255, 255, .9)'
    ctx.font = '16px sao'
    ctx.textAlign = 'center'
    ctx.fillText(name, px + 2, py - 10)

  }
  var draw_lava = function () {
    for (var i = 0; i < lava.length; i++) {
      ctx.fillStyle = 'rgba(241, 100, 100, .5)'
      ctx.fillRect(lava[i][0], lava[i][1], lava[i][2], lava[i][3])
    }
  }
  var draw_wall = function () {
    for (var i = 0; i < wall.length; i++) {
      ctx.fillStyle = 'rgb(127, 127, 127)'
      ctx.fillRect(wall[i][0], wall[i][1], wall[i][2], wall[i][3])
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
            draw_cursor(value.px, value.py, value.name)
          }
        }
      }
      draw_cursor(px, py, name)
    } else {
      ctx.fillStyle = "#666666"
      ctx.font = "32px 'Courier New'"
      ctx.textAlign = 'center'
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 100)
    }
    window.requestAnimationFrame(run)
  }
  var pointerLockChange = function () {
    gaming = !!document.pointerLockElement
  }
  document.addEventListener('pointerlockchange', pointerLockChange, false);
  document.addEventListener('mozpointerlockchange', pointerLockChange, false);
  document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  canvas.addEventListener('click', function (e) {
    if (gaming || die || connect_lost)
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

  var GET = {}
  window.location.href.replace(/^[^\?]*\?/gi, '').split('&').map(x => {
    const [key, value] = x.split('=')
    GET[key] = value
  })
  var ip = GET['ip'] || window.location.hostname

  var ws = new WebSocket(`ws://${ip}:18465`)
  ws.onopen = function (e) {
    title = 'Click To Start'
    ws.send(`pjn|${name}`)
  };
  ws.onmessage = function (e) {
    let tmp = e.data.split('|')
    let op = tmp[0], val = tmp.slice(1).join('|')
    if (op === 'upd') {
      playerlist = JSON.parse(val)
    }
    if (op === 'pjn') {
      var id = val.split(',')[0]
      var name = val.replace(/^\d+,/g, '')
      if (id == playerlist.self) return
      else playerlist[id] = {px: rspx, py: rspy, name: name}
    }
    if (op === 'pft') {
      delete playerlist[val]
    }
    if (op === 'pch') {
      var [id, x, y] = val.split(',').map(x => parseInt(x))
      if (id == playerlist.self) return
      playerlist[id].px = x
      playerlist[id].py = y
    }
  };
  ws.onclose = function (e) {
    game_started = false
    connect_lost = true
    document.exitPointerLock()
    title = "Lost Connection";
  };

  canvas.addEventListener('mousemove', function (e) {
    if (!gaming || die || connect_lost)
      return;
    var rx = px, ry = py
    px += e.movementX
    if (px > W) px = W
    if (px < 0) px = 0
    py += e.movementY
    if (py > H) py = H
    if (py < 0) py = 0
    
    for (var k = 0; k < 2; k++) {
      for (var i = 0; i < wall.length; i++) {
        var [ba, bb, bc, bd] = wall[i]
        if (check(rx, ry, px, py, ba, bb, ba + bc, bb)) // up
          py = bb - 1
        if (check(rx, ry, px, py, ba, bb, ba, bb + bd)) // left
          px = ba - 1
        if (check(rx, ry, px, py, ba + bc, bb + bd, ba + bc, bb)) // right
          px = ba + bc + 1
        if (check(rx, ry, px, py, ba + bc, bb + bd, ba, bb + bd)) // bottom
          py = bb + bd + 1
      }
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
          if (connect_lost)
            return
          px = rspx, py = rspy
          ws.send(`pup|${px},${py}`)
          canvas.requestPointerLock()
          die = false
        }
      })
      document.exitPointerLock()
      ws.send('pup|-100,-100')
    } else {
      ws.send(`pup|${px},${py}`)
    }
  })
  run()
}