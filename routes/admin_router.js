const express = require('express');
const router = express.Router();
const { routeGuard, routeAuthenticator_admin } = require('../middleware/auth.protect');

const { ROUTES_ADMIN } = require('../utils/utils.js');
const methods = require('../controllers/admin_controller.js');


router.use(routeGuard);
router.use(routeAuthenticator_admin);

router.route(ROUTES_ADMIN.register).post(methods.registerNewUser);
router.route(ROUTES_ADMIN.user_by_id).get(methods.getUser);

router.route(ROUTES_ADMIN.user_by_id).put(methods.updateUser);
router.route(ROUTES_ADMIN.user_by_id).delete(methods.deleteUser);

module.exports = router;