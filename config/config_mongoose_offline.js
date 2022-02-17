const mongoose = require('mongoose');
const { BootcampSchema } = require('../models/bootcamp_model.js');

const options = {
    keepAlive: true,
    keepAliveInitialDelay: 300_000
};
const URI = process.env.MONGO_URI_OFFLINE;

/* const promise = new Promise(async (resolve, reject) => {


    try {
        const connection = await mongoose.createConnection(URI, options);

        /*1st param Model name should be singular version of the Collection name e.g MongoDB would look for Bootcamps  */
/* const model = connection.model('Bootcamp', BootcampSchema);

 console.log(`Offline DB connected successfully`);

 resolve({ connection, model });
} catch (error) {
 console.log(`Error connecting to Offline DB:${error.message}`);
 reject(error);
}
}); */

/* //TODO: try this again, it should work, maybe use promise all
const connection = await mongoose.createConnection(URI,options);
const model = connection.model('Bootcamp', BootcampSchema);
console.log(`Offline DB connected successfully`);

check out 
for await(const ss of getAllFunctionsAsync){
    
}


module.exports = { model }; */

let connection, model;
async function init() {
    try {
        connection = await mongoose.createConnection(URI, options).asPromise();
        model = connection.model('Bootcamp', BootcampSchema);

        console.log(`Offline DB connected successfully`);
    } catch (error) {
        console.log(`Error connecting to Offline DB:${error.message}`);
    }
}

init();
/* returning a Promise to be executed on the consuming end */
// module.exports = { promise };

module.exports = { connection, model };