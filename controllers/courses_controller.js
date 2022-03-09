const MongooseHelper = require('../config/MongooseHelper');
const { Result, sendResponse, buildResponse, getFunctionName, status_codes } = require('../utils/utils');

const KEY_DEFAULT = ['successful', 'status', 'data'];
const KEY_SUCCESS = ['successful', 'status', 'count', 'data'];
const KEY_SUCCESS_WITH_PAGINATION = ['successful', 'status', 'count', 'pagination', 'data'];

/**
 * @desc Get Courses
 * @route GET /api/v1/courses
 * @access Public  */

function getCourses(req, res, next) {
    handler(req, res, _getCourses);
}

async function _getCourses(req, model) {
    let keys = KEY_SUCCESS;
    let params;

    try {
        /* populate adds the bootcamp field???
         if you want the entire bootcamp to be whats populated
         and not just certain fields ...populate('bootcamp')*/
        const courses = await model.find({}).populate({
            path: 'bootcamp',
            select: 'name description'
        });

        if (courses) {
            params = [Result.SUCCESS, status_codes.SUCCESS, courses.length, courses];
        } else {
            const message = `resource with ID: ${req.params.id} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, 0, message]
        }
    } catch (error) {
        console.log(`error occurred getting Courses: ${error.message}`);
        keys = KEY_DEFAULT;
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @desc Get Courses for a specific bootcamp
 * @route GET /api/v1/courses/:bootcampID/courses
 * @access Public  */
function getCoursesForBootCamp(req, res, next) {
    handler(req, res, _getCoursesForBootCamp);
}

async function _getCoursesForBootCamp(req, model) {
    let keys = KEY_SUCCESS;
    let params;

    try {
        const courses = await model.find({ bootcamp: req.params.bootcampID });

        if (courses) {
            params = [Result.SUCCESS, status_codes.SUCCESS, courses.length, courses];
        } else {
            const message = `resource for ID: ${req.params.bootcampID} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.SUCCESS, 0, message];
        }
    } catch (error) {
        console.log(`error occurred getting Courses for Bootcamp: ${error.message}`);
        keys = KEY_DEFAULT;
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}


/**
 * @desc Get single Course
 * @route GET /api/v1/courses/:id
 * @access Public  */
function getCourse(req, res, next) {
    handler(res, res, _getCourse);
}

async function _getCourse(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const course = await model.findById(req.params.id).populate({
            path: 'bootcamp',
            select: 'name description'
        });

        if (course) {
            params = [Result.SUCCESS, status_codes.SUCCESS, course];
        } else {
            const message = `resource with ID: ${req.params.id} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        }
    } catch (error) {
        console.log(`error occurred getting Course: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @desc add single Course
 * @route POST /api/v1/courses/:bootcampID/courses
 * @access Private  */
function createCourse(req, res, next) {
    handler(req, res, _createCourse);
}

async function _createCourse(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        /* since the course model has a required field of bootcamp */
        req.body.bootcamp = req.params.bootcampID;

        req.body.user = req.user.id;

        const bootcamp_model = await MongooseHelper.getInstance().getBootCampCloudDBModel();
        const bootcamp = await bootcamp_model.findById(req.params.bootcampID).populate({
            path: 'bootcamp',
            select: 'name description'
        });

        if (!bootcamp) {
            const message = `resource with bootcamp ID:${req.params.id}`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            /* making sure the person that wants to add a course is the bootcamp owner 
              or is an Admin (since admins are allowed access everywhere*/
            if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
                const message = `user: ${req.user.id} is not authorized to add a course to bootcamp: ${bootcamp._id}`
            }
            const course = await model.create(req.body);

            if (course) {
                params = [Result.SUCCESS, status_codes.CREATED, course];
            } else {
                const message = `resource was not successfully created`
                params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
            }
        }
    } catch (error) {
        console.log(`error occurred while creating Course: ${error, message}`);
        params = [Result.FAILURE, status_codes.NOT_FOUND, error.message];
    } finally {
        return buildResponse(params, keys);
    }

}

/**
 * @desc update Course
 * @route PUT /api/v1/courses/:id
 * @access Private  */
function updateCourse(req, res, next) {
    handler(req, res, _updateCourse);
}

async function _updateCourse(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    const options = {
        new: true,
        runValidators: true
    }

    try {
        let course = await model.findById(req.params.id);

        if (!course) {
            const message = `resource with ID: ${req.params.id} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            course = await model.findByIdAndUpdate(req.params.id, req.body, options);

            if (!course) {
                const message = `resource was not successfully updated`;
                params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
            } else {
                params = [Result.SUCCESS, status_codes.CREATED, course];
            }
        }
    } catch (error) {
        console.log(`error occurred updating course`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

/**
 * @desc delete Course
 * @route DELETE /api/v1/courses/:id
 * @access Private  */
function deleteCourse(req, res, next) {
    handler(req, res, _deleteCourse);
}

async function _deleteCourse(req, model) {
    let keys = KEY_DEFAULT;
    let params;

    try {
        const course = await model.findById(req.params.id);

        if (!course) {
            const message = `resource with ID: ${req.params.id} does not exist on DB`;
            params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
        } else {
            const _course = await course.remove();

            if (!_course) {
                const message = `resource was not successfully deleted`;
                params = [Result.SUCCESS, status_codes.NOT_FOUND, message];
            } else {
                params = [Result.SUCCESS, status_codes.CREATED, _course];
            }
        }
    } catch (error) {
        console.log(`error occurred while deleting Course: ${error.message}`);
        params = [Result.FAILURE, status_codes.INTERNAL_SERVER_ERROR, error.message];
    } finally {
        return buildResponse(params, keys);
    }
}

async function handler(req, res, _function) {
    let response_data;
    const tag = getFunctionName(_function);

    const model = await MongooseHelper.getInstance().getCourseDBModel();
    _function(req, model)
        .then(data => {
            response_data = data;
        })
        .catch(error => {
            console.log(`error from ${tag} in course_controller`);
            response_data = error;
        })
        .finally(() => {
            sendResponse(res, response_data);
        })
}

module.exports = {
    getCourses,
    getCoursesForBootCamp,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse
};