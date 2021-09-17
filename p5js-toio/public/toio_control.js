// This is the client-side javascript that gives commands to the actual toio hardware
// Uses P5Toio
const CUBE_ID_YELLOW = "8uIoeZIEkXIuB34389LITg==";
const CUBE_NAME_YELLOW = "yellow";

const CUBE_ID_BLUE = "o37KDYYr7WApagvW3TPn9A==";
const CUBE_NAME_BLUE = "blue";

const connectedCubeArray = [];
const knownCubesById = {};
const cubeNameToId = {
  CUBE_NAME_BLUE: CUBE_ID_BLUE,
  CUBE_NAME_YELLOW: CUBE_ID_YELLOW
};

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
  const args = msg.slice(1).split(' ');
  const command = args.shift().toLowerCase();

  var commandRecognized = true;

  // If the command is known, let's execute it
  if (command === 'go') {
    //   left	number	-	Left motor speed. Negative value means back direction. -115 to -8, 8 to 115, and 0 integer value.
    // right	number	-	Right motor speed. Negative value means back direction. -115 to -8, 8 to 115, and 0 integer value.
    // duration	number	0	Motor control duration in msec. 0-2550( 0: Eternally ).
    for (const cube of connectedCubeArray) {
      cube.move(20, 20, 2550);
    }
  } else if (command === 'back') {
    for (const cube of connectedCubeArray) {
      cube.move(-20, -20, 2550);
    }
  } else if (command === 'spin') {
    for (const cube of connectedCubeArray) {
      cube.move(-115, 115, 2550);
    }
  } else {
    commandRecognized = false;
    console.log(`* Unknown command ${command}`);
  }

  if (commandRecognized) {}
});

function mouseClicked() {
  P5tCube.connectNewP5tCube().then(cube => {
    //cube.turnLightOn( 'white' );

    knownCubesById[cube.cube.device.id] = cube;
    connectedCubeArray.push(cube);

    // Save some battery
    cube.turnLightOff();

    console.log("cube:" + cube.cube.device.id)
    console.log("bat:" + cube.batteryLevel);
  });
}