// This is the client-side javascript that gives commands to the actual toio hardware
// Uses P5Toio

// these IDs change between connections!!!!!!
//const CUBE_ID_YELLOW = "8uIoeZIEkXIuB34389LITg==";
const CUBE_NAME_YELLOW = "yellow";

const CUBE_ID_BLUE = "toio Core Cube-h1A";
const CUBE_NAME_BLUE = "blue";

const connectedCubeArray = [];
const knownCubesById = {};
const cubeNameToId = {};
cubeNameToId[CUBE_NAME_BLUE] = 0;
cubeNameToId[CUBE_NAME_YELLOW] = 1;


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

async function asyncHandleCubeCommand(msg) {
  if (msg != null) {
    const args = msg.slice(1).split(' ');

    console.log('args:' + args);
    if (args != null) {
      const cubeName = args.shift().toLowerCase();
      console.log('cubeName:' + cubeName);
      if (cubeName != null) {
        console.log("Get cube by ID:" + cubeNameToId[cubeName]);
        // Doing this because I don't have a unique ID that sticks around
        // so just deal with it for now I guess
        var cube = connectedCubeArray[cubeNameToId[cubeName]];
        // var cube = knownCubesById[cubeNameToId[botName]];

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
              cube.move(speed, speed, 1350);
            } else if (command === 'rotate') {
              cube.rotate(parseSpeed(args.shift(), 20), 1350);
            } else if (command === 'turnto') {
              // turnTo(angle: number, speed: number, rotateType: string, timeout: number)
              var angle = parseInt(args.shift());
              console.log("turnto:" + angle)
              if (angle != null) {
                cube.x = 0;
                cube.y = 0;
                cube.sensorX = 0;
                cube.sensorY = 0;
                cube.turnTo(angle * (Math.PI / 180), 15);
              }
            } else if (command === 'spin') {
              var speed = parseSpeed(args.shift(), 8);
              cube.move(-speed, speed, 1350);
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
  speed = Math.max(-115, speed);
  speed = Math.min(115, speed);
  if (speed > -8 && speed < 0) {
    speed = -8;
  } else if (speed < 8 && speed > 0) {
    speed = 8;
  }
  return speed;
}

function mouseClicked() {
  P5tCube.connectNewP5tCube().then(cube => {
    //cube.turnLightOn( 'white' );

    //knownCubesById[cube.cube.device.id] = cube;
    connectedCubeArray.push(cube);

    // const type = 'sensorcollision';
    // cube.addEventListener(type, ()=>{
    //   console.log(type);
    //   cube.stop();
    // });

    // Save some battery
    cube.turnLightOff();

    console.log("cube:" + cube.cube.device.id)

    console.log("bat:" + cube.batteryLevel);
  });
}