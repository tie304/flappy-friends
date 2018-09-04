import $ from 'jquery';

class Leaderboard {
  constructor() {
    this.postUrl = '/leaderboard/search'
    this.init()
  }

  init() {
    $('#leaderboard--search_input, #leaderboard--search_button').change(() => {
      let query = $('#leaderboard--search_input').val()
      if (query == '') {
        location.reload()
      } else {
        this.postData(query)
      }
    });
  }


  postData(query) {
    $.ajax({
      url: this.postUrl,
      type: "POST",
      data: JSON.stringify({
        "name": query
      }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: (results) => {
        this.displaySearchResults(results)
      }
    });

  }

  displaySearchResults(results) {
    $('#leaderboard--score-list').empty()
    $('.leaderboard--messages').empty()
    if (results.length > 0) {
      results.forEach((result) => {
        $('#leaderboard--score-list').append(`
        <div class="list-group-item list-group-item-action">
          <div class="row">
            <div class="col-md-3">
            Player: ${result.display_name}
            </div>
            <div class="col-md-3">
              Total Wins: ${result.total_wins}
            </div>
            <div class="col-md-3">
              Total Defeats: ${result.total_defeats}
            </div>
            <div class="col-md-3">
              Total Score:${result.total_score}
            </div>
          </div>
        </div>`)
      });
    } else {
      $('.leaderboard--messages').append('<h1>No players with that name or email</h1>')
    }
  }
}

module.exports = new Leaderboard()
