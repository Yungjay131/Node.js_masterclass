const express = require('express');
const dotenv = require('dotenv');
const logger = require('./middleware/logger.js');
const morgan = require('morgan');
const colors = require('colors');
const fileupload = require('express-fileupload');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const MongooseHelper = require('./config/MongooseHelper');

/* for routes */
const {
    ROUTES_BOOTCAMPS,
    ROUTES_COURSES,
    ROUTES_USERS,
    ROUTES_GENERAL,
    ROUTES_ADMIN } = require('./utils/utils.js');

/* to use vars in config.env (should be loaded as early as possible)*/
dotenv.config({ path: './config/config_env.env' });

/* connecting to the mongoDB DB, should be cloud and local */
MongooseHelper.getInstance();

/* remember to put declaration after app.use(Routes.base_url, routes)
   because MiddleWare is executed linearly */
const errorHandler = require('./middleware/error.handler.js');

const routes_bootCamps = require('./routes/bootcamps_router.js');
const routes_courses = require('./routes/courses_router.js');
const routes_users = require('./routes/auth_router.js');
const routes_admin = require('./routes/admin_router.js');
const routes_general = require('./routes/general_router.js');

const app = express();

/* Body Parser:to give access to the body of the request */
app.use(express.json());

/* middleware would be called for every request */
// app.use(logger);

/* for returning cookies??? with token (check auth_controller) */
app.use(cookieParser());

/* middleware for extensive logging */
if (process.NODE_ENV === 'development')
    app.use(morgan('dev'));

/* middleware for preventing sanitize attacks
   eg of sanitize {
       "email": { "$gt":""},
       "password": "123456"
   } passed in the POST body of Login ROUTE would actually get a user
   as long as the password exists for any user in the DB  */
app.use(mongoSanitize());

/* set security headers */
app.use(helmet());

/* cross-site scripting 
eg POST create new bootcamp body{
   "name":"...<script></script>"
}
*/
app.use(xss());


/* rate limiting, limiting calls per 10 minutes */
const limiter = rateLimit({
    windowMs: 10 * 60 * 1_000,
    max: 100
});
app.use(limiter);

/* prevent HTTP param pollution */
app.use(hpp());

/* enable CORS,for handling communicating between front-end and backend
 on different domains */
app.use(cors());

/* middleware for file upload */
app.use(fileupload());

/* setting static folder for uplading bootcamp photo */
app.use(express.static(path.join(__dirname, 'public')));

/* mount routers */
app.use(ROUTES_BOOTCAMPS.base_url, routes_bootCamps);
app.use(ROUTES_COURSES.base_url, routes_courses);
app.use(ROUTES_USERS.base_url, routes_users);
app.use(ROUTES_ADMIN.base_url, routes_admin);
app.use(ROUTES_GENERAL.base_url, routes_general);

/* remember middleware is executed in linear order */
// app.use(errorHandler)

const PORT = process.env.PORT;
const message = `Server running in ${process.env.NODE_ENV} mode on port ${PORT} `;
const _message = message.yellow.bold;

const server = app.listen(PORT, console.log(_message));

/* using EventHandles for Emitted Events,handle unhandled Promise rejections(global)*/
process.on('unhandledRejection', (error, promise) => {
    console.log(`Error: ${error.message}`.red);

    /* closing server in the case of an error
    resulting from an unhandled promise rejection
    exit code other than 0 indicates error(most likely DB connection error)*/
    server.close(() => process.exit(1));
});

//express-mongo-sanitize