const MongooseHelper = require('../config/MongooseHelper');
const {
    Result,
    sendResponse,
    buildResponse,
    getFunctionName,
    KEY_DEFAULT,
    status_codes } = require('../utils/utils');


/**
* @description: register a new user
* @route  POST/api/v1/admin/register
* @access Public */
function registerNewUser(req, res, next) {
    handler(req, res, _registerNewUser);
}

async function _registerNewUser(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const { name, email, password, role } = req.body;

        /* create a new user */
        const user = await model.create({
            name,
            email,
            password,
            role
        });

        if (!user) {
            const message = `user was not created successfully`;
            params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];
        } else {
            params = [Result.SUCCESS, status_codes.CREATED, user];
        }
    } catch (error) {
        console.error(`error occurred while registering new user: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }

}


/**
* @description get a single user
* @route GET /api/v1/admin/:id
* @access Private/Admin */
function getUser(req, res, next) {
    handler(req, res, _getUser);
}

async function _getUser(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const user = await model.findUserById(req.params.id);

        if (!user) {
            const message = `user with ID: ${req.params.id} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.BAD_REQUEST, message];
        } else {
            params = [Result.SUCCESS, status_codes.SUCCESS, user];
        }
    } catch (error) {
        console.error(`error occurred while getting user with ID: ${req.params.id}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @description update a user
 * @route PUT /api/v1/admin/:id
 * @access Private/Admin
 *  */
function updateUser(req, res, next) {
    handler(req, res, _updateUser);
}

async function _updateUser(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const options = {
            new: true,
            runValidators: true
        };

        const user = await model.findByIdAndUpdate(req.user.id, req.user, options);

        if (!user) {
            const message = `user with ID: ${req.user.id} was not found`;
            params = [Result.SUCCESS, status_codes.BAD_REQUEST, message];
        } else {
            params = [Result.SUCCESS, status_codes.SUCCESS, user];
        }
    } catch (error) {
        console.error(error.message);
        params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }

}

/**
 * @description delete a user
 * @route DELETE /api/v1/admin/:id
 * @access Private/Admin
 *  */
function deleteUser(req, res, next) {
    handler(req, res, _deleteUser);
}

async function _deleteUser(req, model) {
    try {
        const user = await model.findByIdAndDelete(req.params.id);

        if (!user) {
            const message = `user with ID: ${req.params.id} was not found`;
            params = [Result.SUCCESS, status_codes.BAD_REQUEST, message];
        } else {
            params = [Result.SUCCESS, status_codes.SUCCESS, user];
        }
    } catch (error) {
        console.error(`error occurred while deleting user: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }

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
            console.log(`error from ${tag} in admin_controller`);
            response_data = error;
        })
        .finally(() => {
            sendResponse(res, response_data);
        });
}

module.exports = {
    registerNewUser,
    getUser,
    updateUser,
    deleteUser
};