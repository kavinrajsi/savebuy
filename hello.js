/**
 * expressJs app, middleware, port number, database connection
 */
const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000;
const db = require('./lib/connection');
const exphbs = require('express-handlebars');
const moment = require('moment');

/**
 * NOTE: need to learn how to add empty password in config file
 */
require('dotenv').config();

app.use(require('./lib/database'));
app.use(require('./lib/api'));

// to support URL-encoded bodies
app.use(session({
  key: 'user_sid',
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// Static file
app.use(express.static('public'));

// Template engine
const handlebars = exphbs.create({
  extname: '.hbs',
  helpers: {
    numberInc: function (value) {
      return parseInt(value) + 1;
    },
    chcount: function (value) {
      return value == 12;
    },
    dataFormate: function (value, format) {
      let DateFormats = {
        year: "YYYY",
        medium: "DD - MM",
        long: "DD - MM - YYYY"
      };

      let date = moment(value);
      format = DateFormats[format];
      return date.format(format);
    },
    session: function (req, id) {
      req.session.id = id;
    }

  }
});
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

const routes = require('./server/routes/users');
app.use('/', routes);

// Server port
app.listen(port, () => {
  console.log(`server started on ${port}`);
});
app.timeout = 5000;
