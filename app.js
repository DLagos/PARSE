var express = require('express');
var session  = require('express-session');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var expressValidator = require('express-validator');
var flash = require('connect-flash');

require('./config/passport')(passport); // pass passport for configuration

var index = require('./routes/index');
var about = require('./routes/about');
var search_results = require('./routes/search_results');
var user = require('./routes/user');

var app = express();

/* Database Connection Info */
var connection  = require('express-myconnection');
var mysql = require('mysql');

// required for passport
app.use(session({
    secret: 'vidyapathaisalwaysrunning',
    resave: true,
    saveUninitialized: true
} )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());


app.use(

    connection(mysql,{

        host: "us-cdbr-iron-east-05.cleardb.net",
        user: "b3220b75dccc0a",
        password: "ddd8323b",
        database: "heroku_d6fcf8fd2312a32",
        multipleStatements: true

    },'pool') //or single

);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressValidator());


app.use('/', index);
app.use('/about', about);
app.use('/search_results', search_results);
app.use('/user', user);
app.use('*/images',express.static('public/images'));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
