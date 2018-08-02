class Dashboard {
  constructor(total_score, total_wins, total_defeats) {
    this.totalScore = String(total_score);
    this.totalWins = String(total_wins);
    this.totalDefeats = String(total_defeats);
    this.renderScores()
    this.addClickListiners()
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
