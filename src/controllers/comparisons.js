import userModel from '../models/users';
import applicationModel from '../models/application';
import comparisonModel from '../models/comparison';

export async function post(req, res, next) {
   if (req.jwt && req.jwt.user) {
     if (req.jwt.user.isEvaluator) {

       applicationModel.findOne({ _id: req.params.better }).exec( function(err, better) {
         if (err) return res.status(500).send('Error fetching better application');
         if (!better) return res.status(404).send('Better application not found');

         applicationModel.findOne({ _id: req.params.worse }).exec( function(err, worse) {
           if (err) return res.status(500).send('Error fetching worse application');
           if (!worse) return res.status(404).send('Worse application not found');

           const problemNumber = Number(req.params.problem);
           if (isNaN(problemNumber)) {
             return res.status(500).send('Invalid problem number');
           }

           const query = {
             evaluator: req.jwt.user._id,
             application_better: better._id,
             application_worse: worse._id,
             problem: problemNumber
           };

           let setter = { $set: { } };

           if (typeof req.body.comments === 'string') {
             setter.$set.comments = req.body.comments;
           }

           comparisonModel.findOneAndUpdate(query, setter, { upsert: true }, (err, oldComparison) => {
             if (err) return res.status(500).send('Error fetching comparison');
             return res.json({});
           });
         });
       });
     } else {
       res.status(403).send('Only evaluators may submit comparisons');
     }
   } else {
     res.status(401).send('Unauthenticated');
   }
}
