// This is the client-side javascript that gives commands to the actual toio hardware
// Uses P5Toio

// these IDs change between connections!!!!!!
//const CUBE_ID_YELLOW = "8uIoeZIEkXIuB34389LITg==";
const CUBE_NAME_YELLOW = "yellow";

//const CUBE_ID_BLUE = "o37KDYYr7WApagvW3TPn9A==";
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
  var botRecognized = false;

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
          botRecognized = true;

          const command = args.shift().toLowerCase();
          console.log('command:' + command);
          if (command != null) {
            if (command === 'go') {
              // left	number	-	Left motor speed. Negative value means back direction. -115 to -8, 8 to 115, and 0 integer value.
              // right	number	-	Right motor speed. Negative value means back direction. -115 to -8, 8 to 115, and 0 integer value.
              // duration	number	0	Motor control duration in msec. 0-2550( 0: Eternally ).
              cube.move(20, 20, 1200);

            } else if (command === 'back') {
              cube.move(-20, -20, 2550);

            } else if (command === 'spin') {
              cube.move(-115, 115, 2550);
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
});

function mouseClicked() {
  P5tCube.connectNewP5tCube().then(cube => {
    //cube.turnLightOn( 'white' );

    //knownCubesById[cube.cube.device.id] = cube;
    connectedCubeArray.push(cube);

    // Save some battery
    cube.turnLightOff();

    console.log("cube:" + cube.cube.device.id)
    
    console.log("bat:" + cube.batteryLevel);
  });
}