var express = require('express');
const { setResultOnEmailContact } = require('../database/emaillinks_contacts');
var { 
  getResultsBySurvey, 
  getUncompletedResultBySurveyAndUser, 
  getResultItemByWebLinkAndName,
  postResult, 
  updateResult, 
  getResultById, 
  postManualResult,
  getIsMultiple,
  getResponseCount
} = require('../database/results');

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
  const user_id = req.jwtUser.id;

  const survey_id = req.query.survey;
  const ip_address = req.query.ip;
  const weblink_link_id = req.query.weblink_link;
  const name = req.query.name;

  if (!weblink_link_id) {
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
    });
  } else {
    getResultItemByWebLinkAndName(weblink_link_id, name, ip_address)
      .then(result => {
        if (result != null) {
          console.log("result-->>>",result)
          if(result.is_completed==true){
            getIsMultiple(survey_id,weblink_link_id)
            .then(weblink=>{
              console.log("weblink-->>",weblink)
              if(weblink?.is_multiple){
                console.log("weblink-->>>",weblink)
                if(weblink.close_quota){
                  getResponseCount(survey_id,weblink_link_id)
                  .then(count=>{
                    console.log("count----->>>>",count)
                    if(count==null||count<weblink.close_quota){
                      postResult(survey_id, null, ip_address, {}, 0, false, weblink_link_id, null, null, name)
                      .then(result => {
                        res.status(200).json(result);
                      })
                      .catch(err => {
                        console.log(err);
                        res.status(500).json({
                          code: "result/post-error",
                          message: "It couldn't get the result."
                        });
                      });
                    } else{
                      res.status(500).json({
                        success: false,
                        code: "survey/maxim-quota",
                        message: "Survey reseached the maximum number of respondants."
                      });
                    }
                  })
    
                }else{
                  postResult(survey_id, null, ip_address, {}, 0, false, weblink_link_id, null, null, name)
                  .then(result => {
                    res.status(200).json(result);
                  })
                  .catch(err => {
                    console.log(err);
                    res.status(500).json({
                      code: "result/post-error",
                      message: "It couldn't get the result."
                    });
                  });
                }
                
              }else{
                res.status(200).json(result);
              }
            })
            
          } else{
            res.status(200).json(result);
          }
        } else {
          console.log("--------------------------------")
          postResult(survey_id, null, ip_address, {}, 0, false, weblink_link_id, null, null, name)
            .then(result => {
              res.status(200).json(result);
            })
            .catch(err => {
              console.log(err);
              res.status(500).json({
                code: "result/post-error",
                message: "It couldn't get the result."
              });
            });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          code: "result/get-result-by-weblink-and-name-error",
          message: "It couldn't get the result."
        });
      });
  }
  
}

// For only weblink/emaillink
const postResultProc = (req, res, next) => {
  const {survey_id, result, ip_address, time_spent, weblink_link_id, emaillink_link_id, emaillink_contact_id, is_completed} = req.body;

  postResult(survey_id, null, ip_address, result, time_spent, is_completed, weblink_link_id, emaillink_link_id, emaillink_contact_id)
    .then(result => {
      if (emaillink_link_id) {
        setResultOnEmailContact(emaillink_contact_id, result.id)
          .then(emaillink_contact => {
            res.status(200).json(result);
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              code: "result/post-error",
              message: "It couldn't post the result."
            });
          })
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

// For only manual data entry
const postManualResultProc = (req, res, next) => {
  const {result, survey_id, time_spent, ip_address, respondent_name}  = req.body;

  postManualResult(result, survey_id, time_spent, ip_address, respondent_name)
    .then(result => {
      res.json(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "result/post-manual-error",
        message: "It couldn't post the manual result."
      });
    })
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
router.post('/manual', postManualResultProc);
router.get('/:id', getResultByIdProc);
router.get('/', getResultProc);
router.post('/', postResultProc);
router.put('/', updateResultProc);

module.exports = router;
