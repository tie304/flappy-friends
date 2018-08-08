

class Lobby {
  constructor() {
    this.lobbyID = location.href.match(/([^\/]*)\/*$/)[1]
    this.socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + `/${this.lobbyID}`);
    window.onload = () => {
      this.connect()
    }
  }


  connect() {
    this.socket.on('connect', () => {
        this.runSockets()
        this.eventListen()
    })
  }

  eventListen() {
    $('#send_message').click(() => {
      this.socket.emit('chat', {
        user: USERNAME,
        message: $('#text').val()
      });
      $('#text').val("")
    });

    $('#ready_to_play').click(() => {
      this.startGame()
    });

    $('#redbird, #yellowbird').click((e) => {
      console.log(e.target.id)
        this.socket.emit('bird_selection', {'bird': e.target.id})
    });
  }

  runSockets() {
    this.socket.on('chat_broadcast', (data) => {
      if (USERNAME === data.user) {
        $('#sohbet').append(`
        <div class='balon1 p-2 m-0 position-relative' data-is='${data.user}'>
          <a class='float-right'> ${data.message} </a>
        </div>
        `)
      } else {
        $('#sohbet').append(`
          <div class="balon2 p-2 m-0 position-relative" data-is="${data.user}">
          <a class="float-left sohbet2"> ${data.message} </a>
        </div>`)
      }

    })

    this.socket.on('message_board', (data) => {
      if (data.starting) {
        $('#ready_to_play').text(data.message)
        window.location.href = 'http://' + document.domain + ':' + location.port + `/game/${this.lobbyID}`
      }
      $('#lobby--message_board').prepend(`<li>${data.message}</li>`)

    });

    this.socket.on('selected_bird', (data) => {
      if (data.selected_bird === "yellowbird") {
        $('#yellowbird').hide()
      }
      if (data.selected_bird === "redbird") {
        $('#redbird').hide()
        }
    });



  }
  startGame() {
    this.socket.emit('ready_to_play', {
      user: USERNAME ,message: USERNAME + ' is ready to play'
    });
    $('#ready_to_play').text('waiting on other player').off()
  }

}
new Lobby()
