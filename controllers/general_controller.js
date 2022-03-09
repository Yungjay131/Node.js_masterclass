
const { _importDataToDB, _deleteDataFromDB } = require('../utils/seeder');

const KEY_DEFAULT = ['successful', 'status', 'data'];
const KEY_SUCCESS = ['sucessful', 'status'];

/** 
 * @description add data from JSON files to DB
 * @route GET /api/v1/general/import
 * @access Public
*/
function importDataToDB(req, res, next) {
    const result = _importDataToDB();
    let status = 200;

    if (!result.status)
        status = 500;

    res.status(status).json(result);
}

function deleteDataFromDB(req, res, next) {
    const result = _deleteDataFromDB();
    let status = 200;

    if (!result.status)
        status = 500;

    res.status(status).json(result);
}

module.exports = { importDataToDB, deleteDataFromDB };