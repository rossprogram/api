import express from 'express';
import fileUpload from 'express-fileupload';
import rateLimit from 'express-rate-limit';
import * as userController from './controllers/users';
import * as applicationController from './controllers/applications';
import * as recommendationController from './controllers/recommendations';
import * as attachmentController from './controllers/attachments';
import * as paymentController from './controllers/payments';
import * as evaluationController from './controllers/evaluations';
import * as offerController from './controllers/offers';
import * as comparisonController from './controllers/comparisons';
import * as videoController from './controllers/video';
import identity from './middleware/identity';

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 250,
  message: 'Too many API requests from this IP; please try again after a few minutes.',
});
router.use(apiLimiter);

router.use(fileUpload());

const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 10, // start blocking after 10 requests
  message:
  'Too many accounts created from this IP; please try again later.',
});
router.post('/users/:user', createAccountLimiter, userController.post);

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

router.get('/applications/:year/',
  applicationController.getAll);
router.get('/applications/:year/:id',
  applicationController.getById);
router.get('/applications/:year/:id/attachments',
  applicationController.findById,
  attachmentController.get);
router.get('/applications/:year/:id/evaluations',
  applicationController.findById,
  evaluationController.get);
router.get('/applications/:year/:id/recommendations',
  applicationController.findById,
  recommendationController.getAll);
router.get('/applications/:year/:id/offer',
  applicationController.findById,
  offerController.get);

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

router.get('/users/:user/application/:year/evaluations',
  userController.findUser,
  applicationController.find,
  evaluationController.get);

router.get('/evaluators',
  evaluationController.getEvaluators);

router.get('/evaluators/:user/evaluations',
  userController.findUser,
  evaluationController.getByUser);

router.get('/attachments/:id',
  attachmentController.getById);

router.get('/recommendations/:id',
  recommendationController.getById);

router.get('/evaluations/:id',
  evaluationController.getById);

router.delete('/evaluations/:id',
  evaluationController.deleteById);

router.put('/users/:user/application/:year/evaluations',
  userController.findUser,
  applicationController.find,
  evaluationController.put);

router.get('/users/:user/application/:year/offer',
  userController.findUser,
  applicationController.find,
  offerController.get);

router.put('/users/:user/application/:year/offer',
  userController.findUser,
  applicationController.find,
  offerController.put);

router.delete('/offers/:id',
  offerController.deleteById);

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

router.post('/stripe',
  paymentController.stripeWebhook);

router.get('/users/:user/payments',
  userController.findUser,
  paymentController.getAll);

router.get('/users/:user/payments/:id',
  userController.findUser,
  paymentController.get);

router.post('/users/:user/payments/:amount',
  userController.findUser,
  paymentController.post);

router.post('/comparisons/problems/:problem/applications/:better/:worse',
  comparisonController.post);

router.post('/users/:user/application/:year/video/multipart/create',
  userController.findUser,
  applicationController.find,
  videoController.createMultipartUpload);
router.post('/users/:user/application/:year/video/multipart/part-url',
  userController.findUser,
  applicationController.find,
  videoController.getMultipartPartUrl);
router.post('/users/:user/application/:year/video/multipart/complete',
  userController.findUser,
  applicationController.find,
  videoController.completeMultipartUpload);
router.post('/users/:user/application/:year/video/multipart/abort',
  userController.findUser,
  applicationController.find,
  videoController.abortMultipartUpload);
router.get('/users/:user/application/:year/video',
  userController.findUser,
  applicationController.find,
  videoController.getVideo);

export default router;
