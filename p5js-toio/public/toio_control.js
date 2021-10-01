// This is the client-side javascript that gives commands to the actual toio hardware
// Uses P5Toio

// Spain
// Canada - calgary, toronto
// Denmark

const CUBE_NAME_RED = "red";
const CUBE_ID_RED = "toio Core Cube-D1haa";

const CUBE_NAME_BLACK = "black";
const CUBE_ID_BLACK = "toio Core Cube-D1h";

const CUBE_ID_BLUE = "toio Core Cube-H1A";
const CUBE_NAME_BLUE = "blue";

const CUBE_ID_GREEN = "toio Core Cube-H1Aaaa";
const CUBE_NAME_GREEN = "green";

const connectedCubeArray = [];
const knownCubesById = {};
const cubeNameToId = {};
cubeNameToId[CUBE_NAME_RED] = 0;
cubeNameToId[CUBE_NAME_BLACK] = 1;
cubeNameToId[CUBE_NAME_BLUE] = 2;
cubeNameToId[CUBE_NAME_GREEN] = 3;

const MOTOR_MIN_SPEED = 8;
const MOTOR_MAX_SPEED = 115;
const MOTOR_TURN_SPEED = 13;
const TURN_90DEG_DURATION = 58; //just comes from guess and check. use together with motor speed 12
const TURN_DURATION_PER_DEGREE = TURN_90DEG_DURATION / 90; 

// Times are actually given in 1-255 then multiplied by 10 to get milliseconds
// according to https://toio.github.io/toio-spec/en/docs/ble_motor
// The duration in which the motor is controlled is specified with values ranging from 0 to 255. 
//A value of 0 means that there is no time limit and the motor continues to run at the specified
// speed until the next write operation is performed. For values ranging between 1 and 255, 
// the motor for 10 times the specified value in milliseconds, then stops.

const DEFAULT_TIME = 100;
const MAX_INSTR_TIME = 255;
const POLY_SIDE_TIME = 160;
const MAX_DISTANCE = 10; //? not sure what a good max is

const CM_PER_SECOND = 2.05; // at motor speed 8
//5.5cm at motor speed 8 for 1000 ms (send motor 100 as duration)

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
  console.log("tryExecCommand: " + username);
  console.log("duration:" + duration);
  duration = Math.round(duration);
  if (duration == 0) {
    duration = 1; // hack!!! just trying to preven eternal commands from running accidentally
  }
  if (duration > MAX_INSTR_TIME) {
    duration = MAX_INSTR_TIME;
  }
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

function drawPolygon(c, cState, userName, startTs, sideSpeed, numSides, sideCount) {
  console.log("drawPolygon:" + startTs + " numSides:" + numSides + " sideCount:" + sideCount);
  if (sideCount < numSides * 2) {
    let angle = (numSides - 2) * 180 / numSides;
    console.log("angle: " + angle);
    if (sideCount % 2 === 0) {
      console.log("drawPolygon: Go straight");
      // Go straight
      cState.prevActionDone = tryExecCommand(startTs, cState, userName, () => c.move(sideSpeed, sideSpeed, POLY_SIDE_TIME), POLY_SIDE_TIME);
      setTimeout(() => {
        console.log("drawPolygon: in first setTimeout");
        drawPolygon(c, cState, userName, startTs + POLY_SIDE_TIME * 10, sideSpeed, numSides, sideCount + 1);
      }
      , POLY_SIDE_TIME * 10);
    }
    else {      
      console.log("drawPolygon: Rotate");
      var duration = turnDurationForDegrees(180 - angle);
      var turnSpeed = MOTOR_TURN_SPEED;
      
      console.log("Turn for: " + duration + "ms");
      cState.prevActionDone = tryExecCommand(startTs, cState, userName, () => c.move(turnSpeed, -turnSpeed, duration), duration);
      setTimeout(() => {
        drawPolygon(c, cState, userName, startTs + POLY_SIDE_TIME * 10, sideSpeed, numSides, sideCount + 1)
      }, 
      POLY_SIDE_TIME * 10);
    }
  }
}

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
            } else if (command === 'dist') {
              var distance = args.shift(); // assume in centimeters
              // figure out some maximum
              if (distance > MAX_DISTANCE) {
                distance = MAX_DISTANCE;
              }
              var duration = (distance / CM_PER_SECOND) * 100;
              duration = Math.round(duration);
              console.log("dist: " + distance + " dur:" + duration);
              cubeState.prevActionDone = tryExecCommand(ts, cubeState, args[args.length - 1], () => cube.move(MOTOR_MIN_SPEED, MOTOR_MIN_SPEED, duration), duration);
            } else if (command === 'rotate') {
              // !{bot} rotate {degrees}
              var degrees = args.shift();
              var duration = turnDurationForDegrees(degrees);
              var turnSpeed = MOTOR_TURN_SPEED;
              if (degrees < 0) {
                turnSpeed = -turnSpeed;
              }
              if (duration == 0) {
                duration = 1; // this is a hacky fix to try and prevent eternal duration
              }
              console.log("rotate: duration: " + duration);
              cubeState.prevActionDone = tryExecCommand(ts, cubeState, args[args.length - 1], () => cube.move(turnSpeed, -turnSpeed, duration), duration);
            } else if (command === 'spin') {
              console.log("spinning");
              var speed = parseSpeed(args.shift(), 8);
              cubeState.prevActionDone = tryExecCommand(ts, cubeState, args[args.length - 1], () => cube.move(-speed, speed, DEFAULT_TIME), DEFAULT_TIME);
            } else if (command === 'poly') {
              var numSides = args.shift();
              if (numSides >= 3 && numSides <= 8) {
              //function drawPolygon(c, cState, userName, startTs, sideSpeed, numSides, sideCount)
                drawPolygon(cube, cubeState, args[args.length - 1], ts, 8, numSides, 0);
              }
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