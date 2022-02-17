const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');
const MongooseHelper = require('./config/MongooseHelper');

/* load env variables */
dotenv.config({ path: './config/config_env.env' });

/* load models */
const bootcamp_model;
(async function (){
   bootcamp_model =  await MongooseHelper.getInstance().getCloudDBModel();
});

/* read JSON files */
const bootcamps_file = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8'));

/* importing to DB */
const importDataToDB = async (model) =>{
    try{
       await bootcamps_model.create(bootcamps_file);
       console.log(`data imported successfully`.green.inverse);
    }catch(error){
       console.log(error);
    }finally{
        process.exit();
    }
}

/* deleting all entries from DB */
const deleteAllDataFromDB = async (model) =>{
    try{
        /* if you dont specify what to delete it deletes all entries in the DB */
       await bootcamps_model.deleteMany();
    }catch(error){
       console.log(error); 
    }finally{
        process.exit();
    }
}

/* checking command line argument passed in eg node seeder -i, get the 'i' */
/* run this file by >> node seeder.js -i or -d */
switch(process.argv){
    case '-i': importDataToDB();
    case '-d': deleteAllDataFromDB(); 
}
