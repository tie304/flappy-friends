const webpack = require("webpack");

module.exports = {
  //entry point

  entry: {
    dashboard: ["babel-polyfill", "./static/js/dashboard.js"],
    leaderboard: ["./static/js/leaderboard.js"],
    lobby: ["./static/js/lobby.js"],
    game: ["babel-polyfill", "./static/js/game.js"]
  },
  output: {
    path: __dirname + "/static/dist",
    filename: "[name]-bundle.js"
  },

  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      buzz: "buzz"
    })
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: "babel-loader",
        query: {
          presets: ["env"]
        }
      }
    ]
  }
};
