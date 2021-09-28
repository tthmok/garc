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
  socket.on('command-response', msg => {
    console.log('command-response:' + msg);
    // Give feedback to users according to the robot state
    if(msg['bot_responded']) {
      //client.whisper(msg['user_name'], `Bot ${msg['bot_name']} will follow your command`);
      //client.say("gogokodo", msg['user_name'] + ` Bot ${msg['bot_name']} will follow your command`);
    }
    else {
      //client.say("gogokodo", msg['user_name'] + ` Bot ${msg['bot_name']} will follow your command`);
      twitchClient.say("gogokodo", msg['user_name'] + ` Bot ${msg['bot_name']} is in use. Please wait.`);  
    }
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
const twitchClient = new tmi.client(opts);

// Register our event handlers (defined below)
twitchClient.on('message', onMessageHandler);
twitchClient.on('connected', onConnectedHandler);

// Connect to Twitch:
twitchClient.connect();

// Called every time a message comes in
function onMessageHandler (channel, tags, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  
  console.log("Twitch Message Received: " + msg + "\n");

  var stream = fs.createWriteStream("full_log.txt", {flags:'a'});
  stream.write(new Date().toISOString() + ";");
  stream.write(`@${tags.username}` + ';' +  msg + "\n")
  stream.end();

  // @TODO keep track of all messages

  if (msg.startsWith('!')) {
    // Add user name to the message
    let msgWithName = msg.concat(` ${tags.username}`);
    io.emit('bot_command', msgWithName);

    var stream = fs.createWriteStream("command_log.txt", {flags:'a'});
    stream.write(msg.toLowerCase() + "\n")
    stream.end();
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