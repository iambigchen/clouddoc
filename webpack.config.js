const path = require('path')

module.exports = {
  target: 'electron-main',
  entry: './main.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'main.js'
  },
  node: {
    __dirname: false
  }
}