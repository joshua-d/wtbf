let createError = require('http-errors');
let express = require('express');
let path = require('path');

let indexRouter = require('./routes/index');
let gameRouter = require('./routes/game');
let roomsRouter = require('./routes/rooms');


let app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/', indexRouter);
app.use('/game', gameRouter);
app.use('/rooms', roomsRouter);

app.use(express.static(path.join(__dirname, '/../frontend/public')));
app.use(express.static(path.join(__dirname, '/../frontend/build')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

//TODO think about reinstalling jquery and semantic - www refactor messed with them