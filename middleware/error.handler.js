/* middleware for all error handling from requests
   remember to use in server.js */
const errorHandler = (error, req, res, next) => {
    /* getting all the properties in error */
    let _error = { ...error };
    console.log(error.stack.red);

    console.log(error.name);
    
    res.status(error.statusCode || 500).json(
        {
            success: false,
            error: error.message || 'server error'
        }
    );
};

module.exports = errorHandler;