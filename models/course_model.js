const mongoose = require('mongoose');
const { model_names } = require('../utils/utils');
const BootcampSchema = require('../models/bootcamp_model');


const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'please add a course title']
    },
    description: {
        type: String,
        required: [true, 'please add a description']
    },
    weeks: {
        type: String,
        required: [true, 'please add a number of weeks']
    },
    tuition: {
        type: Number,
        required: [true, 'please add a tuition cost']
    },
    minimumSkill: {
        type: String,
        required: [true, 'please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    scholarshipAvailable: {
        type: Boolean,
        default: false
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

/* mongoose has statics and actual methods 
static = model.someRandomMethod();
actual methods = const course = model.find(); course.someRandomMethod(); */
CourseSchema.statics.getAverageCost = async function (bootcampID) {
    console.log(`calculating average cost`);

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
                    averageCost: { $avg: '$tuition' }
                }
            }
        ]);

        await this.model(model_names.BOOTCAMPS).findByIdAndUpdate(bootcampID, {
            averageCost: Math.ceil(obj[0].averageCost / 10) * 10
        });
    } catch (error) {
        console.error(error);
    }
}

/* call getAverageCost after save*/
CourseSchema.post('save', function () {
    /* this.bootcamp refers to the bootcamp key field of the model*/
    this.constructor.getAverageCost(this.bootcamp);
});

CourseSchema.pre('remove', function () {
    this.constructor.getAverageCost(this.bootcamp);
});

module.exports = CourseSchema;