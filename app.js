const express = require('express')
const WebSocket = require('ws')
const colors = require('colors')
const fs = require('fs')
const localhost = "127.0.0.1"
const http_port = 80
const websocket_port = 18465

const LOGO_FILE_PATH = 'logo.txt'
let data = fs.readFileSync(LOGO_FILE_PATH, 'utf-8')
console.log(data);

const wss = new WebSocket.Server({port: websocket_port});
let connection_list = {}
let id = 0
wss.broadcast = function (data) {
  wss.clients.forEach(function (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}
wss.on('connection', function (ws) {
  ws.id = ++ id
  ws.send('upd|' + JSON.stringify(Object.assign({self: ws.id}, connection_list)))
  console.log(`Connection ${id} joined the game.`.green)
  ws.on('message', function (data) {
    let tmp = data.split('|')
    let op = tmp[0], val = tmp.slice(1).join('|')
    if (op === 'pup') {
      let [px, py] = val.split(',').map(x => parseInt(x))
      connection_list[ws.id].px = px
      connection_list[ws.id].py = py
      wss.broadcast(`pch|${ws.id},${px},${py}`)
    }
    if (op === 'pjn') {
      connection_list[ws.id] = {px: -100, py: -100, name: val}
      wss.broadcast(`pjn|${ws.id},${val}`)
    }
  });
  ws.on('error', function () {})
  ws.on('close', function () {
    console.log(`Connection ${ws.id} left the game.`.red)
    delete connection_list[ws.id]
    wss.broadcast(`pft|${ws.id}`)
  })
});

console.log('websocket server started at [%s]', `ws://${localhost}:${websocket_port}`.yellow)

let app = express()
app.use(express.static('public'))
app.listen(80)
console.log('http server started at [%s]', `http://${localhost}:${http_port}`.yellow)

console.log('')

