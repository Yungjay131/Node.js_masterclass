const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder.utils');
const { model_names } = require('../utils/utils');


/* creating a Schema */
const BootcampSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    /* URL frendly version of the name,e.g all lowercaps to be used in a link
     would be done using Sluggify */
    slug: String,
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [1000, 'Description can not be more than 1000 characters']
    },
    website: {
        type: String,
        match: [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL with HTTP or HTTPS'
        ]
    },
    phone: {
        type: String,
        maxlength: [20, 'Phone number cannot be more than 14 digits']
    },
    email: {
        type: String,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    /* GeoJson for location */
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            /* array of numbers */
            type: [Number],
            index: '2dsphere'
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    careers: {
        /* array of Strings */
        type: [String],
        required: true,
        enum: [
            'Web Development',
            'Mobile Development',
            'UI/UX',
            'Data Science',
            'Business',
            'Other'
        ]
    },
    /* this field is not going to be inserted via a REQUEST, rather it will be generated */
    averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [10, 'Rating cannot be more than 10']
    },
    averageCost: Number,
    photo: {
        /* filename */
        type: String,
        default: 'no-photo.jpg'
    },
    housing: {
        type: Boolean,
        default: false
    },
    jobAssistance: {
        type: Boolean,
        default: false
    },
    jobGuarantee: {
        type: Boolean,
        default: false
    },
    acceptGi: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    /* to associate an owner with each Bootcamp remember to set
      in bootcamps_controller*/
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
},
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    });

/* for testing pre and post middleware hooks 
use anonymous functions because arrowfunctions handle this reference differently
and this pre hooks use the 'this' reference*/
BootcampSchema.pre('save', function (next) {
    /* referring to the slug field,remember this is for creating a more user-friendly version
    of a string */
    this.slug = slugify(this.name, { lower: true });
    next();
});

/* geocode and creat location field */
BootcampSchema.pre('save', async function (next) {
    const _location = await geocoder.geocode(this.address);
    /* constructing the location field as geojson */
    this.location = {
        type: 'Point',
        coordinates: [_location[0].longitude, _location[0].latitude],
        formattedAddress: _location[0].formattedAddress,
        street: _location[0].streetName,
        city: _location[0].city,
        state: _location[0].stateCode,
        zipcode: _location[0].zipcode,
        country: _location[0].countryCode
    }

    /* do not save address in DB */
    this.address = undefined;
    next();
});

/* cascade delete courses when a bootcamp is deleted
this would not work with findByIdAndDelete(); */
BootcampSchema.pre('remove', async function (next) {
    console.log(`courses being removed from bootcamp: ${this_id}`);

    /* { bootcamp: this_id } remove only courses associated with this bootcamp*/
    await this.model(model_names.COURSES).deleteMany({ bootcamp: this._id });
    next();
});

/* for Reverse Populate, for virtuals, object getters and setters that dont get saved to the DB */
/* used in boocamps_controller#getBootCamps() */
BootcampSchema.virtual('courses', {
    ref: model_names.COURSES,
    localField: '_id',
    foreignField: 'bootcamp',
    justOne: false
});

/* to avoid it being scoped to the default connection, so export Schema instead */
// const BootcampModel = mongoose.model('Bootcamp', BootcampSchema);

module.exports = BootcampSchema;
