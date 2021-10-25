/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CssoWebpackPlugin = require('csso-webpack-plugin').default;
const { readdir } = require('fs/promises');
const { DefinePlugin } = require('webpack');

module.exports = async (env, argv) => {
  const isDev = argv.mode !== 'production';
  console.log(
    `===================${isDev ? 'DEV' : 'PROD'}========================`
  );

  const files = await readdir('./public/beatmaps/');
  const beatmaps = files.filter(file => file.endsWith('.osz'));

  const config = {
    entry: {
      main: path.resolve('./src/index.tsx')
    },
    output: {
      path: path.resolve('./build'),
      filename: '[name].js',
      publicPath: ''
    },
    module: {
      rules: [
        {
          test: /\.tsx?/i,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              targets: '> 1%, not ie 11',
              presets: [
                '@babel/preset-env',
                [
                  '@babel/preset-react',
                  {
                    runtime: 'automatic'
                  }
                ],
                '@babel/preset-typescript'
              ],
              plugins: [
                'const-enum',
                [
                  '@babel/plugin-transform-typescript',
                  { allowDeclareFields: true }
                ],
                '@babel/plugin-proposal-class-properties'
              ]
            }
          }
        },
        {
          test: /\.module\.scss$/i,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isDev,
                url: false,
                modules: {
                  localIdentName: isDev
                    ? '[path][name]__[local]'
                    : '[contenthash:base64]'
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
        },
        {
          test: /\.scss$/i,
          exclude: /\.module\.scss$/i,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isDev,
                url: false
              }
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: !isDev
              }
            }
          ]
        },
        {
          test: /\.(ttf|woff2|png|webp)$/i,
          type: 'asset/resource'
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
        filename: isDev ? '[name].css' : '[name].[contenthash].css',
        chunkFilename: isDev ? '[id].css' : '[id].[contenthash].css'
      }),
      new DefinePlugin({
        DEFAULT_BEATMAPS: JSON.stringify(beatmaps)
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
    config.plugins.push(
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['**/*', '!.git/**', '!.static']
      }),
      new CssoWebpackPlugin(),
      new BundleAnalyzerPlugin()
    );
  }

  return config;
};
