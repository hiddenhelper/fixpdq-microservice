const AwsSamPlugin = require('aws-sam-webpack-plugin');

const awsSamPlugin = new AwsSamPlugin({
  vscodeDebug: false
});

module.exports = {
  // Loads the entry object from the AWS::Serverless::Function resources in your
  // template.yaml or template.yml
  entry: awsSamPlugin.entry(),

  // Write the output to the .aws-sam/build folder
  output: {
    filename: '[name]/app.js',
    libraryTarget: 'commonjs2',
    path: __dirname + '/.aws-sam/build/',
  },

  // Create source maps
  devtool: process.env.NODE_ENV !== 'production' ? 'source-map' : false,

  // Resolve .js extensions (optional .ts for now)
  resolve: {
    extensions: ['.js'],
  },

  // Target node
  target: 'node',

  // Includes the aws-sdk only for development. The node10.x docker image
  // used by SAM CLI Local doens't include it but it's included in the actual
  // Lambda runtime.
  //externals: process.env.NODE_ENV === "development" ? [] : ["aws-sdk"],

  // Set the webpack mode
  mode: process.env.NODE_ENV || 'development',


  module: {
    rules: [
      // JavaScript/JSX Files
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      // Add the TypeScript loader
      // {
      //   test: /\.tsx?$/,
      //   loader: 'ts-loader',
      // },
    ],
  },

  // Add the AWS SAM Webpack plugin
  plugins: [awsSamPlugin],

  // exclude aws-sdk from the build file
  externals: {
    'aws-sdk': 'aws-sdk'
  }
};
