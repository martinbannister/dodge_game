console.log('Javascript is running!')

const play_canvas = document.getElementById("play_area");
const play_ctx = play_canvas.getContext("2d");

const back_canvas = document.getElementById("back");
const back_ctx = back_canvas.getContext("2d");

play_ctx.font = 'Sono, sans-serif';

// Global Variables
const WIDTH = 800;
const HEIGHT = 400;

const OBST_WIDTH = 40;
const OBST_HEIGHT = 40;

const PLAYER_W = 50;
const PLAYER_H = 50;

let frame = 0;
let animReqId;

const obstacles = [];
const lasers = [];
const stars = [];
const objSettings = {
  gameState: 'running',
  hue: 0,
  keyCount: 0,
  ammo: 2,
};
let player = {
  // randomly position player square withing the first 50 pixes on the left and anywhere vertically
  x: Math.floor(Math.random() * PLAYER_W),
  y: Math.floor(Math.random() * (HEIGHT - PLAYER_H)),
  width: PLAYER_W,
  height: PLAYER_H,
}

function resetGlobals(){
// reset global variables
  obstacles.length = 0;
  
  objSettings.ammo = 2;
  objSettings.hue = 0;
  objSettings.keyCount = 0;
}

function play(timeStamp) {
  let txt = '';
  let txt_width = 0;
  
  switch(objSettings.gameState) {
    case 'running':
//    clear the canvas
      play_ctx.clearRect(0, 0, WIDTH, HEIGHT);
      back_ctx.clearRect(0, 0, WIDTH, HEIGHT);
//    draw player
      let hueOpp = (objSettings.hue + 180) % 360;
      play_ctx.fillStyle = `hsl(${hueOpp}, 100%, 50%)`;
      play_ctx.fillRect(player.x, player.y, PLAYER_W, PLAYER_H);
      play_ctx.lineWidth = 10;
      play_ctx.strokeStyle = `hsla(${hueOpp}, 100%, 50%, 0.3)`;
      play_ctx.strokeRect(player.x - 5, player.y - 5, PLAYER_W + 10, PLAYER_H + 10);

      if (obstacles.length > 0) {
        obstacles.forEach( obstacle => obstacle.place() );
      }
      
      if (lasers.length > 0) {
        lasers.forEach( laser => laser.fire() );
      }
      
//    check for collision with an obstacle or laser on each move
      obstacles.forEach( (obstacle, obstIndex, arrObstacles) => {
        let impact = collision(player, obstacle);
        if (impact) objSettings.gameState = 'lost';
//    check for laser collision with obstacle and remove obstacle
        lasers.forEach( (laser, lasIndex, arrLasers) => {
          let shot = collision(obstacle, laser);
          if (shot) {
            arrObstacles.splice(obstIndex, 1);
          }
        });
      });
      
//    laser/ammo text placed here to draw on top of obstacles
      play_ctx.fillStyle = 'white';
      play_ctx.font = 'bold 25px Sono';
      txt = `Laser: ${objSettings.ammo}`;
      txt_width = play_ctx.measureText(txt).width;
      play_ctx.fillText(txt, WIDTH - txt_width - 10, 30);
      break;
    case 'won':
      play_ctx.font = '60px Sono, sans-serif';
      play_ctx.fillStyle = "lime";
      txt = "You win!";
      txt_width = play_ctx.measureText(txt).width;
      play_ctx.fillText(txt , (WIDTH / 2) - (txt_width / 2), HEIGHT / 2);
      play_ctx.font = '20px Sono, sans-serif';

      resetGlobals();
      break;
    case 'lost':
      // clear the canvases
      play_ctx.clearRect(0, 0, WIDTH, HEIGHT);
      back_ctx.clearRect(0, 0, WIDTH, HEIGHT);

      play_ctx.font = '48px Sono, sans-serif';
      play_ctx.fillStyle = "red";
      txt = "Game Over!";
      txt_width = play_ctx.measureText(txt).width;
      play_ctx.fillText(txt, (WIDTH / 2) - (txt_width / 2), (HEIGHT / 2));

      play_ctx.font = '22px Sono, sans-serif';
      play_ctx.fillStyle = "yellow";

      resetGlobals();
      break;
  }
      
//    add new stars at the edge of the canvas
      if (frame % 10 === 0) {
        stars.push(new Star(WIDTH));
      }

  if (objSettings.gameState !== 'running') {
    txt = "Press Space to start again";
    txt_width = play_ctx.measureText(txt).width;
    play_ctx.fillText(txt, (WIDTH / 2) - (txt_width / 2), (HEIGHT / 2) + 30);
  }
  
  stars.forEach( (star, index, array) => {
    if (star.x <= 0) {
      array.splice(index, 1);
    }
    star.draw();
    star.drift();
  })
  
  frame++;
  
  animReqId = requestAnimationFrame(play);

}

// stars
class Star {
  constructor(x = 0) {
    this.x = x > 0 ? x : Math.floor(Math.random() * WIDTH - 1);
    this.y = Math.floor(Math.random() * HEIGHT - 1);
    this.width = 1;
    this.height = 1;
    this.speed = Math.random() * (1 - 0.2) + 0.2;
  }
  
  draw() {
    back_ctx.fillStyle = 'white';
    back_ctx.fillRect(this.x, this.y, this.width, this.height)
  }
  
  drift() {
    this.x -= this.speed;
  }
}

// create initial stars
function createStars() {
  for (let i = 0; i < 100; i++) {
    stars.push(new Star());
  }
}

// create stars
createStars();

// start inital game
requestAnimationFrame(play);

// obstacles

class Obstacle {
  constructor(p) {
    let clash = false;
    let x = 0;
    let y = 0;
    // let count = 0;
    do {
      // place obstacle at random coordinates within the 400x400 canvas minus size of obstacle
      // ensure minimum value doesn't exceed 360, so obstacles won't go off the edge of the canvas
      let min = p.x + 55 > WIDTH ? WIDTH - OBST_WIDTH : p.x + 55;
      // set x (left) coordinate to be ahead of current player position with a gap
      x = Math.floor((Math.random() * ((WIDTH - OBST_WIDTH) - min)) + min);
      // set y (right) to be anywhere in the vertical space
      y = Math.floor(Math.random() * HEIGHT);
      // console.log(`obstacle x:${x} y:${y}`, `player x:${player.x} y:${player.y}`);
      // check if obstacle would instantly clash with player
      if (collision(p, {x: x, y: y, width: OBST_WIDTH, height: OBST_HEIGHT})) {
        clash = true;
        // console.log(`looping ${count}`);
        // count++;
        // if (count > 99) break;
      } else {
        clash = false;
      }
    } while (clash);
    
    this.x = x;
    this.y = y;
    this.width = OBST_WIDTH;
    this.height = OBST_HEIGHT;
  }
  place() {
    // place the obstacle on the canvas
    play_ctx.fillStyle = 'orange';
    play_ctx.fillRect(this.x, this.y, this.width, this.height);
    // console.log(`obstacle x:${this.x} y:${this.y}`, `player x:${player.x} y:${player.y}`);
  }
}

// lasers
class Laser {
  constructor(p) {
    this.x = p.x + p.width;
    this.y = p.y + (p.height / 2);
    this.width = 20;
    this.height = 5;
    this.speed = 2;
  }
  fire() {
    play_ctx.fillStyle = 'blue';
    play_ctx.fillRect(this.x, this.y, this.width, this.height);
    this.x += this.speed;
    
  }
}

// collisions

function collision(firstObj, secondObj) {
  if( !( firstObj.x > secondObj.x + secondObj.width ||
         firstObj.x + PLAYER_W < secondObj.x ||
         firstObj.y > secondObj.y + secondObj.height ||
         firstObj.y + PLAYER_H < secondObj.y)
    ) {
      // collision has happened
      return true;
  } else {
    // no collision happened
    return false;
  }
}


function listener(event) {
  // when I press an arrow, move the player in that direction
  // pressing space resets the game after win or lose

  switch(event.code) {
    case 'Space':
      if (objSettings.gameState === 'won' || objSettings.gameState === 'lost') {
        // reset game state
        objSettings.gameState = 'running';
        // reset the player
        player.x = Math.floor(Math.random() * PLAYER_W);
        player.y = Math.floor(Math.random() * (HEIGHT - PLAYER_H));
      } else if (objSettings.gameState === 'running') {
//         fire laser
        if (objSettings.ammo > 0) {
          lasers.push(new Laser(player));
          objSettings.ammo--;
        }
//         don't include in keycount
        objSettings.keyCount--;
      }
      break;
    case 'ArrowDown':
      // move the player 10 down
      player.y += 10;
      break;
    case 'ArrowUp':
      // move the player 10 up
      player.y -= 10;
      break;
    case 'ArrowLeft':
      // move the player 10 left
      player.x -= 10;
      break;
    case 'ArrowRight':
      // move the player 10 right
      player.x += 10;
      break;
    default:
      return;
      // do nothing
  }
  
//   increment hue for each key click
  objSettings.hue += 15;

  
//   if it is not the first key press and the key press is divisible by 5
//   add a new obstacle to the obstacles array
  if (objSettings.keyCount > 0 && (objSettings.keyCount % 5) == 0) {
    obstacles.push(new Obstacle(player));
  }
  
//   if the player has passed the right hand edge of the screen
//   the game is won
  if (player.x >= WIDTH) {
    // move the player back to the start
    player.x = 0;
    objSettings.gameState = 'won';
  }
  
//   if the player passes the bottom of the screen they return to the top
  if (player.y >= HEIGHT) {
    // relocate the shape to the top
    player.y = 0;
  }
  
  objSettings.keyCount++;
  
  // clear the canvas
  // play_ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // play();  
}

window.addEventListener('keydown', listener);