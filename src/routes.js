import express from 'express';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import * as userController from './controllers/users';
import * as applicationController from './controllers/applications';
import * as recommendationController from './controllers/recommendations';
import * as attachmentController from './controllers/attachments';
import identity from './middleware/identity';


const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 250,
  message: 'Too many API requests from this IP; please try again after a few minutes.',
});
router.use(apiLimiter);

router.use(fileUpload());

// const createAccountLimiter = rateLimit({
//  windowMs: 15 * 60 * 1000, // 15 minute window
//  max: 10, // start blocking after 10 requests
//  message:
//    'Too many accounts created from this IP; please try again later.',
// });
router.post('/users/:user', apiLimiter, userController.post);

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

const recommendationLetterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // start blocking after 5 requests
  message:
    'Too many recommendation letters requested from this IP; please try again after an hour.',
});

router.post('/users/:user/application/:year/recommendations/:recommender',
  recommendationLetterLimiter,
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

router.get('/recommendations/:id/:password',
  recommendationController.get);
router.put('/recommendations/:id/:password',
  recommendationController.put);

export default router;
