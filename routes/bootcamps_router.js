const express = require('express');
const router = express.Router();

/* creating routes */
const { ROUTES_BOOTCAMPS } = require('../utils/utils.js');
const methods = require('../controllers/bootcamps_controller.js');

const { routeGuard, routeAuthenticator } = require('../middleware/auth.protect');

/* for situation where api/v1/bootcamps/:bootcampID/courses
   including other resources */
/* const courseRouter = require('./courses_router');
router.use('/:bootcampID/courses', courseRouter);
 */

//const getResults = require('../middleware/advanced.results');

router.use(routeGuard);

router.route(ROUTES_BOOTCAMPS.bootcamps).get(methods.getBootCamps);
router.route(ROUTES_BOOTCAMPS.bootcamps).post(routeAuthenticator, methods.createBootCamp);

router.route(ROUTES_BOOTCAMPS.bootcamps_id).get(methods.getBootCamp);
router.route(ROUTES_BOOTCAMPS.bootcamps_id).put(methods.updateBootCamp);
router.route(ROUTES_BOOTCAMPS.bootcamps_id).delete(methods.deleteBootCamp)

router.route(ROUTES_BOOTCAMPS.bootcamps_by_location).get(methods.getBootCampsWithinRadius);
router.route(ROUTES_BOOTCAMPS.bootcamps_by_location_with_unit).get(methods.getBootCampsWithinRadiusUnitSpecified);

router.route(ROUTES_BOOTCAMPS.bootcamps_upload_photo).put(routeGuard, methods.uploadPhotoForBootcamp)

module.exports = router;