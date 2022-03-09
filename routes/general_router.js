const { importDataToDB, deleteDataFromDB } = require('../controllers/general_controller');

const express = require('express');
const router = express.Router();

const { ROUTES_GENERAL } = require('../utils/utils');

router.route(ROUTES_GENERAL.import_data).get(importDataToDB);
router.route(ROUTES_GENERAL.delete_data).delete(deleteDataFromDB);

module.exports = router;