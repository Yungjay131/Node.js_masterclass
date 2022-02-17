/* these are all middle-ware functions */
/* NB:all unhandled Promise rejections are redirected to Event Handler function is Server.js */

/* PLEASE note some requests require additional input in the HEADER or the BODY of the request */
const MongooseHelper = require('../config/MongooseHelper');

const asyncHandler = require('../middleware/async.handler.js');
const ErrorResponse = require('../utils/ErrorResponse');

const Result = {
    SUCCESS: 'success',
    FAILURE: 'failure'
};
Object.freeze(Result);


/* this is the default status*/
let error_data = { status: 500, message: 'internal server error' };

let status;
let response_data = { status: status, data: null };
let response_data_offline = { successful: Result.FAILURE, status: status, data: null };
let response_data_cloud = { successful: Result.FAILURE, status: status, data: null };

/**@description: get all bootcamps 
 * @route: GET /api/v1/bootcamps
 * @access Public */
/* to make handling of Promise/async ops easier,wrap with asyncHandler,
   allowing you to get rid of try/catch blocks */
function getBootCamps(req, res, next) {
    handler(req, res, _getBootCamps, true);
}

async function _getBootCamps(req, model) {
    const response_data = { successful: Result.FAILURE, status: status, data: null };

    try {
        const bootcamps = await model.find();

        if (bootcamps) {
            response_data.successful = Result.SUCCESS;
            response_data.status = 200;
            response_data.data = bootcamps;
        } else {
            response_data.successful = Result.FAILURE;
            response_data.status = 404;
            response_data.data = `no resources saved on the DB`;
        }

    } catch (error) {
        console.log(`Error occurred while fetching Bootcamps:${error.message}`);
        response_data.successful = Result.FAILURE;
        response_data.status = 500;
        response_data.data = error.message;
    } finally {
        return response_data;
    }

}

/**@description: get a specified bootcamp 
 * @route: GET /api/v1/bootcamps/:id
 * @access Public */
function getBootCamp(req, res, next) {
    handler(req, res, _getBootcamp, true);
}

async function _getBootcamp(req, model) {
    const response_data = { successful: Result.FAILURE, status: status, data: null };

    try {
        /* since the ID is passed in the URL */
        const bootcamp = await model.findById(req.params.id);

        if (bootcamp) {
            response_data.successful = Result.SUCCESS;
            response_data.status = 200;
            response_data.data = bootcamp;
        } else {
            response_data.successful = Result.FAILURE;
            response_data.status = 404;
            response_data.data = `resource with ID: ${req.params.id} does not exist in the DB`;
        }

    } catch (error) {
        console.log(`Error occurred while fetching Bootcamp:${error.message}`);
        response_data.successful = Result.FAILURE;
        response_data.status = 500;
        response_data.data = error.message;
    } finally {
        return response_data;
    }

}

/**@description: create bootcamp 
 * @route: POST /api/v1/bootcamps
 * @access Private */
function createBootCamp(req, res, next) {
    /* dont be sending more than one Response to one Request */
    handler(req, res, _createBootCamp);
}

async function _createBootCamp(req, model) {
    const response_data = { successful: Result.FAILURE, status: status, data: null };

    try {
        const bootcamp = await model.create(req.body);

        if (bootcamp) {
            response_data.successful = Result.SUCCESS;
            response_data.status = 201;
            response_data.data = bootcamp;
        } else {
            response_data.successful = Result.FAILURE;
            response_data.status = 404;
            response_data.data = `resource was not successfully created. Please try again.`;
        }

    } catch (error) {
        console.log(`Error occurred while creating Bootcamp:${error.message}`);
        response_data.successful = Result.FAILURE;
        response_data.status = 500;
        response_data.data = error.message;
    } finally {
        return response_data;
    }

}

/**@description: update a bootcamp 
 * @route: PUT /api/v1/bootcamps/:id
 * @access Private */
function updateBootCamp(req, res, next) {
    handler(req, res, _updateBootCamp);
}

async function _updateBootCamp(req, model) {
    const response_data = { successful: Result.FAILURE, status: status, data: null };

    try {
        const options = {
            new: true,
            runValidators: true
        };

        const bootcamp = await model.findByIdAndUpdate(req.params.id, req.body, options);

        if (bootcamp) {
            response_data.successful = Result.SUCCESS;
            response_data.status = 201;
            response_data.data = bootcamp
        } else {
            response_data.successful = Result.FAILURE;
            response_data.status = 404;
            response_data.data = `resource with ID: ${req.params.id} does not exist in the DB`;
        }
    } catch (error) {
        console.log(`Error occurred while updating Bootcamp:${error.message}`);
        response_data.successful = Result.FAILURE;
        response_data.status = 500;
        response_data.data = error.message;
    } finally {
        return response_data;
    }
}

/**@description: delete a bootcamp 
 * @route: DELETE /api/v1/bootcamps/:id
 * @access Private */
function deleteBootCamp(req, res, next) {
    handler(req, res, _deleteBootCamp, true);
}

async function _deleteBootCamp(req, model) {
    const response_data = { successful: Result.FAILURE, status: status, data: null };

    try {
        const bootcamp = await model.findByIdAndDelete(req.params.id);

        if (bootcamp) {
            response_data.successful = Result.SUCCESS;
            response_data.status = 201;
            response_data.data = bootcamp;
        } else {
            response_data.successful = Result.FAILURE;
            response_data.status = 404;
            response_data.data = `Resource with ID:${req.params.id} does not exist in the DB`;
        }

    } catch (error) {
        console.log(`Error occurred while deleting Bootcamp:${error.message}`);
        response_data.successful = Result.FAILURE
        response_data.status = 500;
        response_data.data = error.message;
    } finally {
        return response_data;
    }
}




async function handler(req, res, _function, runOnlyOnCloud = true) {
    const tag = _getFunctionName(_function);

    let statuses = [];

    const offline_model = await MongooseHelper.getInstance().getOfflineDBModel();
    const cloud_model = await MongooseHelper.getInstance().getCloudDBModel();

    _function(req, cloud_model)
        .then(data => {
            response_data_cloud = data;
        })
        .catch(error => {
            console.log(`Error from ${tag} in Cloud_connection`)
            response_data_cloud = error;
            console.log(response_data_cloud);
        })
        .finally(() => {
            statuses.push(response_data_cloud.successful);
            _sendResponse(res, statuses, response_data_cloud, runOnlyOnCloud);
        });

    /* for certain operations like getBootCamp() which should be run only 0n cloud*/
    if (!runOnlyOnCloud) {
        _function(req, offline_model)
            .then(data => {
                response_data_offline = data;
            })
            .catch(error => {
                console.log(`Error from ${tag} in Offline_connection`);
                response_data_offline = error
            })
            .finally(() => {
                statuses.push(response_data_offline.successful);
                _sendResponse(res, statuses, response_data_offline, runOnlyOnCloud);
            });
    }


}

function _sendResponse(res, statuses, response_obj, isSingleOperation = false) {
    //statuses should be an array
    if (isSingleOperation && res._headerSent) return;
    if (!isSingleOperation && (statuses.length !== 2 || res._headerSent)) return;

    let isSuccessful = statuses.includes(Result.FAILURE) ? false : true;

    let { status, data } = response_obj;
    res.status(status).json(
        {
            success: isSuccessful,
            data: data
        }
    );
}


function _getFunctionName(fun) {
    let ret = fun.toString();
    let _index = ret.indexOf('function ');

    /* from start of 'f' + 8 + 1 because of space*/
    let index = _index + 9;
    let length = ret.indexOf('(') - index;
    ret = ret.substr(index, length);

    return ret;
}

module.exports = { getBootCamps, getBootCamp, createBootCamp, updateBootCamp, deleteBootCamp };