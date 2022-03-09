const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/* for handling password reset tokens (i think its a core node module) */
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please add a name']
    },
    email: {
        type: String,
        required: [true, 'please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email address'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'publisher'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'please enter a valid password'],
        minlength: 6,

        /* wont return password in any user query by default */
        select: false,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/* encrypt password using bcrypt */
UserSchema.pre('save', async function (next) {
    /* to prevent this method from running when updating forgotPassword token
    should only run when password was actually modified */
    if (!this.isModified('password'))
        next();

    /* a salt is used for the hashing 
    10 is okay but could be more even though that makes it a more expensive operation*/
    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);
});

/* sign JWT(JSON Web Token) and return 
 since its a METHOD and not a STATIC, can be called from 
 controller*/
UserSchema.methods.getSignedJWTToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE_TIME });
}

/* for matching user-entered password to hashed password in database */
UserSchema.methods.comparePassword = async function (inputPassword) {
    /* return a Boolean */
    return await bcrypt.compare(inputPassword, this.password);
}

/* generate and hash password reset token */
UserSchema.methods.generatePasswordResetToken = async function () {
    /* generate token, from bytes(20) returns a buffer */
    const resetToken = crypto.randomBytes(20).toString('hex');

    /* hash token and set to resetPasswordField of model 
    digest() return it as string */
    const hashedResetToken =
        crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

    this.resetPasswordToken = hashedResetToken;

    /* setting resetPasswordExpire to 10 minutes */
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    /* returning the un-hashed resetToken */
    return resetToken;
}

//const user_model = mongoose.model('Users', BootcampSchema);
module.exports = UserSchema;