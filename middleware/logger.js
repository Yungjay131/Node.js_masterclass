/* middleware-functions that have access to the Request, Response cycle */

/**
 * @description Logs full URL details to the Console
 */
const logger = (req, res, next) => {
    /* this var would be available else where along the cycle, like in Routes
       useful for things like Authentication and Validation for Private resources */
    // req.hello = "That's Whatsup";

    console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`);

    /* move on to the next piece of function in the cycle */
    next();
};

module.exports = logger;