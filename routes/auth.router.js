var express = require('express');
var {signInWithEmailAndPassword, createUserWithEmailAndPassword} = require('../database/users');
var jwt = require('jsonwebtoken');

require('dotenv').config();

var router = express.Router();

router.get('/login', (req, res, next) => {
  const {email, password} = req.query;

  signInWithEmailAndPassword(email, password)
    .then (rows => {
      if (rows.length == 1) {
        var user = rows[0];

        const payload = {
          id: user.id,
          name: user.name,
        };

        // Sign token
        jwt.sign(
          payload,
          process.env.TOKEN_SECRET_KEY,
          {
            expiresIn: 31556926, // 1 year in seconds
          },
          (err, token) => {
            if (err) {
              console.log(err);
            } else {
              user.accessToken = 'Bearer ' + token;

              res.status(200).json({user});
            }
          }
        );
      } else {
        res.status(200).json({
          code: "auth/wrong-password",
          message: "The password is invalid or the user does not have a password.",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(200).json({
        code: "auth/login-error",
        message: "It couldn't login user with this credential.",
      });
    });
});

router.post('/signup', (req, res, next) => {
  const {name, email, password} = req.body;

  createUserWithEmailAndPassword(name, email, password)
    .then(result => {
      if (result.success == true) {
        var user = result.rows[0];

        const payload = {
          id: user.id,
          name: user.name,
        };

        // Sign token
        jwt.sign(
          payload,
          process.env.TOKEN_SECRET_KEY,
          {
            expiresIn: 31556926, // 1 year in seconds
          },
          (err, token) => {
            if (err) {
              console.log(err);
            } else {
              user.accessToken = 'Bearer ' + token;

              res.status(200).json({user});
            }
          }
        );
      } else {
        res.status(200).json({
          code: "auth/duplicated-email",
          message: "The same email exists.",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(200).json({
        code: "auth/create-user-error",
        message: "It couldn't create new user.",
      });
    });
});

module.exports = router;
