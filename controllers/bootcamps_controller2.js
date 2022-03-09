/* these are all middle-ware functions */
/* NB:all unhandled Promise rejections are redirected to Event Handler function is Server.js */

/* PLEASE note some requests require additional input in the HEADER or the BODY of the request */
const MongooseHelper = require('../config/MongooseHelper');

const asyncHandler = require('../middleware/async.handler.js');
const ErrorResponse = require('../utils/ErrorResponse');
const geocoder = require('../utils/geocoder.utils');

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

/**@description: get bootcamps within a radius
 * @route  GET/api/v1/bootcamps/radius/:zipcode/:distance[/:unit] here miles is used
 * @access Private */
function getBootCampsWithinRadius(req, res, next) {
    handler(req, res, _getBootCampsWithinRadius, true)
}

async function _getBootCampsWithinRadius(req, model) {
    const EARTH_RADIUS_KM = 6_378;
    const EARTH_RADIUS_MILES = 3_963;

    /* TODO:add count */
    const response_data = {
        successful: Result.FAILURE,
        status: status,
        count: null,
        data: null
    };

    const { zipcode, distance } = req.params;

    /* get the Latitude and Longitude from the GeoCoder */
    const _location = await geocoder.geocode(zipcode);
    const latitude = _location[0].latitude;
    const longitude = _location[0].longitude;

    /* calculating the radius in Radians*/
    /* divide distance by radius of the earth (Earth radius 3_963miles or 6_378km)*/
    const radius = distance / EARTH_RADIUS_KM

    try {
        const bootcamps = await model.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[lng, lat], radius]
                }
            }
        });

        if (bootcamps) {
            response_data.successful = Result.SUCCESS,
                response_data.status = 200;
            response_data.count = bootcamps.length;
            response_data.data = bootcamps;
        } else {
            response_data.successful = Result.FAILURE;
            response_data.status = 404;
            response_data.data = `resource with query criteria does not exist on DB`;

            /* removing the count property since its not useful in this case */
            delete response_data.count;
        }
    } catch (error) {
        console.log(`Error occurred while fetching BootCamps: ${error.message}`);

        response_data.successful = Result.FAILURE;
        response_data.status = 500;
        response_data.data = error.message;

        delete response_data.count;
    } finally {
        return response_data;
    }
}

/**
 * @description: get all bootcamps 
 * @route GET /api/v1/bootcamps
 * @access Public */
/* to make handling of Promise/async ops easier,wrap with asyncHandler,
   allowing you to get rid of try/catch blocks */
function getBootCamps(req, res, next) {
    handler(req, res, _getBootCamps, true);
}

async function _getBootCamps(req, model) {
    const response_data = {
        successful: Result.FAILURE,
        status: status,
        count: null,
        pagination: null,
        data: null
    };

    /* to be able to filter returned fields */
    const reqQuery = { ...req.query };

    /* fields to exclude for the filtering from the url */
    const fieldsToBeRemoved = ['select', 'sort', 'page', 'limit'];

    fieldsToBeRemoved.forEach(param => delete reqQuery[param]);

    /* to be able to perform filtering on the params passed in */
    /* to add the $ operator since mongoose requires it 
    so using regex to find any mongoose operator in the query string 
    and adding $ at the beginning*/
    let queryString = JSON.stringify(reqQuery);
    queryString = queryString.replace(/\b(gt|gte|lt|in)\b/g, match => `$${match}`);

    const _queryString = JSON.parse(queryString);

    const _query = (_queryString === undefined || _queryString === "") ? {} : _queryString

    try {
        /* const bootcamps = await model.find(_query); */
        const operation = model.find(_query);

        /* for filtering selected fields i.e returning select fields */
        if (req.query.select) {
            /* would be comma seperated so split along the commas, replacing with space
               _id field would be included by default*/
            const queryFields = req.query.select.split(',').join(' ');

            operation = operation.select(queryFields);
        }

        /* for sorting the result by a field */
        if (req.query.sort) {
            /* sorting 1 -> ascending, -1 -> descending */
            /* to enable sorting by multiple fields */
            const sortFields = req.query.split(',').join(' ');

            operation = operation.sort(sortFields);
        } else {
            /* default sorting - so descending*/
            operation = operation.sort('-createdAt');
        }

        /* for pagination, page 1 is default, limit is 25 by default */
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = model.countDocuments();

        operation = operation.skip(startIndex).limit(limit);

        const bootcamps = await operation;

        /* pagination result */
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }

        if (startIndex > 0) {
            pagination.previous = {
                page: page - 1,
                limit
            }
        }

        if (bootcamps) {
            response_data.successful = Result.SUCCESS;
            response_data.status = 200;
            response_data.count = bootcamps.length;
            response_data.data = bootcamps;
        } else {
            response_data.successful = Result.FAILURE;
            response_data.status = 404;
            response_data.data = `no resources saved on the DB`;

            delete response_data.count;
        }

    } catch (error) {
        console.log(`Error occurred while fetching BootCamps:${error.message}`);

        response_data.successful = Result.FAILURE;
        response_data.status = 500;
        response_data.data = error.message;

        delete response_data.count;
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

    const offline_model = await MongooseHelper.getInstance().getBootCampOfflineDBModel();
    const cloud_model = await MongooseHelper.getInstance().getBootCampCloudDBModel();

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

    /* for certain operations like getBootCamp() which should be run only on cloud*/
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

    let _response;
    if (response_obj.count) {
        _response = {
            success: isSuccessful,
            count: response_obj.count,
            data: data
        }
    }
    else {
        _response = {
            success: isSuccessful,
            data: data
        }
    }

    res.status(status).json(_response);
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

module.exports = {
    getBootCamps,
    getBootCamp,
    createBootCamp,
    updateBootCamp,
    deleteBootCamp,
    getBootCampsWithinRadius
};