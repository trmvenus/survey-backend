var express = require('express');
var jwt = require('jsonwebtoken');

var { verify } = require('../core/verify-token');

var authRouter = require('./auth');
var surveyRouter = require('./survey');
var categoryRouter = require('./category');
var resultRouter = require('./result');
var userRouter = require('./user');

require('dotenv').config();

var router = express.Router();

// Token verfication middleware
router.use((req, res, next) => {
  const token = verify(req);
  if (token) {
    req.jwtUser = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
  }
  next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.use('/auth', authRouter);
router.use('/survey', surveyRouter);
router.use('/category', categoryRouter);
router.use('/result', resultRouter);
router.use('/user', userRouter);

module.exports = router;
