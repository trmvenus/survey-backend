var express = require('express');
var {createSurvey, getMySurveys, getSurveyById, updateSurvey, deleteSurveys, copySurveys, shareSurvey} = require('../database/surveys');
var {copyResultsBySurvey, getResultDatesBySurvey} = require('../database/results');

var router = express.Router();

const getSurveyListProc = (req, res, next) => {
  const user_id = req.jwtUser.id;

  getMySurveys(user_id)
    .then(surveys => {
      res.status(200).json(surveys);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "survey/fetch-my-list-error",
        message: "It couldn't fetch all surveys.",
      });
    })
};

const addSurveyProc = (req, res, next) => {
  var {title, category} = req.body;
  const user_id = req.jwtUser.id;

  if (!category.length) category = null;

  createSurvey(title, user_id, category)
    .then(survey => {
      if (survey) { 
        survey.responses = 0;
        res.status(200).json(survey); 
      } else {
        res.status(500).json({
          code: "survey/create-error",
          message: "It couldn't create new survey.",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "survey/create-error",
        message: "It couldn't create new survey.",
      });
    });
};

const deleteSurveysProc = (req, res, next) => {
  const surveys_ids = req.body.ids;

  if (surveys_ids.length == 0) {
    res.status(200).json({ids: []});
  } else {
    deleteSurveys(surveys_ids)
      .then(() => {
        res.status(200).json({ids: surveys_ids})
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          code: "survey/delete-error",
          message: "It couldn't delete surveys.",
        });
      });
  }
}

const getSurveyProc = (req, res, next) => {
  const survey_id = req.params.id;

  getSurveyById(survey_id)
    .then(survey => {
      if (survey.is_deleted) {
        res.status(500).json({
          code: "survey/get-deleted-survey",
          message: "This survey was deleted.",
        });
      } else {
        getResultDatesBySurvey(survey_id)
          .then(results => {
            survey.results = results;
            res.status(200).json(survey);
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              code: "result/get-listerror",
              message: "It couldn't fetch the survey.",
            });
          })
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "survey/fetch-error",
        message: "It couldn't fetch the survey.",
      });
    });
};

const getSurveyByShareProc = (req, res, next) => {
  const share_id = req.query.id;

  
}

const updateSurveyProc = (req, res, next) => {
  const survey_id = req.params.id;
  const {json} = req.body;

  updateSurvey(survey_id, json)
    .then(survey => {
      if (survey.is_deleted) {
        res.status(500).json({
          code: "survey/get-deleted-survey",
          message: "This survey was deleted.",
        });
      } else {
        res.status(200).json(survey);
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "survey/fetch-error",
        message: "It couldn't fetch the survey.",
      });
    });
};

const copySurveysProc = (req, res, next) => {
  const surveys_ids = req.body.ids;
  const with_responses = req.body.with;
  const user_id = req.jwtUser.id;

  surveys_ids.sort();

  if (surveys_ids.length == 0) {
    res.status(200).json([]);
  } else {
    copySurveys(user_id, surveys_ids)
      .then(async (surveys) => {
        surveys.forEach(survey => {
          survey.responses = 0
        });

        if (with_responses === true) {
          for (let i = 0; i < surveys_ids.length; i ++) {
            const survey_id = surveys_ids[i];
            await copyResultsBySurvey(survey_id, surveys[i].id)
              .then((results) => {
                surveys[i].responses = results.length
              })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                  code: "survey/copy-results-error",
                  message: "It couldn't copy surveys.",
                });
              });
          }
          res.status(200).json(surveys.reverse())
        } else {
          res.status(200).json(surveys.reverse())
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          code: "survey/copy-error",
          message: "It couldn't copy surveys.",
        });
      });
  }
}

const shareSurveyProc = (req, res, next) => {
  const survey_id = req.params.id;
  shareSurvey(survey_id)
    .then(survey => {
      res.status(200).json(survey);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "survey/wrong-survey-id",
        message: "It couldn't share/unshare survey."
      })
    })
}

router.post('/copy', copySurveysProc);
router.get('/share', getSurveyByShareProc);
router.get('/:id/share', shareSurveyProc);
router.get('/:id', getSurveyProc);
router.put('/:id', updateSurveyProc);
router.get('/', getSurveyListProc);
router.post('/', addSurveyProc);
router.delete('/', deleteSurveysProc);


module.exports = router;
