const jwt = require('jsonwebtoken');
const MongooseHelper = require('../config/MongooseHelper');
const { sendResponse, buildResponse } = require('../utils/utils');

const KEYS_DEFAULT = ['success', 'status', 'message'];
const MESSAGE_1 = 'you are not authorized to access this URL. Please login and try again';
const PARAMS_DEFAULT = [false, 401, MESSAGE_1];

async function routeGuard(req, res, next) {
    try {
        /* remember to set
          Authorization : Bearer [token] in header of request( from PostMan) */
        const condition_1 = req.headers.authorization;
        const condition_2 = req.headers.authorization.startsWith('Bearer')
        if (condition_1 && condition_2) {
            /* there is space between Bearer and the actual token  */
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.token) {
            /*take token from cookie saved from any request that returns token  */
            token = req.cookies.token;
        }

        if (!token) {
            console.log(MESSAGE_1);
            sendResponse(res, buildResponse(PARAMS_DEFAULT, KEYS_DEFAULT));
            return;
        }

        /* verify token */
        const decodedObj = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodedObj) {
            console.log(MESSAGE_1);
            sendResponse(res, buildResponse(PARAMS_DEFAULT, KEYS_DEFAULT));
            return;
        }


        const model = await MongooseHelper.getInstance().getUserCloudDBModel();
        const user = await model.findById(decodedObj.id);

        if (!user) {
            const message = `user with ID: ${decodedObj.id}  does not exist on DB`;
            console.log(message);
            const params = [false, 404, message];
            sendResponse(res, buildResponse(params, KEYS_DEFAULT));
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.log(error.message);
        const params = [false, 500, `an error occurred validating your access to this route: ${error.message}`];
        sendResponse(res, buildResponse(params, KEYS_DEFAULT));
    }
}

/* comma separated values would be passed in */
function routeAuthenticator(req, res, next) {
    const roles = ['publisher', 'admin'];

    const MESSAGE_2 = `user role: {${req.user.role}.toUpperCase()} is unauthorized to access this route`;

    /* would be either user, admin or publisher */
    if (!roles.includes(req.user.role)) {
        const params = [false, 403, MESSAGE_2];
        sendResponse(res, buildResponse(params, keys));
        return;
    }

    next();
}

function routeAuthenticator_admin(req, res, next) {
    const roles = ['admin'];

    const MESSAGE_2 = `user role: {${req.user.role}.toUpperCase()} is unauthorized to access this route.\n` +
        `only Admin are`;

    /* would be only admin */
    if (!roles.includes(req.user.role)) {
        const params = [false, 403, MESSAGE_2];
        sendResponse(res, buildResponse(params, keys));
        return;
    }

    next();
}

function routeAuthenticator2(roles = ['publisher', 'admin']) {
    return (req, res, next) => {
        const MESSAGE_2 = `user role: {${req.user.role}.toUpperCase()} is unauthorized to access this route`;

        /* would be either user, admin or publisher */
        if (!roles.includes(req.user.role)) {
            const params = [false, 403, MESSAGE_2];
            sendResponse(res, buildResponse(params, keys));
            return;
        }

        next();
    }
}

/* add in bootcamps router and courses router
>>router...get(protectRoute, getBootCamp) */
module.exports = { routeGuard, routeAuthenticator, routeAuthenticator_admin };