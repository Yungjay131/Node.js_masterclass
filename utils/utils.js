function sendResponse(res, response_data) {
    res.status(response_data.status).json(response_data);
}

function buildResponse(params, keys) {
    if (params.length !== keys.length) {
        console.log('check your keys and their corresponding params');
        return;
    }

    let obj = {};
    params.forEach((param, index) => {
        obj[keys[index]] = param;
    });

    console.log(obj);
    return obj;
}


function getFunctionName(fun) {
    let ret = fun.toString();
    let _index = ret.indexOf('function ');

    /* from start of 'f' + 8 + 1 because of space*/
    let index = _index + 9;
    let length = ret.indexOf('(') - index;
    ret = ret.substr(index, length);

    return ret;
}

const KEY_DEFAULT = ['successful', 'status', 'data'];
const KEY_SUCCESS = ['successful', 'status', 'count', 'data'];
const KEY_SUCCESS_TOKEN = ['success', 'status', 'token_name', 'token', 'options'];
const KEY_SUCCESS_WITH_PAGINATION = ['successful', 'status', 'count', 'pagination', 'data'];

const status_codes = {
    SUCCESS: 200,
    CREATED: 201,
    ACCEPTED: 202,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    NOT_ACCEPTABLE: 406,
    REQUEST_TIMEOUT: 408,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};
Object.freeze(status_codes);

const ROUTES_BOOTCAMPS = {
    base_url: '/api/v1/bootcamps',
    bootcamps: '/',
    bootcamps_id: '/:id',
    bootcamps_by_location: '/radius/:zipcode/:distance',
    bootcamps_by_location_with_unit: '/radius/:zipcode/:distance/:unit',
    bootcamps_upload_photo: '/:id/photo'
};
Object.freeze(ROUTES_BOOTCAMPS);


const ROUTES_COURSES = {
    base_url: '/api/v1/courses',
    courses: '/',
    courses_by_bootcampID: '/:bootcampID/courses',
    courses_by_courseID: '/:id'
};
Object.freeze(ROUTES_COURSES);

const ROUTES_USERS = {
    base_url: '/api/v1/auth',
    register: '/register',
    login: '/login',
    logout: '/logout',
    whoami: '/whoami',
    forgot_password: '/forgotpassword',
    reset_password: '/resetpassword/:resetToken',
    update_details: '/updatedetails',
    update_password: '/updatepassword',
    delete_user: '/delete'
};
Object.freeze(ROUTES_USERS);

const ROUTES_ADMIN = {
    base_url: '/api/v1/admin',
    register: '/register',
    user_by_id: '/:id',

};
Object.freeze(ROUTES_ADMIN);

const ROUTES_REVIEWS = {
    base_url: '/api/v1/reviews',
    reviews: '/',
    reviews_by_bootcampID: '/:bootcampID',
    review_by_reviewID: '/:id',
};
Object.freeze(ROUTES_REVIEWS);

const ROUTES_GENERAL = {
    base_url: '/api/v1/general',
    import_data: '/import',
    delete_data: '/delete'
};
Object.freeze(ROUTES_GENERAL);

const Result = {
    SUCCESS: 'success',
    FAILURE: 'failure'
};
Object.freeze(Result);

const model_names = {
    BOOTCAMPS: 'Bootcamps',
    COURSES: 'Courses',
    USERS: 'Users',
    REVIEWS: 'Reviews'
};
Object.freeze(model_names);

module.exports = {
    Result,
    ROUTES_BOOTCAMPS,
    ROUTES_COURSES,
    ROUTES_USERS,
    ROUTES_ADMIN,
    ROUTES_REVIEWS,
    ROUTES_GENERAL,
    sendResponse,
    buildResponse,
    getFunctionName,
    KEY_DEFAULT,
    KEY_SUCCESS,
    KEY_SUCCESS_TOKEN,
    KEY_SUCCESS_WITH_PAGINATION,
    status_codes,
    model_names
};