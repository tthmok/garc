function setup() {
  createCanvas(windowWidth, windowHeight);
  background(220);
}

const connectedCubeArray = [];

function draw() {
  // Keep on gazing at mouse point
  for( const cube of connectedCubeArray ){
    const x = Math.floor(mouseX * 300 / windowWidth + 200);
    const y = 144;
    const speed = 115; 
    cube?.turnToXY( x, y, speed );
  }
}

function mouseClicked() {
  P5tCube.connectNewP5tCube().then( cube => {
    cube.turnLightOn( 'white' );

    connectedCubeArray.push( cube );

      // Play sequence C-D-E
    cube?.playMelody( [ 
      { note: 0x3C, duration: 0x1E }, 
      { note: 0x3E, duration: 0x1E }, 
      { note: 0x40, duration: 0x1E } 
    ] );
  } );
}