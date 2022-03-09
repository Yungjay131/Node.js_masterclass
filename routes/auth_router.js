const express = require('express');
const router = express.Router();
const { routeGuard, routeAuthenticator } = require('../middleware/auth.protect');

/* creating routes */
const { ROUTES_USERS } = require('../utils/utils.js');
const methods = require('../controllers/auth_controller.js');

router.route(ROUTES_USERS.register).post(methods.registerNewUser);
router.route(ROUTES_USERS.login).post(methods.loginUser);

router.route(ROUTES_USERS.logout).get(methods.logoutUser);
router.route(ROUTES_USERS.whoami).get(routeGuard, methods.getCurrentUser);

router.route(ROUTES_USERS.forgot_password).post(methods.handleForgotPassword);

router.route(ROUTES_USERS.reset_password).put(methods.resetPassword);
router.route(ROUTES_USERS.update_details).put(routeGuard, methods.updateUserDetails);
router.route(ROUTES_USERS.update_password).put(routeGuard, methods.updateUserPassword);

router.route(ROUTES_USERS.delete_user).delete(methods.deleteUserAccount);

module.exports = router;