var express = require('express');
var {createCategory, getMyCategories} = require('../database/categories');

var router = express.Router();

router.get('/', (req, res, next) => {
  const user_id = req.jwtUser.id;

  getMyCategories(user_id)
  .then(categories => {
    res.status(200).json(categories);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      code: "category/fetch-error",
      message: "It couldn't fetch all categories.",
    });
  })
});

router.post('/', (req, res, next) => {
  const {name} = req.body;
  const user_id = req.jwtUser.id;

  createCategory(name, user_id)
    .then(category => {
      if (category) {
        res.status(200).json(category); 
      } else {
        res.status(200).json({
          code: "category/create-error",
          message: "It couldn't create new category.",
        });
      }
    })
    .catch(e => {
      res.status(200).json({
        code: "category/create-error",
        message: "It couldn't create new category.",
      });
    });
});

module.exports = router;
