var webpack = require('webpack');  
module.exports = {  
  entry: './src/app.ts',
  output: {
    filename: './dist/app.js'
  },
  // Turn on sourcemaps
  devtool: 'cheap-source-map',
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  // Add minification
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ],
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: 'ts' }
    ]
  }
}