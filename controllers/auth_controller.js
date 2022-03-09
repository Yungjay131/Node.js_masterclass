const crypto = require('crypto');

const MongooseHelper = require('../config/MongooseHelper');

const {
    Result,
    sendResponse,
    buildResponse,
    getFunctionName,
    KEY_DEFAULT,
    KEY_SUCCESS_TOKEN,
    status_codes } = require('../utils/utils');

const { sendPasswordResetEmail } = require('../utils/smtp.services');


/**
 * @description: register a new user
 * @route  POST/api/v1/auth/register
 * @access Public */
function registerNewUser(req, res, next) {
    handler_token(req, res, _registerNewUser);
}

async function _registerNewUser(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const { name, email, password, role } = req.body;

        const user = await model.create({
            name,
            email,
            password,
            role
        });

        if (!user) {
            const message = `resource was successfully created`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            /* would send back a token
        this is a METHOD and is called on the result 'user' not 'User'
        this also gives it access to the 'user' db fields like _id */
            const { token, options } = generateTokenAndCookie(user);

            if (!token) {
                const message = `token for user was not successfully generated`;
                params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
            } else {
                /* send token as token:token in response */
                keys = KEY_SUCCESS_TOKEN;
                params = [Result.SUCCESS, status_codes.CREATED, 'token-cookie', token, options];
            }
        }
    } catch (error) {
        console.log(`error occurred while registering new user: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
* @description: login a user
* @route  POST/api/v1/auth/login
* @access Public */
function loginUser(req, res, next) {
    handler_token(req, res, _loginUser);
}

async function _loginUser(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const { email, password } = req.body;

        // TODO:add validation, if this has a front-end  it should be done on the front-end  
        /* adding select() because by default password field wont be returned from the DB */
        const user = await model.findOne({ email: email }).select('+password');

        if (!user) {
            const message = `user with those details does not exist on DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            /* for the password */
            const doesPasswordMatch = await user.comparePassword(password)

            if (!doesPasswordMatch) {
                const message = `incorrect login details, please check email and password`;
                params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
            } else {
                const { token, options } = generateTokenAndCookie(user);

                if (!token) {
                    const message = `token for user was not successfully generated`;
                    params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
                } else {
                    keys = KEY_SUCCESS_TOKEN;
                    params = [Result.SUCCESS, status_codes.SUCCESS, 'token-cookie', token, options];
                }
            }
        }
    } catch (error) {
        console.log(`error occurred while logining user: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @description: logout currently signed-in user and clear COOKIES(on the front-end,would be SESSION if it were on the backend)
 * @route  GET/api/v1/auth/logout
 * @access Public */
function logoutUser(req,res,next){}
async function _logoutUser(req,model){
    let keys = KEY_DEFAULT;
    let params;

    try{
     res.cookie('token-cookie','none',{
        expires: new Date(Date.now() + 10 * 1_000),
        httpOnly: true 
     });     
    }catch(error){

    }finally{

    }

}

/**
* @description: get current logged in user
* @route  POST/api/v1/auth/whoami
* @access Private */
function getCurrentUser(req, res, next) {
    handler(req, res, _getCurrentUser);
}

async function _getCurrentUser(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        /* since the protectRoute middleware runs before this */
        const user = await model.findById(req.user.id);

        if (!user) {
            const message = `user with ID: ${req.user.id} does not exist on th DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            params = [Result.SUCCESS, status_codes.SUCCESS, user];
        }
    } catch (error) {
        console.log(`error occurred getting current user: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }

}

/**
* @description: send password reset token
* @route  POST/api/v1/auth/forgotpassword
* @access Public */
function handleForgotPassword(req, res, next) {
    handler(req, res, _handleForgotPassword);
}

async function _handleForgotPassword(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const user = await model.findOne({ email: req.body.email });

        if (!user) {
            const message = `user with email: ${req.body.email} does not exist on the DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            const resetToken = await generatePasswordResetToken(user);

            const result = await user.save({ validateBeforeSave: false });

            if (!result) {
                const message = `couldn't save user after generating password reset token`;
                params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
            } else {
                /* create reset URL */
                const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

                /* doing it like this because there is no frontend to use */
                const message = `you are receiving this email because you (or someone else) has requested` +
                    ` the reset of the password linked to the account owned by this email address.` +
                    `please make a PUT request to: \n\n ${resetURL}`;

                /* returns a boolean */
                const _result = await sendPasswordResetEmail({
                    email: req.body.email,
                    subject: 'Password Reset Request',
                    message: message
                });

                if (!_result) {
                    const message = `couldn't send password reset email`;
                    params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];

                    /* resetting everything added in the DB since the request failed */
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpire = undefined;

                    await user.save({ validateBeforeSave: false });
                } else {
                    /* everything went well send back response */
                    const message = `password reset request successful \n` +
                        `make a PUT request to: \n ${resetURL}`;
                    params = [Result.SUCCESS, status_codes.SUCCESS, message];
                }
            }
        }
    } catch (error) {
        console.log(`error occurred while handling forgot password: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
* @description: reset password
* @route  PUT/api/v1/auth/resetpassword/:resetToken
* @access Public */
function resetPassword(req, res, next) {
    handler_token(req, res, _resetPassword);
}
async function _resetPassword(req, model) {
    let keys = KEY_DEFAULT;
    let params;
    try {
        /* get hashed token */
        const resetPasswordToken =
            crypto.createHash('sha256')
                .update(req.params.resetToken)
                .digest('hex');

        /* req.user is gotten from middleware */
        const user = await model.findOne({
            resetPasswordToken: resetPasswordToken,

            /* make sure the token has not expired since its 10 mins*/
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            /* could mean the token has expired or no user has the resetPasswordToken */
            const message = `invalid token. It could be because token has expired`;
            params = [Result.SUCCESS, status_codes.BAD_REQUEST, message];
        } else {
            /* set new password */
            user.password = req.body.password;

            /* resetting the password token and expire fields */
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            const _user = await user.save();

            if (!_user) {
                const message = `error occurred saving user updated details to the DB`;
                params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];
            } else {
                const { token, options } = generateTokenAndCookie(_user);

                if (!token) {
                    const message = `error occurred getting token to send back to user`;
                    params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];
                } else {
                    keys = KEY_SUCCESS_TOKEN;
                    params = [Result.SUCCESS, status_codes.SUCCESS, 'token-cookie', token, options];
                }

            }
        }
    } catch (error) {
        console.error(error.message);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
* @description: update user details
* @route  PUT/api/v1/auth/updatedetails
* @access Private */
function updateUserDetails(req, res, next) {
    handler(req, res, _updateUserDetails);
}

async function _updateUserDetails(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const options = {
            new: true,
            runValidators: true
        };

        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email
        };

        const user = await model.findByIdAndUpdate(req.user.id, fieldsToUpdate, options);

        if (!user) {
            const message = `user with ID: ${req.user.id} was not found`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            params = [Result.SUCCESS, status_codes.SUCCESS, user];
        }
    } catch (error) {
        console.error(`error occurred updating user details: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
* @description: update user password
* @route  PUT/api/v1/auth/updatepassword
* @access Private */
function updateUserPassword(req, res, next) {
    handler_token(req, res, _updateUserPassword);
}
async function _updateUserPassword(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        /* find currently logged in user by id */
        const user = await model.findById(req.user.id).select('+password');

        /* check if user entered correct password*/
        const doesPasswordMatch = await user.comparePassword(req.body.currentPassword);
        if (!doesPasswordMatch) {
            const message = `sorry password does not match`;
            params = [Result.SUCCESS, status_codes.BAD_REQUEST, message];
        } else {
            user.password = req.body.newPassword;
            const _user = await user.save();

            if (!_user) {
                const message = `error saving updated password to DB`;
                params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];
            } else {
                /* return a token */
                const { token, options } = generateTokenAndCookie(_user);

                if (!token) {
                    const message = `token for user does not exist`;
                    params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
                } else {
                    keys = KEY_SUCCESS_TOKEN;
                    params = [Result.SUCCESS, status_codes.SUCCESS, 'token-cookie', token, options];
                }
            }

        }
    } catch (error) {
        console.error(`error occurred updating user password:${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @description: delete a user
 * @route  DELETE/api/v1/auth/delete
 * @access Public */
function deleteUserAccount(req, res, next) {
    handler(req, res, _deleteUserAccount);
}

async function _deleteUserAccount(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const { email, password } = req.body;

        const user = await model.findOne({ email: email }).select('+password');

        if (!user) {
            const message = `user with email: ${email} does not exist`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            const doesPasswordMatch = await user.comparePassword(password);

            if (!doesPasswordMatch) {
                const message = `user's password is incorrect, check the password entered and try again`;
                params = [Result.SUCCESS, status_codes.BAD_REQUEST, message];
            } else {
                const _user = await user.remove();

                if (!_user) {
                    const message = `could not successfully delete user`;
                    params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];
                } else {
                    params = [Result.SUCCESS, status_codes.SUCCESS, _user];
                }
            }
        }
    } catch (error) {
        console.error(`an error occurred deleting user: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}


/* helper function for generating token from model, cookies */
function generateTokenAndCookie(user) {
    const token = user.getSignedJWTToken();

    /* creating cookie */
    const expiryDate = new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE_TIME * 24 * 60 * 60 * 1000);
    const options = {
        expires: expiryDate,
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    return { token, options };
}

/* helper method to generate password reset token*/
async function generatePasswordResetToken(user) {
    const token = await user.generatePasswordResetToken();
    return token;
}

async function handler(req, res, _function) {
    let response_data;

    const cloud_model = await MongooseHelper.getInstance().getUserCloudDBModel();
    _function(req, cloud_model)
        .then(data => {
            response_data = data;
        })
        .catch(error => {
            const tag = getFunctionName(_function);
            console.log(`error from ${tag} in auth_controller`);
            response_data = error;
        })
        .finally(() => {
            sendResponse(res, response_data);
        });
}

async function handler_token(req, res, _function) {
    let response_data;
    let status = true;

    const cloud_model = await MongooseHelper.getInstance().getUserCloudDBModel();
    _function(req, cloud_model)
        .then(data => {
            response_data = data;
        })
        .catch(error => {
            status = false;
            const tag = getFunctionName(_function);
            console.log(`error from ${tag} in auth_controller`);
            response_data = error;
        })
        .finally(() => {
            if (status) {
                res.status(response_data.status)
                    .cookie(response_data.token_name, response_data.token, response_data.options)
                    .json(response_data);


            } else {
                res.status(response.data.status).json(response_data.data);
            }

        });
}



module.exports = {
    registerNewUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    handleForgotPassword,
    resetPassword,
    updateUserDetails,
    updateUserPassword,
    deleteUserAccount
};