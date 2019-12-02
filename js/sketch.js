/* Background of my website */
  
let waveParams;
var canvas;
  
function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  canvas.style('z-index', '-1');

  //canvas.style('display', 'block');
  noStroke();
  waveParams = new WaveParams({
      t: 0,
      timeIncrement: 0.001,
      r: 150,
      g: 50,
      b: 100,
      colorRandom: 70,
      lineWidth: 10,
      ellipseDistanceX: 120,
      ellipseDistanceY: 60,
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(10, 10); // translucent background (creates trails)

  // make a x and y grid of ellipses
  for (let x = 0; x <= width; x = x + waveParams.ellipseDistanceX) {
    for (let y = 0; y <= height; y = y + waveParams.ellipseDistanceY) {
      // starting point of each circle depends on mouse position
      /*const xAngle = map(mouseX, 0, width, -4 * PI, 4 * PI, true);
      const yAngle = map(mouseY, 0, height, -4 * PI, 4 * PI, true);
      // and also varies based on the particle's location
      const angle = xAngle * (x / width) + yAngle * (y / height);

      // each particle moves in a circle
      const myX = x + 30 * cos(2 * PI * waveParams.t + angle);
      const myY = y + 30 * sin(2 * PI * waveParams.t + angle);
      */

      const myX = x + 30 * cos(2 * PI * waveParams.t);
      const myY = y + 30 * sin(2 * PI * waveParams.t);

      fill(random(waveParams.r, waveParams.r+waveParams.colorRandom), 
           random(waveParams.g, waveParams.g+waveParams.colorRandom), 
           random(waveParams.b, waveParams.b+waveParams.colorRandom));
      ellipse(myX, myY, waveParams.lineWidth);
    }
  }

  waveParams.t += waveParams.timeIncrement;
}

class WaveParams {
  constructor(inputVal) {
      this.lineWidth = inputVal.lineWidth;
      this.t = inputVal.t;
      this.timeIncrement = inputVal.timeIncrement;
      this.r = inputVal.r;
      this.g = inputVal.g;
      this.b = inputVal.b;
      this.colorRandom = inputVal.colorRandom;
      this.lineWidth = inputVal.lineWidth;
      this.ellipseDistanceX = inputVal.ellipseDistanceX;
      this.ellipseDistanceY = inputVal.ellipseDistanceY;
  }
}
