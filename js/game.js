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
var start_game = function () {
  var canvas = document.getElementById('canvas')
  var ctx = canvas.getContext('2d')
  canvas.height = 600
  canvas.width = 1000
  var clear = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  var px = -100, py = -100
  var game_started = false
  var gaming = false
  var title = 'Connecting'
  var playerlist = undefined
  var die = false
  var rspx = 200, rspy = 500

  var draw_cursor = function (px, py) {
    ctx.fillStyle = '#6c12ca'
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
  var draw_lava = function () {
    for (var i = 0; i < lava.length; i++) {
      ctx.fillStyle = 'rgba(241, 63, 63, .5)'
      ctx.fillRect(lava[i][0], lava[i][1], lava[i][2], lava[i][3])
    }
  }
  var run = function (time) {
    clear()
    if (game_started) {
      if (playerlist) {
        for (var key in playerlist) {
          if (key != 'self' && key != playerlist.self) {
            value = playerlist[key]
            draw_cursor(value.px, value.py)
          }
        }
      }
      draw_lava()
      draw_cursor(px, py)
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
      px = e.screenX
      py = e.screenY
      game_started = true
    }
  })

  var ws = new WebSocket('ws://10.176.20.73:18465')
  ws.onopen = function(e) {
    title = 'Click To Start'
  };
  ws.onmessage = function(e) {
    if (!playerlist) {
      playerlist = JSON.parse(e.data)
    } else if (e.data.match(/^\d+$/)) {
      if (e.data == playerlist.self) return;
      if (playerlist[e.data]) delete playerlist[e.data]
      else playerlist[e.data] = {px: 0, py: 0}
    } else {
      var [id, x, y] = e.data.split(',').map(x => parseInt(x))
      playerlist[id].px = x
      playerlist[id].py = y
    }
  };
  ws.onclose = function(e) {
    game_started = false
    title = "Lost Connection";
  };

  canvas.addEventListener('mousemove', function (e) {
    if (!gaming || die)
      return;
    px += e.movementX
    if (px > 1000) px = 1000
    if (px < 0   ) px = 0
    py += e.movementY
    if (py > 700 ) py = 700
    if (py < 0   ) py = 0
    for (var i = 0; i < lava.length; i++) {
      if (lava[i][0] <= px && px <= lava[i][0] + lava[i][2] &&
          lava[i][1] <= py && py <= lava[i][1] + lava[i][3])
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