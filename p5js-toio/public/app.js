const http = require('http');
const path = require('path');

const express = require('express');
const app = express();

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname));
console.log("Serve:" + __dirname);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

server.listen(3000, (err) => {
  if (err) throw err
  console.log('Server running in http://127.0.0.1:3000')
});


io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});