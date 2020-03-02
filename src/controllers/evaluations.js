import userModel from '../models/users';
import applicationModel from '../models/application';
import evaluationModel from '../models/evaluation';

export function getById(req, res, next) {
  evaluationModel.findById(req.params.id).populate('evaluator').exec((err, evaluation) => {
    if (err)
      res.status(500).send('Error fetching evaluation data');
    else {
      if (req.jwt && req.jwt.user) {
        if (req.jwt.user.canViewEvaluation(evaluation)) {
          res.send(evaluation.toJSON());
        } else {
          res.status(403).send('Not permitted to view evaluation');              
        }
      } else {
        res.status(401).send('Unauthenticated');            
      }
    }
  });
}

export function deleteById(req, res, next) {
  evaluationModel.findById(req.params.id).populate('evaluator').exec((err, evaluation) => {
    if (err)
      res.status(500).send('Error fetching evaluation data');
    else {
      if (req.jwt && req.jwt.user) {
        if (req.jwt.user.canViewEvaluation(evaluation)) {
          evaluationModel.deleteOne({_id: req.params.id }, (err) => {
            if (err)
              res.status(500).send('Error removing evaluation');
            else
              res.status(200).send(evaluation.toJSON());
          });
        } else {
          res.status(403).send('Not permitted to delete the evaluation');              
        }
      } else {
        res.status(401).send('Unauthenticated');            
      }
    }
  });
}

export function get(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.application) {
      const query = {
        application: req.application._id,
      };
      
      evaluationModel.find(query).populate('evaluator').exec((err, evaluations) => {
        if (err)
          res.status(500).send('Error fetching evaluations');
        else {
          res.json( evaluations
                    .filter( (evaluation) => req.jwt.user.canViewEvaluation(evaluation) )
                    .map( (evaluation) => evaluation.toJSON() ) );
        }
      });
    } else {
      res.json( [] );
    }
  } else {
    res.status(401).send('Unauthenticated');            
  }
}

export function getByUser(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.isEvaluator) {
      const query = {
        evaluator: req.jwt.user._id
      };
      
      evaluationModel.find(query).exec((err, evaluations) => {
        if (err)
          res.status(500).send('Error fetching evaluations');
        else {
          res.json( evaluations
                    .filter( (evaluation) => req.jwt.user.canViewEvaluation(evaluation) )
                    .map( (evaluation) => evaluation.toJSON() ) );
        }
      });
    } else {
      res.status(403).send('Only evaluators may see evaluations');            
    }
  } else {
    res.status(401).send('Unauthenticated');            
  }
}

export async function put(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.isEvaluator) {
      const query = {
        application: req.application._id,
        evaluator: req.jwt.user._id
      };
      
      let setter = { $set: { } };
      
      if (typeof req.body.comments === 'string') {
        setter.$set.comments = req.body.comments;
      }

      if (typeof req.body.decision === 'string') {
        setter.$set.decision = req.body.decision;
      }      
      
      if (typeof req.body.overallScore === 'number') {
        setter.$set.overallScore = req.body.overallScore;
      }
      
      if (req.body.problemScores) {
        setter.$set.problemScores = req.body.problemScores;
      }
      
      evaluationModel.findOneAndUpdate(query, setter, { upsert: true }, (err, oldEvaluation) => {
        if (err) return res.status(500).send('Error fetching evaluation');
        evaluationModel.findOne(query).populate('evaluator').exec( function(err, evaluation) {
          if (err) return res.status(500).send('Error fetching evaluator');          
          return res.json(evaluation.toJSON());
        });
      });
    } else {
      res.status(403).send('Only evaluators may submit evaluations');            
    }
  } else {
    res.status(401).send('Unauthenticated');            
  }
}
