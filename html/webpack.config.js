const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, args) => {
    const { mode } = args
    const sourceMap = mode === 'development'

    return {
        devtool: 'inline-source-map',
        entry: './src/index.js',
        output: {
            path: __dirname + '/dist',
            filename: 'main.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$|jsx/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',   //loader名
                        options: {                //Babelの設定
                            presets: [
                                '@babel/preset-env',

                            ]
                        }
                    }
                },
                {
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                url: false,
                                sourceMap: true,
                                importLoaders: 2,
                            }
                        },
                        'postcss-loader',
                        {
                            loader: "sass-loader",
                            options: {
                                // ソースマップの利用有無
                                sourceMap: true,
                                implementation: require('sass'),
                            },
                        },

                    ]
                }
            ]
        },
        externals: {
            jquery: 'jQuery'
        },
        plugins: [
            new webpack.ProvidePlugin({
                $: 'jquery',
            }),
            new MiniCssExtractPlugin({
                filename: 'style.css'
            })
        ]
    }
}