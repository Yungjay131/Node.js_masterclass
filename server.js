const express = require('express');
const dotenv = require('dotenv');
const logger = require('./middleware/logger.js');
const morgan = require('morgan');
const colors = require('colors');

/* remember to put declaration after app.use(Routes.base_url, routes)
   because MiddleWare is executed linearly */
const errorHandler = require('./middleware/error.handler.js');
// const connectDB = require('./config/config_mongoose.js');

/* to use vars in config.env */
dotenv.config({ path: './config/config_env.env' });

/* connecting to the mongoDB DB, should be cloud and local */
// connectDB();

/* for routes */
const { ROUTES } = require('./utils.js');

const routes = require('./routes/bootcamps_router.js');


const app = express();

/* Body Parser:to give access to the body of the request */
app.use(express.json());

/* middleware would be called for every request */
// app.use(logger);

/* middleware for extensive logging */
if (process.NODE_ENV === 'development')
    app.use(morgan('dev'));


/* mount routers */
app.use(ROUTES.base_url, routes);

/* remember middleware is executed in linear order */
// app.use(errorHandler)

const PORT = process.env.PORT;
const message = `Server running in ${process.env.NODE_ENV} mode on port ${PORT} `;
const _message = message.yellow.bold;

const server = app.listen(PORT, console.log(_message));

/* using EventHandles for Emitted Events,handle unhandled Promise rejections(global)*/
process.on('unhandledRejection', (error, promise) => {
    console.log(`Error:${error.message}`.red);

    /* closing server in the case of an error
    resulting from an unhandled promise rejection
    exit code other than 0 indicates error(most likely DB connection error)*/
    server.close(() => process.exit(1));
});
