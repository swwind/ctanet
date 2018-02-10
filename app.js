const HttpServer = require('http-server')
const WebSocket = require('ws')
const colors = require('colors')
const localhost = "127.0.0.1"
const http_port = 80
const websocket_port = 18465

const wss = new WebSocket.Server({port: websocket_port});
var connection_list = {}
var id = 0
wss.broadcast = function (data) {
  wss.clients.forEach(function (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}
wss.on('connection', function (ws) {
  ws.id = ++ id
  connection_list[ws.id] = {px: -100, py: -100}
  ws.send('upd|' + JSON.stringify(Object.assign({self: ws.id}, connection_list)))
  wss.broadcast(`pjn|${id}`)
  console.log(`Connection ${id} joined the game.`.green)
  ws.on('message', function (data) {
    var [px, py] = data.split(',').map(x => parseInt(x))
    connection_list[ws.id].px = px
    connection_list[ws.id].py = py
    wss.broadcast(`pch|${ws.id},${px},${py}`)
  });
  ws.on('error', function () {})
  ws.on('close', function () {
    console.log(`Connection ${id} left the game.`.red)
    delete connection_list[ws.id]
    wss.broadcast(`pft|${ws.id}`)
  })
});

console.log('websocket server started at [ws://%s:%d]', localhost, websocket_port)

var hs = HttpServer.createServer()
hs.listen(http_port)
console.log('http server started at [http://%s:%d]', localhost, http_port)

