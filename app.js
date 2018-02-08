const HttpServer = require('http-server')
var WebSocketServer = require("websocketserver")
var localhost = "127.0.0.1"

var server = new WebSocketServer("none", 18465)
var connection_list = {}
server.on("connection", function(id) {
  connection_list[id] = {px: 0, py: 0}
  console.log('Id ' + id + ' joined the game')
  var s = Object.assign(connection_list, {self: id});
  server.sendMessage('one', JSON.stringify(s), id)
  server.sendMessage('all', '' + id)
})
server.on("message", function(data, id) {
  var mes = server.unmaskMessage(data)
  var str = server.convertToString(mes.message)
  var [px, py] = str.split(',').map(x => parseInt(x))
  connection_list[id].px = px
  connection_list[id].py = py
  server.sendMessage('all', id + ',' + px + ',' + py)
})
server.on("closedconnection", function(id) {
  console.log("Connection " + id + " has left the server")
  delete connection_list[id];
  server.sendMessage('all', '' + id)
})
console.log('websocket server started at ' + localhost + ':' + 18465)

const port = 80
var hs = HttpServer.createServer()
hs.listen(port)
console.log('http server started at ' + localhost + ':' + port)

