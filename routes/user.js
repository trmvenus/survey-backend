var express = require('express');
var {getUsersWithFilter, getCountOfUsers, updateUserPermission, activateUser} = require('../database/users');

var router = express.Router();

const getUsersProc = (req, res, next) => {
  const {pageSize, currentPage, orderBy, search} = req.query;
  
  getUsersWithFilter(+pageSize, +currentPage, orderBy, search)
    .then(users => {
      getCountOfUsers(search)
        .then(count => {
          res.json({
            data: users,
            totalItem: count,
            totalPage: (count-1)/pageSize+1,
          });
        })
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: 'users/get-users-error',
        message: "It couldn't get users.",
      })
    });
}

const updatePermissionProc = (req, res, next) => {
  const user_id = req.body.user;
  const method = req.body.method;

  if(['p_create', 'p_view', 'p_edit', 'p_copy', 'p_delete'].includes(method)) {
    updateUserPermission(user_id, method)
      .then(user => {
        res.json({});
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          code: 'users/permission-error',
          message: "It couldn't update user permission.",
        })
      });
  } else {
    res.status(500).json({
      code: 'users/wrong-permission',
      message: "It couldn't update user permission.",
    })
  }
}

const activateUserProc = (req, res, next) => {
  const user_id = req.params.id;

  activateUser(user_id)
    .then(user => {
      res.json({});
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: 'users/wrong-id',
        message: "It couldn't activate/deactivate user."
      })
    })
}

router.put('/permission', updatePermissionProc);
router.put('/:id/active', activateUserProc);
router.get('/', getUsersProc);

module.exports = router;
