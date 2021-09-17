const CUBE_ID_YELLOW = "8uIoeZIEkXIuB34389LITg==";
const CUBE_NAME_YELLOW = "yellow";

const CUBE_ID_BLUE = "o37KDYYr7WApagvW3TPn9A==";
const CUBE_NAME_BLUE = "blue";

const connectedCubeArray = [];
const knownCubesById = {};
const cubeNameToId = {
  CUBE_NAME_BLUE : CUBE_ID_BLUE,
  CUBE_NAME_YELLOW : CUBE_ID_YELLOW
};


function setup() {
  createCanvas(windowWidth, windowHeight);
  background(220);
}

function draw() {
}

// client-side
socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});


// app.get("/url", (req, res, next) => {
//   res.json(["Tony","Lisa","Michael","Ginger","Food"]);
//  });

//  app.post("/move", function (req, res) {
//   const cube_name = req.query.name;
//   const distance = req.query.distance;

//   console.log("move:" + cube_name + " " + distance);

//   var cube = knownCubesById[cubeNameToIt[cube_name]];
//     // Play sequence C-D-E
//     cube?.playMelody( [ 
//       { note: 0x3C, duration: 0x1E }, 
//       { note: 0x3E, duration: 0x1E }, 
//       { note: 0x40, duration: 0x1E } 
//     ] );

//   res.send(req.body);
// })


function mouseClicked() {
  P5tCube.connectNewP5tCube().then( cube => {
    //cube.turnLightOn( 'white' );
    
    knownCubesById[cube.cube.device.id] = cube;
    connectedCubeArray.push( cube );

    // Save some battery
    cube?.turnLightOff();

    console.log("cube:" + cube.cube.device.id)
    console.log("bat:" + cube.batteryLevel);   
    
  } );
}