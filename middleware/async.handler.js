/* for handling all Promise resolution and try/catch..might have to read up on the documentation */
/* seems to be a Higher Order Function */
const asyncHandler = _function => (req, res, next) =>
    Promise
    .resolve(_function(req, res, next))
    .catch(next);

module.exports = asyncHandler;