const mongoose = require('mongoose');
const { model_names } = require('../utils/utils');

const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'please add a review title'],
        maxlength: 100
    },
    text: {
        type: String,
        required: [true, 'please add a review']
    },
    description: {
        type: String,
        /*  required: [true, 'please add a description'] */
    },
    rating: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, 'please add a rating between 1 and 10']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },

    /* since its like a join key for the bootcamp */
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

/* making it that its 1 review per user per bootcamp */
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

ReviewSchema.statics.getAverageRating = async function (bootcampID) {
    console.log(`calculating average rating`);

    /* adding it to DB */
    try {
        /* this is a pipeline??? */
        /* this should return an object that has an _id of the bootcamp and the average cost */
        const obj = await this.aggregate([
            {
                $match: { bootcamp: bootcampID }
            },
            {
                $group: {
                    _id: '$bootcamp',
                    averageRating: { $avg: '$rating' }
                }
            }
        ]);

        /* const model = mongoose.model(model_names.BOOTCAMPS, BootcampSchema); */
        await this.model(model_names.BOOTCAMPS).findByIdAndUpdate(bootcampID, {
            averageRating: obj[0].averageRating
        });
    } catch (error) {
        console.error(error);
    }
}

/* call getAverageRating after save*/
ReviewSchema.post('save', function () {
    /* this.bootcamp refers to the bootcamp key field of the model*/
    this.constructor.getAverageRating(this.bootcamp);
});

ReviewSchema.pre('remove', function () {
    this.constructor.getAverageRating(this.bootcamp);
});

module.exports = ReviewSchema;