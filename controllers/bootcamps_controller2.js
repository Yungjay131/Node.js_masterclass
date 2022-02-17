const { conn_offline, conn_cloud } = require('../config/config_mongoose.js');

const Result = {
    SUCCESS: 'success',
    FAILURE: 'failure'
};

Object.freeze(Result);

let error_data = { status: 500, message: 'internal server error' };

function getBootCamps(req, res, next) { }
function getBootCamp(req, res, next) { }
function createBootCamp(req, res, next) { }
function updateBootCamp(req, res, next) { }
function deleteBootCamp(req, res, next) { }

function _handler(req, res, _function) { }
function _sendResponse(res, statuses, res_data) { }
function _getFunctionName(fun) { }

module.exports = { getBootCamps, getBootCamp, createBootCamp, updateBootCamp, deleteBootCamp };