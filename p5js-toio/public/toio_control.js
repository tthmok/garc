// This is the client-side javascript that gives commands to the actual toio hardware
// Uses P5Toio

const CUBE_NAME_YELLOW = "yellow";
const CUBE_ID_YELLOW = "toio Core Cube-31j";

const CUBE_ID_BLUE = "toio Core Cube-D1h";
const CUBE_NAME_BLUE = "blue";

const connectedCubeArray = [];
const knownCubesById = {};
const cubeNameToId = {};
cubeNameToId[CUBE_NAME_BLUE] = 0;
cubeNameToId[CUBE_NAME_YELLOW] = 1;

const MOTOR_MIN_SPEED = 8;
const MOTOR_MAX_SPEED = 115;
const TURN_90DEG_DURATION = 99; //just comes from guess and check. use together with min motor speed
const TURN_DURATION_PER_DEGREE = TURN_90DEG_DURATION / 90; // This seems to break down past 180 degrees

// {prevActionDone: number}
let cubeStates = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(220);
}

function draw() {}

// client-side
socket.on("connect", () => {
  console.log(socket.id);
});

socket.on('bot_command', function (msg) {
  asyncHandleCubeCommand(msg);
});

function tryExecCommand(timestamp, cubeState, username, commandFn, duration) {
  console.log(cubeState);
  console.log(username);
  if (timestamp > cubeState.prevActionDone) {
    console.log("Do command");
    //cubeState.prevActionDone = timestamp + duration;
    commandFn();
    socket.emit('command-response', {'bot_name': cubeState.cubeName, 'bot_responded': true, 'user_name': username});
    return timestamp + duration;
  } else {
    console.log("Don't do command");
    socket.emit('command-response', {'bot_name': cubeState.cubeName, 'bot_responded': false, 'user_name': username});
    return cubeState.prevActionDone;
  }
}

const DEFAULT_TIME = 1350;
const MAX_TIME = 2550;

async function asyncHandleCubeCommand(msg) {
  if (msg != null) {
    const args = msg.slice(1).split(' ');

    console.log('args:' + args);

    // Only execute commands when 
    const ts = Date.now();
    if (args != null) {
      const cubeName = args.shift().toLowerCase();
      console.log('cubeName:' + cubeName);
      if (cubeName != null) {
        console.log("Get cube by ID:" + cubeNameToId[cubeName]);
        // Doing this because I don't have a unique ID that sticks around
        // so just deal with it for now I guess
        var cube = connectedCubeArray[cubeNameToId[cubeName]];
        // var cube = knownCubesById[cubeNameToId[botName]];
        let cubeState = cubeStates[cubeNameToId[cubeName]];
        cubeState.cubeName = cubeName;

        if (cube != null) {
          const command = args.shift().toLowerCase();
          console.log('command:' + command);
          if (command != null) {
            if (command === 'go' || command === 'back') {
                var speed = parseSpeed(args.shift(), 20);
                if (command === 'back') {
                  speed = -speed;
                }
              // duration	number	0	Motor control duration in msec. 0-2550( 0: Eternally ).
                cubeState.prevActionDone = tryExecCommand(ts, cubeState, args[args.length - 1], () => cube.move(speed, speed, DEFAULT_TIME), DEFAULT_TIME);             
            } else if (command === 'rotate') {
              // !{bot} rotate {degrees}
              var degrees = args.shift();
              var duration = turnDurationForDegrees(degrees);
              var turnSpeed = MOTOR_MIN_SPEED;
              if (degrees < 0) {
                turnSpeed = -turnSpeed;
              }
              cubeState.prevActionDone = tryExecCommand(ts, cubeState, args[args.length - 1], () => cube.move(turnSpeed, -turnSpeed, duration), duration);
            } else if (command === 'spin') {
              console.log("spinning");
              var speed = parseSpeed(args.shift(), 8);
              cubeState.prevActionDone = tryExecCommand(ts, cubeState, args[args.length - 1], () => cube.move(-speed, speed, DEFAULT_TIME), DEFAULT_TIME);
            } else {
              console.log(`* Unknown command ${command}`);
            }
          } else {
            console.log(`* Missing command`);
          }
        }
      }
    }
  }
}

function turnDurationForDegrees(degrees) {
  return duration = Math.abs(TURN_DURATION_PER_DEGREE * degrees);
}

function parseSpeed(speedStr, defaultSpeed = 20) {
  if (speedStr != null) {
    var speed = parseInt(speedStr);
    speed = motorSpeedLimits(speed);
    return speed;
  }
  return defaultSpeed;
}

function motorSpeedLimits(speed) {
  // Negative value means back direction. -115 to -8, 8 to 115, and 0 integer value.
  speed = Math.max(-MOTOR_MAX_SPEED, speed);
  speed = Math.min(MOTOR_MAX_SPEED, speed);
  if (speed > -MOTOR_MIN_SPEED && speed < 0) {
    speed = -MOTOR_MIN_SPEED;
  } else if (speed < MOTOR_MIN_SPEED && speed > 0) {
    speed = MOTOR_MIN_SPEED;
  }
  return speed;
}

function mouseClicked() {
  P5tCube.connectNewP5tCube().then(cube => {
    //cube.turnLightOn( 'white' );

    //knownCubesById[cube.cube.device.id] = cube;
    connectedCubeArray.push(cube);
    cubeStates.push({prevActionDone: -1});

    // const type = 'sensorcollision';
    // cube.addEventListener(type, ()=>{
    //   console.log(type);
    //   cube.stop();
    // });

    // Save some battery
    cube.turnLightOff();

    console.log("cube:" + cube.cube.device.id);
    console.log("name:" + cube.cube.device.name);
    console.log("bat:" + cube.batteryLevel);
  });
}