const mongoose = require('mongoose');
// const { promise: conn_offline_promise } = require('./config_mongoose_offline.js');
// const { promise: conn_cloud_promise } = require('./config_mongoose_cloud.js');

const conn_offline = require('./config_mongoose_offline.js');
const conn_cloud = require('./config_mongoose_cloud.js');

function init() {
    registerEvents();
}

function registerEvents() {
    mongoose.connection.on('error', error => {
        console.log(`Error occurred while trying to connect to DB:${error.message}`.cyan.underline.bold);
    });
    mongoose.connection.on('disconnected', error => {
        console.log(`app has lost connection to  DB:${error.message}`.cyan.underline.bold);
    });
}

init();

/* these are Promises with connect() which returns an Object containing { connection, model } */
// module.exports = { conn_offline_promise, conn_cloud_promise };

module.exports = { conn_offline, conn_cloud };