import $ from 'jquery';


class Dashboard {
  constructor() {

    this.totalScore = null;
    this.totalWins = null;
    this.totalDefeats = null;


    $(document).ready(() => {
      this.getUserScores('./player_stats')
    });

    
    this.addClickListiners()
  }


  async getUserScores(url) {
    console.log('getting scores')
    await $.ajax({
        url: url,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: (data) => {
          console.log(data)
          this.totalScore = String(data.stats.total_score)
          this.totalWins = String(data.stats.total_wins)
          this.totalDefeats = String(data.stats.total_defeats)
          this.renderScores()
        }
      });
  }

  renderScores() {

    let totalScore = this.totalScore.split('');
    let totalWins = this.totalWins.split('');
    let totalDefeats = this.totalDefeats.split('');


    let totalScoreHeading = $('#dashboard--total_score')
    let totalWinsHeading = $('#dashboard--total_wins')
    let totalDefeatsHeading = $('#dashboard--total_defeats')


    for (var i = 0; i < totalScore.length; i++) {
      totalScoreHeading.append("<img src='/static/assets/font_big_" + totalScore[i] + ".png' alt='" + totalScore[i] + "'>");
    }
    for (var i = 0; i < totalWins.length; i++) {
      totalWinsHeading.append("<img src='/static/assets/font_big_" + totalWins[i] + ".png' alt='" + totalWins[i] + "'>");
    }
    for (var i = 0; i < totalDefeats.length; i++) {
      totalDefeatsHeading.append("<img src='/static/assets/font_big_" + totalDefeats[i] + ".png' alt='" + totalDefeats[i] + "'>");
    }
  }

  addClickListiners() {
    let matchmakeCard = $('.dashboard--matchmake');
    //submits form onclick
    matchmakeCard.click(() => {
      //moves player into lobby to start matchmaking on form submit
      $('#dashboard--matchmake_form').submit()
    })
  }
}

module.exports = new Dashboard()
