const express = require('express');
const router = express.Router();

/* if you want to enable routing to this router from other routers
like in the /api/v1/bootcamps/:bootcampID/courses case (refer to bootcamps_router for more info)
const router = express.Router({ mergeParams: true }); */

/* creating routes */
const { ROUTES_COURSES } = require('../utils/utils.js');
const methods = require('../controllers/courses_controller.js');

router.route(ROUTES_COURSES.courses).get(methods.getCourses);
router.route(ROUTES_COURSES.courses_by_bootcampID).get(methods.getCoursesForBootCamp);
router.route(ROUTES_COURSES.courses_by_courseID).get(methods.getCourse);

/* you can chain requests going to the same URL but differ in Request Type
   eg router.route(api/v1/courses/).post(...).get(...).delete(...) */
router.route(ROUTES_COURSES.courses_by_bootcampID).post(methods.createCourse);

/* could need to run seeder to delete and update  */
router.route(ROUTES_COURSES.courses_by_courseID).put(methods.updateCourse);

router.route(ROUTES_COURSES.courses_by_courseID).delete(methods.deleteCourse);

module.exports = router;