const mongoose = require('mongoose');
const { BootcampSchema } = require('../models/bootcamp_model.js');

const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    keepAlive: true,
    keepAliveInitialDelay: 300_000
};

const options2 = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
};

const URI = process.env.MONGO_URI_CLOUD;

/* const promise = new Promise(async (resolve, reject) => {

    try {
        const connection = await mongoose.createConnection(URI, options);
        const model = connection.model('Bootcamp', BootcampSchema);

        console.log(`Cloud DB connected successfully`);

        resolve({ connection, model });
    } catch (error) {
        console.log(`Error connecting to Cloud DB:${error.message}`);
        reject(error);
    }
}); */

let connection, model;
/* testing */
const connectDB = async () => {
    const connection = await mongoose.connect(URI, options);
}

async function init() {
    try {
        connection = await mongoose.createConnection(URI, options).asPromise();
        model = connection.model('Bootcamp', BootcampSchema);
        console.log('Cloud DB connected successfully');
    } catch (error) {
        console.log(`Error connecting to Cloud DB:${error.message}`);
    }
}

init();

// module.exports = { promise };
module.exports = { connection, model };