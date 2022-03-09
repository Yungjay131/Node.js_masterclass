const mongoose = require('mongoose');
const colors = require('colors');
const BootcampSchema = require('../models/bootcamp_model.js');
const CourseSchema = require('../models/course_model.js');
const UserSchema = require('../models/user_model.js');
const ReviewSchema = require('../models/review_model.js');

const { model_names } = require('../utils/utils');

class MongooseHelper {
    /* #region Vars */
    static #INSTANCE = null;

    #cloud_options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        keepAlive: true,
        keepAliveInitialDelay: 300_000
    };

    #cloud_options2 = {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    };

    #offline_options = {
        keepAlive: true,
        keepAliveInitialDelay: 300_000
    };

    #URI_CLOUD = process.env.MONGO_URI_CLOUD;
    #URI_OFFLINE = process.env.MONGO_URI_OFFLINE;

    #connection;

    #bootcamp_model_offline;
    #bootcamp_model_cloud;

    #course_model_cloud;

    #user_model_cloud;

    #review_model_cloud;

    #retry_count = 0;
    #MAX_RETRY_COUNT = 5;
    /* #endregion */

    static getInstance() {
        if (!this.#INSTANCE) {
            this.#INSTANCE = new MongooseHelper();
        }

        return this.#INSTANCE;
    }

    constructor() {
        this.#init();
    }

    #init() {
        //this.#initOfflineDB();
        this.#initCloudDB()
    }

    async #initOfflineDB() {
        try {
            const connection = await mongoose.createConnection(this.#URI_OFFLINE, this.#offline_options)
                .asPromise();
            this.#bootcamp_model_offline = connection.model(model_names.BOOTCAMPS, BootcampSchema);
        } catch (error) {
            console.log(`error connecting to OfflineDB: ${error.message}`);
        }
    }

    async #initCloudDB() {
        let connection_status = false;
        try {
            /* this.#connection = await mongoose.createConnection(this.#URI_CLOUD, this.#cloud_options)
                .asPromise(); */

            this.#connection = await mongoose.connect(this.#URI_CLOUD, this.#cloud_options);

            this.#bootcamp_model_cloud = this.#connection.model(model_names.BOOTCAMPS, BootcampSchema);
            this.#course_model_cloud = this.#connection.model(model_names.COURSES, CourseSchema);
            this.#user_model_cloud = this.#connection.model(model_names.USERS, UserSchema);
            this.#review_model_cloud = this.#connection.model(model_names.REVIEWS, ReviewSchema);

            connection_status = true;
        } catch (error) {
            console.log(`error connecting to CloudDB: ${error.message}`);
        } finally {
            if (connection_status === false && ++this.#retry_count < 5)
                this.#initCloudDB();
        }
    }

    #registerEvents() {
        mongoose.connection.on('error', error => {
            console.log(`error occurred with app's connection to DB:${error.message}`.cyan.underline.bold);
        });
        mongoose.connection.on('disconnected', error => {
            console.log(`app has lost connection to  DB:${error.message}`.cyan.underline.bold);
        });
    }

    async getConnection() {
        if (!this.#connection)
            await this.#initCloudDB();

        return this.#connection;
    }

    async getBootCampOfflineDBModel() {
        if (!this.#bootcamp_model_offline)
            await this.#initOfflineDB()

        return this.#bootcamp_model_offline;
    }

    async getBootCampCloudDBModel() {
        if (!this.#bootcamp_model_cloud)
            await this.#initCloudDB()

        return this.#bootcamp_model_cloud;
    }

    async getCourseDBModel() {
        if (!this.#course_model_cloud)
            await this.#initCloudDB();

        return this.#course_model_cloud;
    }

    async getUserCloudDBModel() {
        if (!this.#user_model_cloud)
            await this.#initCloudDB();

        return this.#user_model_cloud;
    }

    async getReviewCloudDBModel() {
        if (!this.#review_model_cloud)
            await this.#initCloudDB();

        return this.#review_model_cloud;
    }
}

module.exports = MongooseHelper;