const mongoose = require('mongoose');
const { BootcampSchema } = require('../models/bootcamp_model.js');

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

    #model_offline;
    #model_cloud;

    #RETRY_COUNT;
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
        this.#initOfflineDB();
        this.#initCloudDB()
    }

    async #initOfflineDB() {
        try {
            const connection = await mongoose.createConnection(this.#URI_OFFLINE, this.#offline_options)
                .asPromise();
            this.#model_offline = connection.model('Bootcamp', BootcampSchema);
        } catch (error) {
            console.log(`error connecting to OfflineDB: ${error.message}`);
        }
    }

    async #initCloudDB() {
        try {
            const connection = await mongoose.createConnection(this.#URI_CLOUD, this.#cloud_options)
                .asPromise();
            this.#model_cloud = connection.model('Bootcamp', BootcampSchema);
        } catch (error) {
            console.log(`error connecting to CloudDB: ${error.message}`);
        }
    }


    async getOfflineDBModel() {
        if (!this.#model_offline)
            await this.#initOfflineDB()

        return this.#model_offline;
    }

    async getCloudDBModel() {
        if (!this.#model_cloud)
            await this.#initCloudDB()

        return this.#model_cloud;
    }
}

module.exports = MongooseHelper;