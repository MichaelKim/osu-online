/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isDev = process.env.NODE_ENV !== 'production';
console.log(
  `===================${isDev ? 'DEV' : 'PROD'}========================`
);

const config = {
  entry: {
    main: path.resolve('./src/index.tsx')
  },
  output: {
    path: path.resolve('./build'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: '>1%, not ie 11, not op_mini all'
                }
              ],
              '@babel/preset-react',
              '@babel/preset-typescript'
            ],
            plugins: ['@babel/plugin-proposal-class-properties', 'const-enum']
          }
        }
      },
      {
        test: /\.module\.scss$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: !isDev,
              modules: {
                localIdentName: isDev
                  ? '[path][name]__[local]'
                  : '[hash:base64]'
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: !isDev
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve('./src/index.html')
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'public' }]
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true
        },
        mode: 'write-references'
      },
      eslint: {
        files: './src/**/*.{js,ts,tsx}'
      }
    }),
    new MiniCssExtractPlugin({
      filename: isDev ? '[name].css' : '[name].[hash].css',
      chunkFilename: isDev ? '[id].css' : '[id].[hash].css'
    })
  ],
  stats: {
    colors: true
  }
};

if (isDev) {
  config.mode = 'development';
  config.devtool = 'cheap-module-source-map';
  config.devServer = {
    contentBase: path.resolve('./build'),
    host: 'localhost',
    port: '8080',
    hot: true,
    overlay: true
  };
} else {
  config.mode = 'production';
  // Basic options, except ignore console statements
  config.optimization = {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: {
            drop_console: true
          }
        }
      })
    ]
  };
  config.plugins.push(new CleanWebpackPlugin());
}

module.exports = config;
