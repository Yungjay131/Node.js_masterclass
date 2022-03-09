/* these are all middle-ware functions */
/* NB:all unhandled Promise rejections are redirected to Event Handler function is Server.js */

/* PLEASE note some requests require additional input in the HEADER or the BODY of the request */
const MongooseHelper = require('../config/MongooseHelper');

const asyncHandler = require('../middleware/async.handler.js');
const ErrorResponse = require('../utils/ErrorResponse');
const geocoder = require('../utils/geocoder.utils');
const {
    Result,
    sendResponse,
    buildResponse,
    getFunctionName,
    KEY_DEFAULT,
    KEY_SUCCESS,
    KEY_SUCCESS_WITH_PAGINATION,
    status_codes } = require('../utils/utils');



const path = require('path');



/**
 * @description: get bootcamps within a radius
 * @route  GET/api/v1/bootcamps/radius/:zipcode/:distance
 * @access Private */
function getBootCampsWithinRadius(req, res, next) {
    handler(req, res, _getBootCampsWithinRadius);
}

async function _getBootCampsWithinRadius(req, model) {
    const EARTH_RADIUS_KM = 6_378;
    const EARTH_RADIUS_MILES = 3_963;

    let keys = KEY_DEFAULT;
    let params;

    const { zipcode, distance } = req.params;

    /* get the Latitude and Longitude from the GeoCoder */
    const _location = await geocoder.geocode(zipcode);
    const longitude = _location[0].longitude;
    const latitude = _location[0].latitude;

    /* calculating the radius in Radians*/
    /* divide distance by radius of the earth (Earth radius 3_963miles or 6_378km)*/
    const radius = distance / EARTH_RADIUS_KM

    try {
        const bootcamps = await model.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radius]
                }
            }
        });

        if (bootcamps) {
            keys = KEY_SUCCESS;
            params = [Result.SUCCESS, status_codes.SUCCESS, bootcamps.length, bootcamps];
        } else {
            const message = `resource with query criteria does not exist on DB`;
            keys = KEY_SUCCESS;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, 0, message];
        }
    } catch (error) {
        console.log(`Error occurred while fetching BootCamps within radius: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @description: get bootcamps within a radius
 * @route  GET/api/v1/bootcamps/radius/:zipcode/:distanc/:unit here miles is used
 * @access Private */
function getBootCampsWithinRadiusUnitSpecified(req, res, next) {
    handler(req, res, _getBootCampsWithinRadiusUnitSpecified);
}

async function _getBootCampsWithinRadiusUnitSpecified(req, model) {
    const EARTH_RADIUS_KM = 6_378;
    const EARTH_RADIUS_MILES = 3_963;

    let param, params;
    let keys = KEY_DEFAULT;

    const { zipcode, distance, unit } = req.params;
    switch (unit) {
        case 'km': {
            param = EARTH_RADIUS_KM;
            break;
        }
        case 'miles': {
            param = EARTH_RADIUS_MILES;
            break;
        }
        default: {
            param = EARTH_RADIUS_KM;
            break;
        }
    }

    const _location = await geocoder.geocode(zipcode);
    const longitude = _location[0].longitude;
    const latitude = _location[0].latitude;

    const radius = distance / param;

    try {
        const bootcamps = await model.find({
            location: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radius]
                }
            }
        });

        if (bootcamps) {
            keys = KEY_SUCCESS;
            params = [Result.SUCCESS, status_codes.SUCCESS, bootcamps.length, bootcamps];
        } else {
            const message = `resource with query criteria does not exist on DB`;
            keys = KEY_SUCCESS;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, 0, message];
        }
    } catch (error) {
        console.log(`Error occurred while fetching BootCamps within radius: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @description: get all bootcamps 
 * @route: GET /api/v1/bootcamps
 * @access Public */
function getBootCamps(req, res, next) {
    handler(req, res, _getBootCamps);
}

async function _getBootCamps(req, model) {
    let keys = KEY_DEFAULT;
    let params;
    let operation;

    /* to be able to filter returned fields */
    const reqQuery = { ...req.query };

    /* fields to exclude for the filtering from the url */
    const fieldsToBeRemoved = ['select', 'sort', 'page', 'limit'];
    fieldsToBeRemoved.forEach(param => delete reqQuery[param]);

    try {
        operation = _handleFind(model, reqQuery);
        operation = _handleSelect(operation, req);
        operation = _handleSorting(operation, req);

        const { _operation, pagination } = _handlePagination(operation, req, model.countDocuments());

        const bootcamps = await _operation;

        if (bootcamps) {
            if (Object.keys(pagination).length === 0) {
                keys = KEY_SUCCESS;
                params = [Result.SUCCESS, status_codes.SUCCESS, bootcamps.length, bootcamps];
            } else {
                keys = KEY_SUCCESS_WITH_PAGINATION;
                params = [Result.SUCCESS, status_codes.SUCCESS, bootcamps.length, pagination, bootcamps];
            }

        } else {
            const message = `resource with query criteria does not exist on DB or DB is empty`;
            keys = KEY_SUCCESS
            params = [Result.SUCCESS, status_codes.NOT_FOUND, 0, message]
        }

    } catch (error) {
        console.log(`error occurred while getting BootCamps: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}
/* #region _getBootCamps() Helper Methods */
function _handleFind(model, reqQuery) {
    /* to be able to perform filtering on the params passed in */
    /* to add the $ operator since mongoose requires it 
    so using regex to find any mongoose operator in the query string 
    and adding $ at the beginning*/
    let queryString = JSON.stringify(reqQuery);
    queryString = queryString.replace(/\b(gt|gte|lt|in)\b/g, match => `$${match}`);

    const _queryString = JSON.parse(queryString);

    const _query = (_queryString === undefined || _queryString === "") ? {} : _queryString

    operation = model.find(_query);

    /* for creating virtual fields for courses associated with a BootCamp
       you could also select only certain fields from courses and not just display the whole thing
       (refer to courses_controller for more info) */
    return operation.populate('courses');
}
function _handleSelect(operation, req) {
    /* would be comma separated so split along the commas, replacing with space
            _id field would be included by default*/
    console.log(req.query);
    if (Object.keys(req.query).length === 0) return operation;

    const queryFields = req.query.select.split(',').join(' ');
    return operation.select(queryFields);
}

function _handleSorting(operation, req) {
    /* for sorting the result by a field */
    if (Object.keys(req.query).length === 0) return operation;

    if (req.query.sort) {
        /* sorting 1 -> ascending, -1 -> descending */
        /* to enable sorting by multiple fields */
        const sortFields = req.query.sort.split(',').join(' ');

        operation = operation.sort(sortFields);
    } else {
        /* default sorting - so descending*/
        operation = operation.sort('-createdAt');
    }

    return operation;
}

function _handlePagination(_operation, req, total) {

    const pagination = {};
    if (Object.keys(req.query).length === 0) return { _operation, pagination };

    /* for pagination, page 1 is default, limit is 25 by default */
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    /* pagination result */
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

    _operation = _operation.skip(startIndex).limit(limit);
    return { _operation, pagination };
}
/* #endregion */

/**
 * @description: get a specified bootcamp 
 * @route: GET /api/v1/bootcamps/:id
 * @access Public */
function getBootCamp(req, res, next) {
    handler(req, res, _getBootCamp)
}

async function _getBootCamp(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const bootcamp = await model.findById(req.params.id);

        if (bootcamp) {
            keys = KEY_SUCCESS;
            params = [Result.SUCCESS, status_codes.SUCCESS, 1, bootcamp];
        } else {
            const message = `resource with ID: ${req.params.id} does not exist on DB`;
            keys = KEY_SUCCESS
            params = [Result.SUCCESS, status_codes.NOT_FOUND, 0, message];
        }
    } catch (error) {
        console.log(`error occurred getting BootCamp: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**@description: create bootcamp 
 * @route POST /api/v1/bootcamps
 * @access Private */
function createBootCamp(req, res, next) {
    handler(req, res, _createBootCamp);
}

async function _createBootCamp(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        /* check if user has published a bootcamp, since its 1 per publisher */
        const publishedBootcamp = await model.findOne({ user: req.user.id });

        if (publishedBootcamp && req.user.role !== 'admin') {
            const message = `user has already published a Bootcamp and its maximum of 1 per user`;
            params = [Result.SUCCESS, status_codes.UNAUTHORIZED, message];
        } else {
            /* adding user i.e owner of the bootcamp
                      gotten from routeAuthenticator??? middleware */
            req.body.user = req.user;
            const bootcamp = await model.create(req.body);

            if (bootcamp) {
                params = [Result.SUCCESS, status_codes.CREATED, bootcamp];
            } else {
                const message = `resource was not successfully created`;
                params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
            }
        }

    } catch (error) {
        console.log(`error occurred while creating Bootcamp: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @description: update a bootcamp 
 * @route PUT /api/v1/bootcamps/:id
 * @access Private */
function updateBootCamp(req, res, next) {
    handler(req, res, _updateBootCamp);
}

async function _updateBootCamp(req, model) {
    const options = {
        new: true,
        runValidators: true
    };

    let params;
    let keys = KEY_DEFAULT

    try {
        const _bootcamp = await model.findById(req.params.id);

        if (_bootcamp) {
            /* mae sure the person trying to update is owner of bootcamp */
            if (_bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
                const message = `user ${req.params.id} is not authorized to update this bootcamp`;
                params = [Result.SUCCESS, status_codes.UNAUTHORIZED, message];
            } else {
                const bootcamp = await model.findByIdAndUpdate(req.params.id, req.body, options);
                params = [Result.SUCCESS, status_codes.CREATED, bootcamp];
            }
        } else {
            const message = `resource with ID: ${req.params.id} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        }
    } catch (error) {
        console.log(`error occurred trying to update BootCamp: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @description delete a bootcamp 
 * @route DELETE /api/v1/bootcamps/:id
 * @access Private */
function deleteBootCamp(req, res, next) {
    handler(req, res, _deleteBootCamp);
}

async function _deleteBootCamp(req, model) {
    let params;
    let keys = KEY_DEFAULT;

    try {
        /* not using findByIdAndDelete() because then the pre hook function in bootcamp_model
          for deleting courses associated with a bootcamp wont run */
        //const bootcamp = await model.findByIdAndDelete(req.params.id);

        const _bootcamp = await model.findById(req.params.id);
        let bootcamp;
        if (_bootcamp) {
            /* it exists so delete, this way triggers pre-delete middleware */
            bootcamp = _bootcamp.remove();
        }


        if (bootcamp) {
            params = [Result.SUCCESS, status_codes.CREATED, bootcamp];
        } else {
            const message = `resource with ID: ${req.params.id} does not exist on DB`
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        }
    } catch (error) {
        console.log(`error occurred trying to delete BootCamp: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @description upload photo bootcamp 
 * @route PUT /api/v1/bootcamps/:id/photo
 * @access Private */
function uploadPhotoForBootcamp(req, res, next) {
    handler(req, res, _uploadPhotoForBootcamp);
}

async function _uploadPhotoForBootcamp(req, model) {
    /* remember to set public/uploads as static folder in server.js  */
    let keys = KEY_DEFAULT;
    let params;
    try {
        //TODO:fixme: fix this bad code later on
        /* there is an actual uploaded file */
        if (!req.files) {
            const message = `please upload an image with type of JPEG or PNG and with size not more than 10MB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        }
        else {
            /* called the file 'file'-> key in form-data */
            const file = req.files.file;
            const bootcamp = await model.findById(req.params.id);

            if (!bootcamp) {
                const message = `resource with ID: ${req.params.id} does not exist on DB`
                params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
            }
            else {
                /* make sure that image is a photo */
                const condition_1 = file.mimetype === 'image/jpeg';
                const condition_2 = file.mimetype === 'image/png';
                const condition_3 = file.size > (10 * 1024 * 1024);
                if (!condition_1 && !condition_2) {
                    const message = `invalid file type. Please upload an image with type of JPEG or PNG`;
                    params = [Result.SUCCESS, status_codes.BAD_REQUEST, message];
                } else if (condition_3) {
                    const message = `file size greater than the limit. Please upload a file with size not greater than 10MB`;
                    params = [Result.SUCCESS, status_codes.BAD_REQUEST, message];
                } else {
                    /* create custom filename */
                    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

                    await file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`);

                    console.log(`upload async operation finished`);

                    const _bootcamp = await model.findByIdAndUpdate(req.params.id, { photo: file.name });

                    if (!_bootcamp) {
                        const message = `failed to update resource with ID: ${req.params.id} does not exist on DB`
                        params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
                    } else {
                        const data = file.name;
                        params = [Result.SUCCESS, status_codes.CREATED, data];
                    }
                    
                }
            }
        }
    } catch (error) {
        const message = `error occurred getting BootCamp: ${error.message}`;
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

async function handler(req, res, _function) {
    let response_data;

    const cloud_model = await MongooseHelper.getInstance().getBootCampCloudDBModel();
    _function(req, cloud_model)
        .then(data => {
            response_data = data;
        })
        .catch(error => {
            const tag = getFunctionName(_function);
            console.log(`error from ${tag} in bootcamp_controller: ${error}`);
            response_data = error;
        })
        .finally(() => {
            sendResponse(res, response_data);
        })
}




module.exports = {
    getBootCamps,
    getBootCampsWithinRadius,
    getBootCampsWithinRadiusUnitSpecified,
    getBootCamp,
    createBootCamp,
    updateBootCamp,
    deleteBootCamp,
    uploadPhotoForBootcamp
};