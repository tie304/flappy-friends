import $ from "jquery";
import io from "socket.io-client";
import buzz from "buzz";
import "jquery.transit";

class Game {
  constructor() {
    this.href = location.href;
    this.gameID = this.href.match(/([^\/]*)\/*$/)[1];

    this.socket = io.connect(
      location.protocol +
        "//" +
        document.domain +
        ":" +
        location.port +
        `/${this.gameID}`
    );

    this.debugmode = false;

    this.states = Object.freeze({
      SplashScreen: 0,
      GameScreen: 1,
      ScoreScreen: 2
    });

    this.currentstate;
    this.serverPipes = [];
    this.serverPipesIter = 0;

    this.players = [];

    this.player2Gravity = 0.25;
    this.player2velocity = 0;
    this.player2position = 180;
    this.player2rotation = 0;

    this.gravity = 0.25;
    this.velocity = 0;
    this.position = 180;
    this.rotation = 0;
    this.jump = -4.6;
    this.flyArea = $("#flyarea").height();

    this.score = 0;
    this.highscore = 0;

    this.pipeheight = 90;
    this.pipewidth = 52;
    this.pipes = new Array();

    this.replayclickable = false;
    this.isIncompatible = {
      Android: () => {
        return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: () => {
        return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: () => {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: () => {
        return navigator.userAgent.match(/Opera Mini/i);
      },
      Safari: () => {
        return (
          navigator.userAgent.match(/OS X.*Safari/) &&
          !navigator.userAgent.match(/Chrome/)
        );
      },
      Windows: () => {
        return navigator.userAgent.match(/IEMobile/i);
      },
      any: () => {
        return (
          this.isIncompatible.Android() ||
          this.isIncompatible.BlackBerry() ||
          this.isIncompatible.iOS() ||
          this.isIncompatible.Opera() ||
          this.isIncompatible.Safari() ||
          this.isIncompatible.Windows()
        );
      }
    };

    //sounds
    this.volume = 30;
    this.soundJump = new buzz.sound("/static/assets/sounds/sfx_wing.ogg");
    this.soundScore = new buzz.sound("/static/assets/sounds/sfx_point.ogg");
    this.soundHit = new buzz.sound("/static/assets/sounds/sfx_hit.ogg");
    this.soundDie = new buzz.sound("/static/assets/sounds/sfx_die.ogg");
    this.soundSwoosh = new buzz.sound(
      "/static/assets/sounds/sfx_swooshing.ogg"
    );

    this.test_time = Date.now();
    //loops
    this.loopGameloop;
    this.loopPipeloop;
    this.multiplayerLoop;
    //Add sounds
    buzz.all().setVolume(this.volume);

    //Bindings
    this.updatePlayer = this.updatePlayer.bind(this);
    this.updatePlayer2 = this.updatePlayer2.bind(this);
    this.gameloop = this.gameloop.bind(this);
    this.multiplayer = this.multiplayer.bind(this);
    this.playerDead = this.playerDead.bind(this);
    this.screenClick = this.screenClick.bind(this);
    this.updatePipes = this.updatePipes.bind(this);
    this.showScore = this.showScore.bind(this);
    this.playerScore = this.playerScore.bind(this);
    this.setMedal = this.setMedal.bind(this);

    this.listeners();
  }

  listeners() {
    console.log(self);
    //when window is fully loaded including assets
    $(window).on("load", () => {
      this.socket.emit("entered_game");
    });

    $(document).ready(() => {
      //activate websockets events
      this.webSockets();
      // show splash screen to start
      this.showSplash();
    });

    //Handle space bar
    $(document).keydown(e => {
      //space bar!
      if (e.keyCode == 32) {
        //in ScoreScreen, hitting space should click the "replay" button. else it's just a regular spacebar hit
        if (this.currentstate == this.states.ScoreScreen) {
          $("#replay").click();
        } else {
          this.screenClick();
        }
      }
    });

    if ("ontouchstart" in window) {
      $(document).on("touchstart", this.screenClick);
    } else {
      $(document).on("mousedown", this.screenClick);
    }

    $("#replay").click(() => {
      //make sure we can only click once
      if (!this.replayClickable) {
        return;
      } else {
        this.replayClickable = false;
      }
      //SWOOSH!
      this.soundSwoosh.stop();
      this.soundSwoosh.play();

      //fade out the scoreboard
      $("#scoreboard").transition(
        {
          y: "-40px",
          opacity: 0
        },
        1000,
        "ease",
        () => {
          //when that's done, display us back to nothing
          $("#scoreboard").css("display", "none");

          //start the game over!
          this.showSplash();
        }
      );
      this.socket.emit("play_again");
    });
  }

  webSockets() {
    console.log("websockets running");
    this.socket.on("connect", () => {
      $("#player").prepend(`<p class="player_name">${USERNAME}</p>`);
      console.log("connected");
    });

    this.socket.on("player_bird", data => {
      console.log("bird selections");

      if (data.bird === "yellowbird") {
        $("#player").addClass("bird");
        $("#player_2").addClass("bird-red");
      }
      if (data.bird === "redbird") {
        $("#player").addClass("bird-red");
        $("#player_2").addClass("bird");
      }
    });

    this.socket.on("initalize_game", data => {
      console.log("initalizing game");
      $(".play-again").css("text-align", "");
      $(".play-again").css("left", "61px");
      //if any of the players previously died show them again
      $("#player").show();
      $("#player_2").show();

      //hides return to menu button
      $("#return-to-menu").hide();

      //get get incoming pipe data from server
      this.serverPipes = data.pipes;

      //set the game countdown and after 3 seconds start the game for each client
      this.countDown(2);
      setTimeout(() => {
        this.startGame();
      }, data.start);
    });

    this.socket.on("play_again", data => {
      console.log("play again");
      $(".play-again").text(data.message);
      $(".play-again").css("text-align", "center");
      $(".play-again").css("left", "");
    });

    this.socket.on("update_player_position", data => {
      console.log("updating player position");
      this.player2position = data.position;
      this.player2velocity = this.jump;
    });

    this.socket.on("player_dead", data => {
      console.log("player dead");
      if (data.username === USERNAME) {
        $("#player").hide();
      } else {
        $("#player_2").hide();
      }
      this.soundHit.play().bindOnce("ended", () => {
        this.soundDie.play().bindOnce("ended", () => {});
      });
    });

    this.socket.on("game_ended", data => {
      console.log("game ended");
      $(".animated").css("animation-play-state", "paused");
      $(".animated").css("-webkit-animation-play-state", "paused");
      $("#return-to-menu").show();
      clearInterval(this.loopPipeloop);
      this.loopPipeloop = null;
      clearInterval(this.multiplayerLoop);
      this.multiplayerLoop = null;
      this.showScore(data);
    });
  }

  //countdown to start
  countDown(i) {
    console.log("countdown");
    //add countdown div
    $("#flyarea").append('<div id="countdown"></div>');
    //for each count grab the corresponding number
    const int = setInterval(function() {
      $("#countdown").empty();
      $("#countdown").append(
        "<img src='/static/assets/font_big_" + i + ".png' alt='" + i + "'>"
      );
      i-- || clearInterval(int); //if i is 0, then stop the interval
      if (i == -1) {
        $("#countdown").remove();
      }
    }, 1000);
  } //End countdown

  showSplash() {
    //change state to splash screen
    this.currentstate = this.states.SplashScreen;
    //set the defaults
    this.velocity = 0;
    this.position = 180;
    this.rotation = 0;
    this.score = 0;

    //update the player in preparation for the next game
    $("#player").css({
      y: 0,
      x: 0
    });
    $("#player_2").css({
      y: 30,
      x: 0
    });

    this.updatePlayer($("#player_2"));
    this.updatePlayer($("#player"));

    this.soundSwoosh.stop();
    this.soundSwoosh.play();

    //clear out all the pipes if there are any
    $(".pipe").remove();
    this.pipes = new Array();

    //make everything animated again
    $(".animated").css("animation-play-state", "running");
    $(".animated").css("-webkit-animation-play-state", "running");

    //fade in the splash
    $("#splash").transition(
      {
        opacity: 1
      },
      2000,
      "ease"
    );
  }
  startGame() {
    this.currentstate = this.states.GameScreen;

    //fade out the splash
    $("#splash").stop();
    $("#splash").transition(
      {
        opacity: 0
      },
      500,
      "ease"
    );

    //update the big score
    this.setBigScore();

    //debug mode?
    if (this.debugmode) {
      //show the bounding boxes
      $(".boundingbox").show();
    }

    //start up our loops
    const updaterate = 1000.0 / 60.0; //60 times a second
    this.loopGameloop = setInterval(this.gameloop, updaterate);
    this.loopPipeloop = setInterval(this.updatePipes, 1400);
    this.multiplayerLoop = setInterval(this.multiplayer, updaterate);
  }

  updatePlayer2(player) {
    this.player2rotation = Math.min((this.player2velocity / 10) * 90, 90);

    //apply rotation and position
    $(player).css({
      rotate: this.player2rotation,
      top: this.player2position
    });
  }

  updatePlayer(player) {
    //rotation
    this.rotation = Math.min((this.velocity / 10) * 90, 90);

    //apply rotation and position
    $(player).css({
      rotate: this.rotation,
      top: this.position
    });
  }

  multiplayer() {
    const player_2 = $("#player_2");
    this.player2velocity += this.player2Gravity;
    this.player2position += this.player2velocity;

    this.updatePlayer2(player_2);
  }
  gameloop() {
    const player = $("#player");
    //update the player speed/position
    this.velocity += this.gravity;
    this.position += this.velocity;

    //update the player
    this.updatePlayer(player);

    //create the bounding box
    const box = document.getElementById("player").getBoundingClientRect();
    const origwidth = 34.0;
    const origheight = 24.0;

    const boxwidth = origwidth - Math.sin(Math.abs(this.rotation) / 90) * 8;
    const boxheight = (origheight + box.height) / 2;
    const boxleft = (box.width - boxwidth) / 2 + box.left;
    const boxtop = (box.height - boxheight) / 2 + box.top;
    const boxright = boxleft + boxwidth;
    const boxbottom = boxtop + boxheight;

    //if we're in debug mode, draw the bounding box
    if (this.debugmode) {
      const boundingbox = $("#playerbox");
      boundingbox.css("left", boxleft);
      boundingbox.css("top", boxtop);
      boundingbox.css("height", boxheight);
      boundingbox.css("width", boxwidth);
    }

    //did we hit the ground?
    if (box.bottom >= $("#land").offset().top) {
      this.playerDead();
      return;
    }

    //have they tried to escape through the ceiling? :o
    const ceiling = $("#ceiling");
    if (boxtop <= ceiling.offset().top + ceiling.height()) this.position = 0;

    //we can't go any further without a pipe
    if (this.pipes[0] == null) return;

    //determine the bounding box of the next pipes inner area

    const nextpipe = this.pipes[0];
    const nextpipeupper = nextpipe.children(".pipe_upper");
    const pipetop = nextpipeupper.offset().top + nextpipeupper.height();
    const pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
    const piperight = pipeleft + this.pipewidth;
    const pipebottom = pipetop + this.pipeheight;

    if (this.debugmode) {
      const boundingbox = $("#pipebox");
      boundingbox.css("left", pipeleft);
      boundingbox.css("top", pipetop);
      boundingbox.css("height", this.pipeheight);
      boundingbox.css("width", this.pipewidth);
    }

    //have we gotten inside the pipe yet?
    if (boxright > pipeleft) {
      //we're within the pipe, have we passed between upper and lower pipes?
      if (boxtop > pipetop && boxbottom < pipebottom) {
        //yeah! we're within bounds
      } else {
        //no! we touched the pipe
        this.playerDead();
        return;
      }
    }

    //have we passed the imminent danger?
    if (boxleft > piperight) {
      //yes, remove it
      this.pipes.splice(0, 1);

      //and score a point
      this.playerScore();
    }
  }
  // Handles click event on the screen
  screenClick() {
    if (this.currentstate == this.states.GameScreen) {
      this.playerJump();
    }
  }
  //Bird jumps on screenClick, moble tap or spacebar hit
  playerJump() {
    this.velocity = this.jump;
    //play jump sound
    this.soundJump.stop();
    this.soundJump.play();
    //Emits websocket data on players current position
    this.socket.emit("player_position", {
      velocity: this.velocity,
      position: this.position,
      time: Date.now()
    });
  }

  setBigScore(erase) {
    const elemscore = $("#bigscore");
    elemscore.empty();

    if (erase) return;

    const digits = this.score.toString().split("");

    for (let i = 0; i < digits.length; i++) {
      elemscore.append(
        "<img src='/static/assets/font_big_" +
          digits[i] +
          ".png' alt='" +
          digits[i] +
          "'>"
      );
    }
  }

  setSmallScore() {
    const elemscore = $("#player1_score");
    elemscore.empty();
    const digits = this.score.toString().split("");

    for (let i = 0; i < digits.length; i++)
      elemscore.append(
        "<img src='/static/assets/font_small_" +
          digits[i] +
          ".png' alt='" +
          digits[i] +
          "'>"
      );
  }

  setHighScore(data) {
    let p1digits;
    let p2digits;

    const player1 = $("#player1_score");
    const player2 = $("#player2_score");

    $(".play-again").text("Play Again?");

    player1.empty();
    player2.empty();

    for (let i = 0; i < data.length; i++) {
      if (data[i].name === USERNAME) {
        p1digits = data[i].score.toString().split("");
        $("#scoreboard_label_player1").text(USERNAME);
      } else {
        p2digits = data[i].score.toString().split("");
        $("#scoreboard_label_player2").text(data[i].name);
      }
    }
    for (let i = 0; i < p1digits.length; i++) {
      player1.append(
        "<img src='/static/assets/font_small_" +
          p1digits[i] +
          ".png' alt='" +
          p1digits[i] +
          "'>"
      );
    }

    for (let i = 0; i < p2digits.length; i++) {
      player2.append(
        "<img src='/static/assets/font_small_" +
          p2digits[i] +
          ".png' alt='" +
          p2digits[i] +
          "'>"
      );
    }
  }
  setMedal() {
    const elemmedal = $("#medal");
    elemmedal.empty();

    if (this.score < 10)
      //signal that no medal has been won
      return false;

    if (this.score >= 10) medal = "bronze";
    if (this.score >= 20) medal = "silver";
    if (this.score >= 30) medal = "gold";
    if (this.score >= 40) medal = "platinum";

    elemmedal.append(
      '<img src="/static/assets/medal_' + medal + '.png" alt="' + medal + '">'
    );

    //signal that a medal has been won
    return true;
  }

  playerDead() {
    //stop animating everything!

    //drop the bird to the floor
    const playerbottom = $("#player").position().top + $("#player").width(); //we use width because he'll be rotated 90 deg
    const floor = this.flyArea;
    const movey = Math.max(0, floor - playerbottom);

    $("#player").transition(
      {
        y: movey + "px",
        rotate: 90
      },
      1000,
      "easeInOutCubic"
    );

    //it's time to change states. as of now we're considered ScoreScreen to disable left click/flying
    this.currentstate = this.states.ScoreScreen;

    //destroy our gameloop
    clearInterval(this.loopGameloop);

    this.loopGameloop = null;

    //mobile browsers don't support buzz bindOnce event
    if (this.isIncompatible.any()) {
      //skip right to showing score
      //  showScore();
    } else {
      //play the hit sound (then the dead sound) and then show score
      this.soundHit.play().bindOnce("ended", () => {
        this.soundDie.play().bindOnce("ended", () => {});
      });
    }
    this.socket.emit("player_dead");
  }

  showScore(data) {
    //unhide us
    $("#scoreboard").css("display", "block");

    //remove the big score
    this.setBigScore(true);

    //have they beaten their high score?
    if (this.score > this.highscore) {
      //yeah!
      this.highscore = this.score;
      //save it!
    }

    //update the scoreboard
    this.setSmallScore();
    this.setHighScore(data);
    const wonmedal = this.setMedal();

    //SWOOSH!
    this.soundSwoosh.stop();
    this.soundSwoosh.play();

    //show the scoreboard
    $("#scoreboard").css({
      y: "40px",
      opacity: 0
    }); //move it down so we can slide it up
    $("#replay").css({
      y: "40px",
      opacity: 0
    });
    $("#scoreboard").transition(
      {
        y: "0px",
        opacity: 1
      },
      600,
      "ease",
      () => {
        //When the animation is done, animate in the replay button and SWOOSH!
        this.soundSwoosh.stop();
        this.soundSwoosh.play();
        $("#replay").transition(
          {
            y: "0px",
            opacity: 1
          },
          600,
          "ease"
        );

        //also animate in the MEDAL! WOO!
        if (wonmedal) {
          $("#medal").css({
            scale: 2,
            opacity: 0
          });
          $("#medal").transition(
            {
              opacity: 1,
              scale: 1
            },
            1200,
            "ease"
          );
        }
      }
    );

    //make the replay button clickable
    this.replayClickable = true;
  }
  playerScore() {
    this.score += 1;
    this.socket.emit("update_score", this.score);
    //play score sound
    this.soundScore.stop();
    this.soundScore.play();
    this.setBigScore();
  }
  updatePipes() {
    //Do any pipes need removal?
    $(".pipe")
      .filter(function() {
        return $(this).position().left <= -100;
      })
      .remove();

    const pipe = $(this.serverPipes[this.serverPipesIter]);

    $("#flyarea").append(pipe);

    this.pipes.push(pipe);

    this.serverPipesIter++;
  }
}

const G = new Game();
