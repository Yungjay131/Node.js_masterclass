const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');
const MongooseHelper = require('../config/MongooseHelper');
const path = require('path');

/* load env variables, because its not running through server.js */
dotenv.config({ path: './config/config_env.env' });

/* load models */
let bootcamp_model;
let course_model;
let user_model;
let review_model;

const getBootcampModel = async () => {
    if (bootcamp_model) return bootcamp_model;

    bootcamp_model = await MongooseHelper.getInstance().getBootCampCloudDBModel();
    return bootcamp_model
}

const getCourseModel = async () => {
    if (course_model) return course_model;

    course_model = await MongooseHelper.getInstance().getCourseDBModel();
    return course_model;
}

const getUserModel = async () => {
    if (user_model) return user_model;

    user_model = await MongooseHelper.getInstance().getUserCloudDBModel();
    return user_model;
}

const getReviewModel = async () => {
    if (review_model) return review_model;

    review_model = await MongooseHelper.getInstance().getReviewCloudDBModel();
    return review_model;
}

/* importing to DB */
const importBootCampDataToDB = async () => {
    try {
        /* read JSON file */
        const _path = path.join(__dirname, "..", "_data", "bootcamps.json");
        const bootcamps_file = await JSON.parse(fs.readFileSync(_path, 'utf-8'));

        const model = await getBootcampModel();
        await model.create(bootcamps_file);
        console.log(`bootcamp data imported successfully`.green.inverse);
    } catch (error) {
        console.log(error.message);
        process.exit();
    }
}

const importCourseDataToDB = async () => {
    try {
        const _path = path.join(__dirname, "..", "_data", "courses.json");
        const course_file = JSON.parse(fs.readFileSync(_path, 'utf-8'))

        const model = await getCourseModel();
        await model.create(course_file)
        console.log(`course data imported successfully`.green.inverse);
    } catch (error) {
        console.log(error.message);
    }
}

const importUserDataToDB = async () => {
    try {
        const _path = path.join(__dirname, "..", "_data", "users.json");
        const user_file = JSON.parse(fs.readFileSync(_path, 'utf-8'))

        const model = await getUserModel();
        await model.create(user_file)
        console.log(`user data imported successfully`.green.inverse);
    } catch (error) {
        console.log(error.message);
    }
}

const importReviewDataToDB = async () => {
    try {
        const _path = path.join(__dirname, "..", "_data", "reviews.json");
        const review_file = JSON.parse(fs.readFileSync(_path, 'utf-8'))

        const model = await getReviewModel();
        await model.create(review_file)
        console.log(`review data imported successfully`.green.inverse);
    } catch (error) {
        console.log(error.message);
    }
}

/* deleting all entries from DB */
const deleteAllBootCampDataFromDB = async () => {
    try {
        const model = await getBootcampModel();

        /* if you dont specify what to delete it deletes all entries in the DB */
        await model.deleteMany();
        console.log(`bootcamp data deleted successfully`.red.inverse);
    } catch (error) {
        console.log(error.message);
        process.exit();
    }
}

const deleteAllCourseDataFromDB = async () => {
    try {
        const model = await getCourseModel();

        await model.deleteMany();
        console.log(`course data deleted successfully`.red.inverse);
    } catch (error) {
        console.log(error.message);
        process.exit();
    }
}

const deleteAllUserDataFromDB = async () => {
    try {
        const model = await getUserModel();

        await model.deleteMany();
        console.log(`user data deleted successfully`.red.inverse);
    } catch (error) {
        console.log(error.message);
        process.exit();
    }

}
const deleteAllReviewDataFromDB = async () => {
    try {
        const model = await getReviewModel();

        await model.deleteMany();
        console.log(`review data deleted successfully`.red.inverse);
    } catch (error) {
        console.log(error.message);
        process.exit();
    }
}

const deleteDateFromDB = async (modelGetter, tag) => {
    try {
        const _model = await modelGetter();
        await _model.deleteMany();
        console.log(`${tag} data deleted successfully`.red.inverse);
    } catch (error) {
        console.log(error.message);
        process.exit();
    }
}


/* checking command line argument passed in eg node seeder -i, get the 'i' */
/* run this file by >> node seeder.js -i or -d */
switch (process.argv[2]) {
    case '-j': {
        importBootCampDataToDB();
        break;
    }
    case '-i': {
        importBootCampDataToDB();
        importCourseDataToDB();
        importUserDataToDB();
        importReviewDataToDB();
        break;
    }
    case '-d': {
        deleteAllBootCampDataFromDB();
        deleteAllCourseDataFromDB();
        deleteAllUserDataFromDB();
        //deleteAllReviewDataFromDB();
        break;
    }
}

function _importDataToDB() {
    let data;
    try {
        importBootCampDataToDB();
        importCourseDataToDB();
        importUserDataToDB();
        importReviewDataToDB();

        data = { status: true };
    } catch (error) {
        console.error(error);
        data = { status: false, message: error.message };
    } finally {
        return data;
    }

}
function _deleteDataFromDB() {
    let data;
    try {
        deleteAllBootCampDataFromDB();
        deleteAllCourseDataFromDB();
        deleteAllUserDataFromDB();
        deleteAllReviewDataFromDB();
        
        data = { status: true };
    } catch (error) {
        console.error(error);
        data = { status: false, message: error.message };
    } finally {
        return data;
    }
}

module.exports = {
    _importDataToDB,
    _deleteDataFromDB
};
