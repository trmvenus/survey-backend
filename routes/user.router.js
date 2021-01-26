var express = require('express');
var {
  getUsersWithFilter, 
  getCountOfUsers, 
  updateUserPermission, 
  updateUserOrganization,
  activateUser, 
  createUserWithEmailAndPassword, 
  deleteUsers,
} = require('../database/users');

var router = express.Router();

const getUsersProc = (req, res, next) => {
  const {pageSize, currentPage, orderBy, search} = req.query;
  
  getUsersWithFilter(+pageSize, +currentPage, orderBy, search)
    .then(users => {
      getCountOfUsers(search)
        .then(count => {
          res.json({
            data: users,
            totalCount: count,
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

const addUserProc = (req, res, next) => {
  const {name, email, password, role} = req.body;

  createUserWithEmailAndPassword(name, email, password, role)
    .then(result => {
      if (result.success == true) {
        var user = result.rows[0];
        res.status(200).json(user);
      } else {
        res.status(500).json({
          code: "users/duplicated-email",
          message: "The same email exists.",
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        code: "users/create-user-error",
        message: "It couldn't create new user.",
      });
    });
}

const deleteUsersProc = (req, res, next) => {
  const ids = req.body.ids;

  if (ids.length == 0) {
    res.status(200).json([]);
  } else {
    deleteUsers(ids)
      .then(deletedUsers => {
        res.status(200).json(deletedUsers)
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          code: "users/delete-error",
          message: "It couldn't delete users.",
        });
      });
  }
}

const changeOrganizationProc = (req, res, next) => {
  const user_id = req.params.id;
  const {organization_id} = req.body;

  updateUserOrganization(user_id, organization_id)
    .then(user => {
      if (user) {
        res.json(user);
      } else {
        console.log(err);
        res.status(500).json({
          code: "users/change-organization-error",
          message: "It couldn't change the organization.",
        });
      }
    })
}

router.put('/permission', updatePermissionProc);
router.put('/:id/active', activateUserProc);
router.put('/:id/organization', changeOrganizationProc);
router.get('/', getUsersProc);
router.post('/', addUserProc);
router.delete('/', deleteUsersProc);

module.exports = router;
