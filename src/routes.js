import express from 'express';
import fileUpload from 'express-fileupload';
import * as userController from './controllers/users';
import * as applicationController from './controllers/applications';
import * as recommendationController from './controllers/recommendations';
import * as attachmentController from './controllers/attachments';
import identity from './middleware/identity';

const router = express.Router();

router.use(fileUpload());

router.post('/users/:user', userController.post);

// ## GET /users/:user/authorize
//
// Log in as the given user.  Password is sent in the `Authorization:
// Basic` header.  Responds by setting a cookie containing a JWT.
router.get('/users/:user/authorize', userController.findUser, userController.authorize);

router.use(identity);

router.get('/users/:user', userController.findUser, userController.get);

router.put('/users/:user', userController.findUser, userController.put);
router.patch('/users/:user', userController.findUser, userController.put);

router.get('/users/:user/application/:year', userController.findUser, applicationController.get);
router.put('/users/:user/application/:year', userController.findUser, applicationController.put);

router.post('/users/:user/application/:year/recommendations/:recommender',
  userController.findUser,
  applicationController.find,
  recommendationController.post);

router.get('/users/:user/application/:year/recommendations',
  userController.findUser,
  applicationController.find,
  recommendationController.getAll);

router.post('/users/:user/application/:year/attachments',
  userController.findUser,
  applicationController.find,
  attachmentController.post);

router.post('/users/:user/application/:year/attachments/:label',
  userController.findUser,
  applicationController.find,
  attachmentController.post);

router.get('/users/:user/application/:year/attachments',
  userController.findUser,
  applicationController.find,
  attachmentController.get);

router.get('/attachments/:id',
  attachmentController.getById);

router.delete('/users/:user/application/:year/attachments/:id',
  userController.findUser,
  applicationController.find,
  attachmentController.remove);

/*
router.get('/users/:user/application/:year/recommendations/:id',
  userController.findUser,
  applicationController.find,
  recommendationController.getLetter);
*/

/*
router.get('/recommendations/:id:/password',
  recommendationController.get);
router.put('/recommendations/:id/:password',
  recommendationController.put);
*/

export default router;
