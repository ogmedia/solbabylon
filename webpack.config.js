const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
     index: './src/index.ts',
   },
   devtool: 'inline-source-map',
   devServer: {
     static: './dist',
   },
   plugins: [
     new HtmlWebpackPlugin({
      title: 'Development',
     }),
   ],
   output: {
     filename: 'bundle.js',
     path: path.resolve(__dirname, 'dist'),
     clean: true,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/
        }]
    }
};