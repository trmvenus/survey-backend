const express = require('express');
const multiparty = require('multiparty');
const fs = require('fs');
const xlsx = require('node-xlsx');
const { sendMail } = require('../core/mailer');

const { 
  getEmailLinksBySurvey, 
  getEmailLinkById, 
  createEmailLink, 
  updateEmailLink, 
  deleteEmailLink, 
  setSendingFlag, 
} = require('../database/emaillinks');
const { defaultContactsFilePath } = require('../constants/defaultValues');
const { createEmailLinkContacts, getEmailLinkContactsByLinkId } = require('../database/emaillinks_contacts');

var router = express.Router();

const getEmailLinksProc = (req, res, next) => {
  const {survey} = req.query;
  getEmailLinksBySurvey(survey)
  .then(emailLinks => {
    res.status(200).json(emailLinks);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      code: "emaillink/fetch-error",
      message: "It couldn't fetch all emaillinks.",
    });
  })
};

const getEmailLinkProc = (req, res, next) => {
  const id = req.params.id;

  getEmailLinkById(id)
    .then(emailLink => {
      if (emailLink) {
        getEmailLinkContactsByLinkId(emailLink.link_id)
          .then(contacts => {
            res.json({
              ...emailLink,
              contacts,
            });
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              code: "emaillink_contacts/get-contacts",
              message: "It couldn't get the link by id.",
            });
          })
      } else {
        res.status(500).json({
          code: "emaillink/not-found",
          message: "It couldn't get the link by id.",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "emaillink/fetch-error",
        message: "It couldn't get the link by id.",
      });
    })
}

const addEmailLinkProc = (req, res, next) => {
  const user_id = req.jwtUser.id;

  var options = {
    autoFiles: true,
    uploadDir: defaultContactsFilePath,
  }

  const form = new multiparty.Form(options);
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        code: "emaillink/parse-error",
        message: "It couldn't create new email link.",
      });
    } else {
      const file = files.file[0];
      const name = file.originalFilename;
      const ext = name.substr((name.lastIndexOf('.') +1));
      const newname = 'contacts_' + (Date.now().toString()) + '.' + ext;
      const newpath = defaultContactsFilePath + '/' + newname;
  
      fs.rename(file.path, newpath, (err) => {
        if (err) {
          console.log(err);
          res.status(500).json({
            code: "emaillink/fs-rename-error",
            message: "It couldn't create new email link.",
          });
        } else {
          const worksheets = xlsx.parse(newpath);
          const rows = worksheets[0].data;
          const firstRow = rows[0];

          if (!(firstRow[0] == "Email Address" && firstRow[1] == "First Name" && firstRow[2] == "Last Name")) {
            res.status(500).send({
              code: "emaillink/not-found-email-link",
              message: "It couldn't parse the contact file because this has the wrong format.",
            });
          } else {
            let { 
              name,
              survey_id,
              link_id,
              email_content,
              sender_name,
              sender_email,
              close_quota,
              close_date,
            } = JSON.parse(fields.item[0]);

            const contactRows = [];
            for (let i = 1; i < rows.length; i ++) {
              contactRows.push([link_id, rows[i][0], rows[i][1], rows[i][2]]);
            }
            close_quota = close_quota ? close_quota : null;
            close_date = close_date.length ? close_date : null;

            createEmailLinkContacts(contactRows)
              .then(result => {
                createEmailLink(name, survey_id, user_id, link_id, email_content, sender_name, sender_email, close_quota, close_date, newname)
                  .then(emailLink => {
                    if (emailLink) {
                      res.status(200).json(emailLink); 
                    } else {
                      res.status(500).json({
                        code: "emaillink/create-error",
                        message: "It couldn't create new email link.",
                      });
                    }
                  })
                  .catch(err => {
                    console.log(err);
                    res.status(500).json({
                      code: "emaillink/create-error",
                      message: "It couldn't create new email link.",
                    });
                  });
              })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                  code: "emaillink-contacts/create-error",
                  message: "It couldn't create new email link.",
                });
              });
          }
        }
      });
    }
  });
};

const updateEmailLinkProc = (req, res, next) => {
  const emaillink_id = req.params.id;
  let { 
    name,
    email_content,
    sender_name,
    sender_email,
    close_quota,
    close_date,
  } = req.body;

  close_quota = close_quota.length ? close_quota : null;
  close_date = close_date.length ? close_date : null;

  updateEmailLink(emaillink_id, name, email_content, sender_name, sender_email, close_quota, close_date)
  .then (emailLink => {
    if (emailLink) {
      res.status(200).json(emailLink); 
    } else {
      res.status(500).json({
        code: "emaillink/update-filter-error",
        message: "It couldn't find the email link.",
      });
    }
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      code: "emaillink/update-filter-error",
      message: "It couldn't update the email link.",
    });
  });
}

const deleteEmailLinkProc = (req, res, next) => {
  const emailLink_id = req.params.id;

  deleteEmailLink(emailLink_id)
    .then(result => {
      if (result) {
        res.json({id: emailLink_id});
      } else {  
        res.status(500).send({
          code: "emaillink/not-found-id",
          message: "It couldn't delete the email link.",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({
        code: "emaillink/delete-error",
        message: "It couldn't delete the email link.",
      });
    })
};

const sendEmailProc = (req, res, next) => {
  var link_id = req.params.id;

  getEmailLinkById(link_id)
    .then(async (link) => {
      if (link) {
        const worksheets = xlsx.parse(defaultContactsFilePath + '/' + link.contacts_file);
        const rows = worksheets[0].data;
        const firstRow = rows[0];

        if (!(firstRow[0] == "Email Address" && firstRow[1] == "First Name" && firstRow[2] == "Last Name")) {
          res.status(500).send({
            code: "emaillink/not-found-email-link",
            message: "The email cannot be sent because the contact file is in the wrong format.",
          });
        } else {
          for (let i = 1; i < rows.length; i ++) {
            const email_address = rows[i][0];
            const first_name = rows[i][1];

            link.email_content = link.email_content.replace("{EmailAddress}", link.sender_email);
            link.email_content = link.email_content.replace("{FirstName}", first_name);

            var mailOptions = {
              from: 'SurveyWizardSite <noreply@surveywizardsite.com>',
              to: email_address,
              subject: 'Survey Link From SurveyWizardSite',
              html: link.email_content
            };

            await sendMail(mailOptions);
          }

          setSendingFlag(link_id, true)
            .then(result => {
              if (result) {
                res.status(200).json({
                  success: true,
                  id: result.id,
                });
              } else {
                res.status(500).send({
                  code: "emaillink/update-sending-flag-error",
                  message: "The email cannot be sent.",
                });
              }
            })
            .catch(err => {
              console.log(err);
              res.status(500).send({
                code: "emaillink/not-found-email-link",
                message: "The email cannot be sent.",
              });
            });
        }
      } else {
        res.status(500).send({
          code: "emaillink/not-found-email-link",
          message: "The email cannot be sent.",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send({
        code: "emaillink/get-email-link-error",
        message: "The email cannot be sent.",
      });
    })
}

router.get('/:id/send', sendEmailProc);
router.get('/:id', getEmailLinkProc);
router.put('/:id', updateEmailLinkProc);
router.delete('/:id', deleteEmailLinkProc);
router.get('/', getEmailLinksProc);
router.post('/', addEmailLinkProc);

module.exports = router;
