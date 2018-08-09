/*
   Copyright 2018 Tyler Hanson
   Flappy Friends - main.js

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


var href = location.href;
var gameID = href.match(/([^\/]*)\/*$/)[1]

var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + `/${gameID}`);

var debugmode = false;

var states = Object.freeze({
  SplashScreen: 0,
  GameScreen: 1,
  ScoreScreen: 2
});

var currentstate;
var server_pipes = []
var server_pipes_iter = 0

var players = []

var player2Gravity = 0.25
var player2velocity = 0;
var player2position = 180;
var player2rotation = 0;

var gravity = 0.25;
var velocity = 0;
var position = 180;
var rotation = 0;
var jump = -4.6;
var flyArea = $("#flyarea").height();

var score = 0;
var highscore = 0;

var pipeheight = 90;
var pipewidth = 52;
var pipes = new Array();

var replayclickable = false;

//sounds
var volume = 30;
var soundJump = new buzz.sound("/static/assets/sounds/sfx_wing.ogg");
var soundScore = new buzz.sound("/static/assets/sounds/sfx_point.ogg");
var soundHit = new buzz.sound("/static/assets/sounds/sfx_hit.ogg");
var soundDie = new buzz.sound("/static/assets/sounds/sfx_die.ogg");
var soundSwoosh = new buzz.sound("/static/assets/sounds/sfx_swooshing.ogg");
buzz.all().setVolume(volume);


var test_time = Date.now()
//loops
var loopGameloop;
var loopPipeloop;
var multiplayerLoop

$(window).load(() => {

  webSockets()
  if (window.location.search == "?debug")
    debugmode = true;
  if (window.location.search == "?easy")
    pipeheight = 200;

  //get the highscore


  //start with the splash screen
  showSplash();


});


function webSockets() {
  var clients = []
  socket.on('connect', () => {

    $('#player').prepend( `<p class="player_name">${USERNAME}</p>` );
    console.log('connected')
    socket.emit('entered_game')

  });


  socket.on('player_bird',(data) => {
    console.log(data.bird)

    if (data.bird === "yellowbird") {
      $('#player').addClass('bird')
      $('#player_2').addClass('bird-red')
    }
    if (data.bird === "redbird") {
      $('#player').addClass('bird-red')
      $('#player_2').addClass('bird')
    }


  });



  socket.on('initalize_game', (data) => {
    console.log('initalizing game')
    $('.play-again').css('text-align', '')
    $('.play-again').css('left', '61px')
    //if any of the players previously died show them again
    $('#player').show()
    $('#player_2').show()

    //hides return to menu button
    $('#return-to-menu').hide()
    //get get incoming pipe data from server

    server_pipes = data.pipes
    console.log(server_pipes)
    //set the game countdown and after 3 seconds start the game for each client
    countDown(2);
    setTimeout(function() {
      startGame()
    }, data.start);
  });



  socket.on('play_again', (data) => {
    console.log(data)
    $('.play-again').text(data.message)
    $('.play-again').css('text-align', 'center')
    $('.play-again').css('left', '')
  });


  socket.on('update_player_position', (data) => {
    console.log('updating player position')
    player2position = data.position
    player2velocity = jump
  });

  socket.on('player_dead', (data) => {
    if (data.username === USERNAME) {
      $('#player').hide()
    } else {
      $('#player_2').hide()
    }
    soundHit.play().bindOnce("ended", function() {
      soundDie.play().bindOnce("ended", function() {

      });
    });
  });

  socket.on('game_ended', (data) => {
    console.log('game ended')
    $(".animated").css('animation-play-state', 'paused');
    $(".animated").css('-webkit-animation-play-state', 'paused');
    $('#return-to-menu').show()
    clearInterval(loopPipeloop)
    loopPipeloop = null;
    clearInterval(multiplayerLoop)
    multiplayerLoop = null;
    showScore(data)
  });
}

function countDown(i) {
  console.log('countdown')
  $('#flyarea').append('<div id="countdown"></div>')
  var int = setInterval(function() {
    $('#countdown').empty();
    $('#countdown').append("<img src='/static/assets/font_big_" + i + ".png' alt='" + i + "'>")
    i-- || clearInterval(int); //if i is 0, then stop the interval
    if (i == -1) {
      $('#countdown').remove()
    }
  }, 1000);
}


function showSplash() {
  currentstate = states.SplashScreen;

  //set the defaults (again)
  velocity = 0;
  position = 180;
  rotation = 0;
  score = 0;

  //update the player in preparation for the next game
  $("#player").css({
    y: 0,
    x: 0
  });
  $("#player_2").css({
    y: 30,
    x: 0
  });
  updatePlayer($("#player_2"));
  updatePlayer($("#player"));


  soundSwoosh.stop();
  soundSwoosh.play();

  //clear out all the pipes if there are any
  $(".pipe").remove();
  pipes = new Array();

  //make everything animated again
  $(".animated").css('animation-play-state', 'running');
  $(".animated").css('-webkit-animation-play-state', 'running');

  //fade in the splash
  $("#splash").transition({
    opacity: 1
  }, 2000, 'ease');
}

function startGame() {
  currentstate = states.GameScreen;

  //fade out the splash
  $("#splash").stop();
  $("#splash").transition({
    opacity: 0
  }, 500, 'ease');

  //update the big score
  setBigScore();

  //debug mode?
  if (debugmode) {
    //show the bounding boxes
    $(".boundingbox").show();
  }

  //start up our loops
  var updaterate = 1000.0 / 60.0; //60 times a second
  loopGameloop = setInterval(gameloop, updaterate);
  loopPipeloop = setInterval(updatePipes, 1400);
  multiplayerLoop = setInterval(multiplayer, updaterate)
}

function updatePlayer2(player) {
  player2rotation = Math.min((player2velocity / 10) * 90, 90);


  //apply rotation and position
  $(player).css({
    rotate: player2rotation,
    top: player2position
  });
}

function updatePlayer(player) {
  //rotation
  rotation = Math.min((velocity / 10) * 90, 90);

  //apply rotation and position
  $(player).css({
    rotate: rotation,
    top: position
  });
}


function multiplayer() {

  var player_2 = $("#player_2");
  player2velocity += player2Gravity;
  player2position += player2velocity;
  updatePlayer2(player_2)
}


function gameloop() {
  var player = $("#player");
  //update the player speed/position
  velocity += gravity;
  position += velocity;


  //console.log(velocity,position)
  //update the player
  updatePlayer(player);


  //create the bounding box
  var box = document.getElementById('player').getBoundingClientRect();
  var origwidth = 34.0;
  var origheight = 24.0;

  var boxwidth = origwidth - (Math.sin(Math.abs(rotation) / 90) * 8);
  var boxheight = (origheight + box.height) / 2;
  var boxleft = ((box.width - boxwidth) / 2) + box.left;
  var boxtop = ((box.height - boxheight) / 2) + box.top;
  var boxright = boxleft + boxwidth;
  var boxbottom = boxtop + boxheight;

  //if we're in debug mode, draw the bounding box
  if (debugmode) {
    var boundingbox = $("#playerbox");
    boundingbox.css('left', boxleft);
    boundingbox.css('top', boxtop);
    boundingbox.css('height', boxheight);
    boundingbox.css('width', boxwidth);
  }

  //did we hit the ground?
  if (box.bottom >= $("#land").offset().top) {
    playerDead();
    return;
  }

  //have they tried to escape through the ceiling? :o
  var ceiling = $("#ceiling");
  if (boxtop <= (ceiling.offset().top + ceiling.height()))
    position = 0;

  //we can't go any further without a pipe
  if (pipes[0] == null)
    return;

  //determine the bounding box of the next pipes inner area

  var nextpipe = pipes[0];
  var nextpipeupper = nextpipe.children(".pipe_upper");
  var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
  var pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
  var piperight = pipeleft + pipewidth;
  var pipebottom = pipetop + pipeheight;

  if (debugmode) {
    var boundingbox = $("#pipebox");
    boundingbox.css('left', pipeleft);
    boundingbox.css('top', pipetop);
    boundingbox.css('height', pipeheight);
    boundingbox.css('width', pipewidth);
  }

  //have we gotten inside the pipe yet?
  if (boxright > pipeleft) {
    //we're within the pipe, have we passed between upper and lower pipes?
    if (boxtop > pipetop && boxbottom < pipebottom) {
      //yeah! we're within bounds

    } else {
      //no! we touched the pipe
      playerDead();
      return;
    }
  }


  //have we passed the imminent danger?
  if (boxleft > piperight) {
    //yes, remove it
    pipes.splice(0, 1);

    //and score a point
    playerScore();
  }
}

//Handle space bar
$(document).keydown(function(e) {
  //space bar!
  if (e.keyCode == 32) {
    //in ScoreScreen, hitting space should click the "replay" button. else it's just a regular spacebar hit
    if (currentstate == states.ScoreScreen)
      $("#replay").click();
    else
      screenClick();
  }
});

//STOPS IOS DOUBLE TAP ZOOM IN
///window.addEventListener(
    ///"touchmove",
    ///function(event) {
        ///if (event.scale !== 1) {
          ///  event.preventDefault();
        ///}
  ///  },
    ///{ passive: false }
///);

//Handle mouse down OR touch start
if ("ontouchstart" in window) {
  $(document).on("touchstart", screenClick);
} else {
  $(document).on("mousedown", screenClick);
}

function screenClick() {
  if (currentstate == states.GameScreen) {
    playerJump();
  } else if (currentstate == states.SplashScreen) {
    //startGame();
  }
}

function playerJump() {
  velocity = jump;
  //play jump sound
  soundJump.stop();
  soundJump.play();
  socket.emit('player_position', {
    velocity: velocity,
    position: position,
    time: Date.now()
  })
}

function setBigScore(erase) {
  var elemscore = $("#bigscore");
  elemscore.empty();

  if (erase)
    return;

  var digits = score.toString().split('');

  for (var i = 0; i < digits.length; i++) {
    elemscore.append("<img src='/static/assets/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
  }

}

function setSmallScore() {
  var elemscore = $("#player1_score");
  elemscore.empty();

  var digits = score.toString().split('');
  for (var i = 0; i < digits.length; i++)
    elemscore.append("<img src='/static/assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setHighScore(data) {

  var winner = ''
  var player1 = $("#player1_score");
  var player2 = $("#player2_score")
  $('.play-again').text('Play Again?')

  player1.empty();
  player2.empty();


  for (var i = 0; i < data.length; i++) {

    if (data[i].name === USERNAME) {
      var p1digits = data[i].score.toString().split('');
      $('#scoreboard_label_player1').text(USERNAME)
    } else {
      var p2digits = data[i].score.toString().split('');
      $('#scoreboard_label_player2').text(data[i].name)
    }
  }
  for (var i = 0; i < p1digits.length; i++) {
    player1.append("<img src='/static/assets/font_small_" + p1digits[i] + ".png' alt='" + p1digits[i] + "'>");
  }

  for (var i = 0; i < p2digits.length; i++) {
    player2.append("<img src='/static/assets/font_small_" + p2digits[i] + ".png' alt='" + p2digits[i] + "'>");
  }
}

function setMedal() {
  var elemmedal = $("#medal");
  elemmedal.empty();

  if (score < 10)
    //signal that no medal has been won
    return false;

  if (score >= 10)
    medal = "bronze";
  if (score >= 20)
    medal = "silver";
  if (score >= 30)
    medal = "gold";
  if (score >= 40)
    medal = "platinum";

  elemmedal.append('<img src="/static/assets/medal_' + medal + '.png" alt="' + medal + '">');

  //signal that a medal has been won
  return true;
}

function playerDead() {

  //stop animating everything!
  //$(".animated").css('animation-play-state', 'paused');
  // $(".animated").css('-webkit-animation-play-state', 'paused');

  //drop the bird to the floor
  var playerbottom = $("#player").position().top + $("#player").width(); //we use width because he'll be rotated 90 deg
  var floor = flyArea;
  var movey = Math.max(0, floor - playerbottom);
  $("#player").transition({
    y: movey + 'px',
    rotate: 90
  }, 1000, 'easeInOutCubic');

  //it's time to change states. as of now we're considered ScoreScreen to disable left click/flying
  currentstate = states.ScoreScreen;

  //destroy our gameloops
  clearInterval(loopGameloop);
  //clearInterval(loopPipeloop);
  // clearInterval(multiplayerLoop)

  loopGameloop = null;
  //loopPipeloop = null;

  //mobile browsers don't support buzz bindOnce event
  if (isIncompatible.any()) {
    //skip right to showing score
    //  showScore();
  } else {
    //play the hit sound (then the dead sound) and then show score
    soundHit.play().bindOnce("ended", function() {
      soundDie.play().bindOnce("ended", function() {

      });
    });
  }
  socket.emit('player_dead')
}

function showScore(data) {
  //unhide us
  $("#scoreboard").css("display", "block");

  //remove the big score
  setBigScore(true);

  //have they beaten their high score?
  if (score > highscore) {
    //yeah!
    highscore = score;
    //save it!

  }

  //update the scoreboard
  setSmallScore();
  setHighScore(data);
  var wonmedal = setMedal();

  //SWOOSH!
  soundSwoosh.stop();
  soundSwoosh.play();

  //show the scoreboard
  $("#scoreboard").css({
    y: '40px',
    opacity: 0
  }); //move it down so we can slide it up
  $("#replay").css({
    y: '40px',
    opacity: 0
  });
  $("#scoreboard").transition({
    y: '0px',
    opacity: 1
  }, 600, 'ease', function() {
    //When the animation is done, animate in the replay button and SWOOSH!
    soundSwoosh.stop();
    soundSwoosh.play();
    $("#replay").transition({
      y: '0px',
      opacity: 1
    }, 600, 'ease');

    //also animate in the MEDAL! WOO!
    if (wonmedal) {
      $("#medal").css({
        scale: 2,
        opacity: 0
      });
      $("#medal").transition({
        opacity: 1,
        scale: 1
      }, 1200, 'ease');
    }
  });

  //make the replay button clickable
  replayclickable = true;
}

$("#replay").click(function() {
  //make sure we can only click once
  if (!replayclickable)
    return;
  else
    replayclickable = false;
  //SWOOSH!
  soundSwoosh.stop();
  soundSwoosh.play();

  //fade out the scoreboard
  $("#scoreboard").transition({
    y: '-40px',
    opacity: 0
  }, 1000, 'ease', function() {
    //when that's done, display us back to nothing
    $("#scoreboard").css("display", "none");

    //start the game over!
    showSplash();
  });
  socket.emit('play_again')
});

function playerScore() {
  score += 1;
  socket.emit('update_score', score)
  //play score sound
  soundScore.stop();
  soundScore.play();
  setBigScore();
}

function updatePipes() {
  //Do any pipes need removal?
  $(".pipe").filter(function() {
    return $(this).position().left <= -100;
  }).remove()

  var pipe = $(server_pipes[server_pipes_iter])

  $("#flyarea").append(pipe);
  pipes.push(pipe);

  server_pipes_iter++
}

var isIncompatible = {
  Android: function() {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function() {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function() {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Safari: function() {
    return (navigator.userAgent.match(/OS X.*Safari/) && !navigator.userAgent.match(/Chrome/));
  },
  Windows: function() {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function() {
    return (isIncompatible.Android() || isIncompatible.BlackBerry() || isIncompatible.iOS() || isIncompatible.Opera() || isIncompatible.Safari() || isIncompatible.Windows());
  }
};
