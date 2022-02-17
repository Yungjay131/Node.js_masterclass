const express = require('express');
const router = express.Router();

/* creating routes */
const { ROUTES } = require('../utils.js');
const methods = require('../controllers/bootcamps_controller.js');

router.route(ROUTES.bootcamps).get(methods.getBootCamps);
router.route(ROUTES.bootcamps).post(methods.createBootCamp);

router.route(ROUTES.bootcamps_id).get(methods.getBootCamp);
router.route(ROUTES.bootcamps_id).put(methods.updateBootCamp);
router.route(ROUTES.bootcamps_id).delete(methods.deleteBootCamp)

module.exports = router;