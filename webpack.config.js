const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.ts', // Entry point for your TypeScript file

    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        clean: true,
    },

    resolve: {
        extensions: ['.ts', '.js'], // Resolves both TypeScript and JavaScript files
    },

    module: {
        rules: [
            {
                test: /\.ts$/, // Matches TypeScript files
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/, // CSS loader
                use: ['style-loader', 'css-loader'],
                exclude: /node_modules/,
            },
        ],
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new CopyPlugin({
            patterns: [
              { from: 'src/styles.css', to: 'styles.css' },
            ],
        }),
    ],

    devServer: {
        static: {
          directory: path.join(__dirname, 'dist'),
        },
        watchFiles: ['src/**/*'],
        compress: true,
        port: 9000,
        open: true,
        hot: true,
    },
};