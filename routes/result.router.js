var express = require('express');
var { getResultsBySurvey, getUncompletedResultBySurveyAndUser, postResult, updateResult, getResultById } = require('../database/results');

var router = express.Router();

const getResultListProc = (req, res, next) => {
  const survey_id = req.query.survey;

  getResultsBySurvey(survey_id)
    .then(results => {
      res.status(200).json(results);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "result/get-list-error",
        message: "It couldn't fetch all surveys.",
      });
    });
}

const getResultByIdProc = (req, res, next) => {
  const result_id = req.params.id;
  getResultById(result_id)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "result/get-result-error",
        message: "It couldn't get the result."
      });
    })
}

const getResultProc = (req, res, next) => {
  const survey_id = req.query.survey;
  const ip_address = req.query.ip;
  const user_id = req.jwtUser.id;

  getUncompletedResultBySurveyAndUser(survey_id, user_id)
    .then(result => {
      if (result !== null) {
        res.status(200).json(result);
      } else {
        postResult(survey_id, user_id, ip_address)
          .then(result => {
            res.status(200).json(result);
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              code: "result/post-error",
              message: "It couldn't get the result."
            });
          })
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "result/get-uncompleted-error",
        message: "It couldn't get the result."
      });
    })
}

const postResultProc = (req, res, next) => {
  const {survey_id, result, ip_address, time_spent} = req.body;

  postResult(survey_id, null, ip_address, result, time_spent, true)
    .then(result => {
      if (req.body.link_id) {

      } else {
        res.status(200).json(result);
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "result/post-error",
        message: "It couldn't post the result."
      });
    });
}

const updateResultProc = (req, res, next) => {
  const {id, result, ip_address, time_spent, completed} = req.body;

  updateResult(id, result, time_spent, ip_address, completed)
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "result/update-error",
        message: "It couldn't fetch all surveys.",
      });
    })
};

router.get('/list', getResultListProc);
router.get('/:id', getResultByIdProc);
router.get('/', getResultProc);
router.post('/', postResultProc);
router.put('/', updateResultProc);

module.exports = router;
