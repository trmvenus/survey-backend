const express = require('express');
const jwt = require('jsonwebtoken');

const {
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  getUserByEmail
} = require('../database/users');
const forgotPasswordEmail = require('../mail-template/forgot-password');
const crypt = require('../core/encryption');
const { sendMail } = require('../core/mailer');

require('dotenv').config();

var router = express.Router();

const loginUserProc = (req, res, next) => {
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
}

const registerUserProc = (req, res, next) => {
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
};

const forgotPasswordProc = (req, res, next) => {
  const {email} = req.body;

  getUserByEmail(email)
  .then(async user => {
    if (user) {
      const resetPasswordLink = process.env.FRONTEND_URL + `/user/reset-password?token=` + crypt.encrypt(user.email_address);

      var mailOptions = {
        from: 'SurveyWizardSite <noreply@surveywizardsite.com>',
        to: email_address,
        subject: 'Survey Link',
        html: forgotPasswordEmail(user.name, resetPasswordLink)
      };

      await sendMail(mailOptions);

      res.status(200).json(true);
    } else {
      res.status(401).json({
        code: "auth/not-found-email",
        message: "Your email is not registered."
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(401).json({
      code: "auth/get-user-error",
      message: "Your email is not registered."
    });
  })
}

router.get('/login', loginUserProc);
router.post('/signup', registerUserProc);
router.post('/forgotpassword', forgotPasswordProc);

module.exports = router;
