// vue.config.js
const WorkerPlugin = require('worker-plugin')
module.exports = {
    devServer: {
        proxy: 'http://127.0.0.1:3000',
    }, 
    configureWebpack:{
        plugins: [new WorkerPlugin()]
    },
    lintOnSave: false
}