var express = require('express');
var { REPORT_TYPE } = require('../constants/surveyValue');
var {createReport, getReportsBySurvey} = require('../database/reports');

var router = express.Router();

const getReportsProc = (req, res, next) => {
  const {survey} = req.query;
  getReportsBySurvey(survey)
  .then(reports => {
    res.status(200).json(reports);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      code: "pillar/fetch-error",
      message: "It couldn't fetch all pillars.",
    });
  })
};

const addReportProc = (req, res, next) => {
  const { 
    name, 
    type, 
    conditionFilter, 
    conditionQuestion, 
    conditionOperator, 
    conditionOption,
    dateFilter,
    startDate,
    endDate,
    horizontalQuestion,
    verticalQuestion,
    openEndQuestion,
    pillar,
    survey,
  } = req.body;

  const user_id = req.jwtUser.id;

  const section = {
    id: 1,
    type: type,
    content: {},
  };

  switch(type) {
    case REPORT_TYPE.SUMMARY:
      section.content = {
        invisibles: [],
      };
      break;

    case REPORT_TYPE.CROSS_TAB:
      section.content = {
        horizontal: horizontalQuestion,
        vertical: verticalQuestion,
      };
      break;

    case REPORT_TYPE.OPEN_END:
      section.content = {
        openend: openEndQuestion,
      };
      break;

    case REPORT_TYPE.PILLAR:
      section.content = {
        invisibles: [],
        pillar: pillar,
      };
      break;
  }

  var sections = [section];

  var filter = {
    dateFilter: dateFilter,
    conditionFilter: conditionFilter,
  }

  if (dateFilter) {
    filter.startDate = startDate;
    filter.endDate = endDate;
  }
  if (conditionFilter) {
    filter.conditions = [{
      question: conditionQuestion,
      operator: conditionOperator,
      option: conditionOption,
    }]
  }

  filter = JSON.stringify(filter);
  sections = JSON.stringify(sections);

  createReport(name, survey, user_id, type, filter, sections)
    .then(report => {
      if (report) {
        res.status(200).json(report); 
      } else {
        res.status(500).json({
          code: "report/create-error",
          message: "It couldn't create new report.",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "report/create-error",
        message: "It couldn't create new report.",
      });
    });
};

router.get('/', getReportsProc);
router.post('/', addReportProc);

module.exports = router;
