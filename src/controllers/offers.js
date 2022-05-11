import userModel from '../models/users';
import applicationModel from '../models/application';
import offerModel from '../models/offer';

export async function put(req, res, next) {
  if (req.jwt && req.jwt.user && req.application) {
    const query = {
      application: req.application._id,
    };

    let setter = { $set: { } };

    let isApplicant = false;

    if (typeof req.body.decision === 'string') {
      isApplicant = true;
      setter.$set.decision = req.body.decision;
    }
    
    if (typeof req.body.timezone === 'string') {
      isApplicant = true;
      setter.$set.timezone = req.body.timezone;
    }

    if (typeof req.body.travelMethod === 'string') {
      isApplicant = true;
      setter.$set.travelMethod = req.body.travelMethod;
    }
    if (typeof req.body.arrivalDate === 'string') {
      isApplicant = true;
      setter.$set.arrivalDate = req.body.arrivalDate;
    }
    if (typeof req.body.arrivalTime === 'string') {
      isApplicant = true;
      setter.$set.arrivalTime = req.body.arrivalTime;
    }
    if (typeof req.body.flightCarrier === 'string') {
      isApplicant = true;
      setter.$set.flightCarrier = req.body.flightCarrier;
    }
    if (typeof req.body.flightNumber === 'string') {
      isApplicant = true;
      setter.$set.flightNumber = req.body.flightNumber;
    }

    if (typeof req.body.timezoneOffset === 'number') {
      isApplicant = true;
      setter.$set.timezoneOffset = req.body.timezoneOffset;
    }

    if (typeof req.body.summerLocation === 'string') {
      isApplicant = true;
      setter.$set.summerLocation = req.body.summerLocation;
    }

    if (req.body.possibleUsernames) {
      isApplicant = true;
      setter.$set.possibleUsernames = req.body.possibleUsernames;
    }

    if (req.body.goodTimes) {
      isApplicant = true;
      setter.$set.goodTimes = req.body.goodTimes;
    }        
    
    if (isApplicant) {
      if (typeof req.body.decisionDate === 'string') {
        setter.$set.decisionDate = req.body.decisionDate;
      }
      
      if (req.application.user.equals(req.jwt.user._id)) {
        offerModel.findOneAndUpdate(query, setter, (err, oldOffer) => {
          if (err) return res.status(500).send('Error fetching offer');
          offerModel.findOne(query).exec( function(err, offer) {
            if (err) return res.status(500).send('Error fetching evaluator');
            if (offer) { delete offer.evaluator; }
            return res.json(offer.toJSON());
          });
        });
      } else {
        res.status(403).send('Only the applicant may respond to an offer');            
      }
    } else {
      if (req.jwt.user.isSuperuser) {
        setter.$set.evaluator = req.jwt.user._id;
        
        if (typeof req.body.offer === 'string') {
          setter.$set.offer = req.body.offer;
        }

        if (typeof req.body.location === 'string') {
          setter.$set.location = req.body.location;
        }        
        
        offerModel.findOneAndUpdate(query, setter, { upsert: true }, (err, oldOffer) => {
          if (err) return res.status(500).send('Error fetching offer');
          offerModel.findOne(query).populate('evaluator').exec( function(err, offer) {
            if (err) return res.status(500).send('Error fetching evaluator');          
            return res.json(offer.toJSON());
          });
        });
      } else {
        res.status(403).send('Only superusers may provide offers');
      }
    }
  } else {
    res.status(401).send('Unauthenticated');            
  }
}   

export async function get(req, res, next) {
  if (req.jwt && req.jwt.user && req.application) {
    const query = {
      application: req.application._id,
    };

    offerModel.findOne(query).populate('evaluator').exec( function(err, offer) {
      if (err)
        res.status(500).send('Error fetching evaluator');
      else {
        if (req.application.user.equals(req.jwt.user._id)) {
          if (offer) {
            delete offer.evaluator;
            res.json(offer.toJSON());
          } else {
            res.json( {} );
          }
        } else {
          if (req.jwt.user.isSuperuser) {
            if (offer)
              res.json(offer.toJSON());
            else
              res.json({});
          } else 
            res.status(403).send('Only the applicant or a superuser may view an offer');
        }
      }
    });
  } else {
    res.status(401).send('Unauthenticated');
  }
}   

export function deleteById(req, res, next) {
  offerModel.findById(req.params.id).populate('evaluator').exec((err, offer) => {
    if (err)
      res.status(500).send('Error fetching offer data');
    else {
      if (req.jwt && req.jwt.user) {
        if (req.jwt.user.isSuperuser) {
          offerModel.deleteOne({_id: req.params.id }, (err) => {
            if (err)
              res.status(500).send('Error removing offer');
            else
              res.status(200).send();
          });
        } else {
          res.status(403).send('Only superusers are permitted to delete offers');              
        }
      } else {
        res.status(401).send('Unauthenticated');            
      }
    }
  });
}
