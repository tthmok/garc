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


//*************************
//*************************
//*************************
//************************* CHATBOT
//*************************
//*************************
//*************************
const dotenv = require('dotenv');
const fs = require('fs')

dotenv.config();

console.log('BOT_USERNAME: ' + process.env.BOT_USERNAME);
console.log('CHANNEL_NAME: ' + process.env.CHANNEL_NAME);

const tmi = require('tmi.js');

// Define configuration options
const opts = {
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN
  },
  channels: [
    process.env.CHANNEL_NAME
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (channel, tags, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  
  console.log("Message: " + msg + "\n");

  var stream = fs.createWriteStream("full_log.txt", {flags:'a'});
  stream.write(new Date().toISOString() + ";");
  stream.write(`@${tags.username}` + ';' +  msg + "\n")
  stream.end();

  // @TODO keep track of all messages

  if (msg.startsWith('!')) {
    const args = msg.slice(1).split(' ');
    const command = args.shift().toLowerCase();

    var commandRecognized = true;

    // If the command is known, let's execute it
    if (command === 'go') {

        } else if (command === 'back') {
    } else if (command === 'spin') {

    } else {
      commandRecognized = false;
      console.log(`* Unknown command ${command}`);
    }

    if (commandRecognized) {
      io.emit('bot_command', command);

      var stream = fs.createWriteStream("command_log.txt", {flags:'a'});
      stream.write(msg.toLowerCase() + "\n")
      stream.end();
    }
  }
}

// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}