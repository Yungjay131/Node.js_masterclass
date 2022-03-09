const MongooseHelper = require('../config/MongooseHelper');
const {
    Result,
    sendResponse,
    buildResponse,
    getFunctionName,
    KEY_DEFAULT,
    KEY_SUCCESS,
    KEY_SUCCESS_WITH_PAGINATION,
    status_codes } = require('../utils/utils');

/** 
 * @description get all reviews
 * @route GET /api/v1/reviews
 * @access Public
*/
function getReviews(req, res, next) {
    handler(req, res, _getReviews);
}

async function _getReviews(req, model) {
    let keys = KEY_SUCCESS;
    let params;

    try {
        const reviews = await model.find({});

        if (reviews) {
            params = [Result.SUCCESS, status_codes.SUCCESS, reviews.length, reviews];
        } else {
            const message = `no reviews found at this time`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, 0, message];
        }
    } catch (error) {
        console.error(`error occurred getting reviews: ${error.message}`);
        keys = KEY_DEFAULT;
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/** 
 * @description get reviews for bootcamp
 * @route GET /api/v1/reviews/:bootcampID
 * @access Public
*/
function getReviewsForBootcamp(req, res, next) {
    handler(req, res, _getReviewsForBootcamp);
}

async function _getReviewsForBootcamp(req, model) {
    let keys = KEY_SUCCESS;
    let params;

    try {
        const reviews = await model.find({ bootcamp: req.params.bootcampID });

        if (reviews) {
            params = [Result.SUCCESS, status_codes.SUCCESS, reviews.length, reviews];
        } else {
            const message = `reviews for Bootcamp with ID: ${req.params.bootcampID} does not exist`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, 0, message];
        }
    } catch (error) {
        console.error(`error occurred getting reviews for Bootcamp: ${error.message}`);
        keys = KEY_DEFAULT;
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/** 
 * @description get single reviews
 * @route GET /api/v1/reviews/:id
 * @access Public
*/
function getReview(req, res, next) {
    handler(req, res, _getReview);
}

async function _getReview(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const review = await model.findById(req.params.id).populate({
            path: 'bootcamp',
            select: 'name description'
        });

        if (review) {
            params = [Result.SUCCESS, status_codes.SUCCESS, review];
        } else {
            const message = `Review with ID: ${req.params.id} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        }
    } catch (error) {
        console.error(`error occurred getting Review: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/** 
 * @description add review
 * @route POST /api/v1/reviews/:bootcampID
 * @access Private
*/
function createReview(req, res, next) {
    handler(req, res, _createReview);
}

async function _createReview(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        /* setting the bootcamp field for the review model */
        req.body.bootcamp = req.params.bootcampID;

        /* getting the logged in user, user object is gotten
         from one middleware(ensure its in place o) */
        req.body.user = req.user.id

        const bootcamp_model = await MongooseHelper.getInstance().getBootCampCloudDBModel();

        const bootcamp = await bootcamp_model.findById(req.params.bootcampID);

        if (!bootcamp) {
            const message = `Bootcamp with ID: ${req.params.bootcampID} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            const review = await model.create(req.body);

            if (!review) {
                const message = `could not create Review`;
                params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];
            } else {
                params = [Result.SUCCESS, status_codes.CREATED, review];
            }
        }
    } catch (error) {
        console.error(`error occurred creating Review: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }

}

/** 
 * @description update review
 * @route PUT /api/v1/reviews/:id
 * @access Private
*/
function updateReview(req, res, next) {
    handler(req, res, _updateReview);
}

async function _updateReview(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    const options = {
        new: true,
        runValidators: true
    };

    try {
        const review = await model.findById(req.params.id);

        /* make sure that the review in question belongs to the user requesting it unless user is ADMIN*/
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            const message = `user is not authorized to update resource`;
            params = [Result.SUCCESS, status_codes.UNAUTHORIZED, message];
        } else {
            const _review = await model.findByIdAndUpdate(req.params.id, req.body, options);

            if (_review) {
                params = [Result.SUCCESS, status_codes.SUCCESS, _review];
            } else {
                const message = `could not update Review with ID: ${req.params.id}`;
                params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];
            }
        }

    } catch (error) {
        console.error(`error occurred while updating Review: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }

}

/** 
 * @description delete review
 * @route DELETE /api/v1/reviews/:id
 * @access Private
*/
function deleteReview(req, res, next) {
    handler(req, res, _deleteReview);
}

async function _deleteReview(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const review = await model.findById(req.params.id);

        if (!review) {
            const message = `Review with ID: ${req.params.id} was not found`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            const _review = await review.remove();

            if (!_review) {
                const message = `could not delete Review from DB`;
                params = [Result.SUCCESS, status_codes.INTERNAL_SERVER_ERROR, message];
            } else {
                params = [Result.SUCCESS, status_codes.SUCCESS, _review];
            }
        }
    } catch (error) {
        console.error(`error occurred while deleting Review: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

async function handler(req, res, _function) {
    let response_data;

    const cloud_model = await MongooseHelper.getInstance().getReviewCloudDBModel();
    _function(req, cloud_model)
        .then(data => {
            response_data = data;
        })
        .catch(error => {
            const tag = getFunctionName(_function);
            console.log(`error from ${tag} in review_controller`)
            response_data = error;
        })
        .finally(() => {
            sendResponse(res, response_data);
        })
}

module.exports = {
    getReviews,
    getReviewsForBootcamp,
    getReview,
    createReview,
    updateReview,
    deleteReview
};
