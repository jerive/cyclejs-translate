var webpack = require('webpack');
module.exports = {  
  entry: './src/app.tsx',
  output: {
    filename: './dist/app.js'
  },
  // Turn on sourcemaps
  devtool: 'cheap-source-map',
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json']
  },
  // Add minification
  plugins: [
    //new webpack.optimize.UglifyJsPlugin()
  ],
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  }
}