import userModel from '../models/users';
import applicationModel from '../models/application';

function redactApplication(user, application) {
  if (user.isEvaluator && !user.isSuperuser) {
    application.firstName = '█████';
    application.lastName = '█████';
    application.nickname = '█████';
    application.gender = '█████';
    application.citizenship = ['██'];
    application.parentName = '█████ █████';

    application.parentEmail = '█████@█████.███';

    application.phone = '██████████';
    application.parentPhone = '██████████';
    application.address = '██████████';
    application.parentAddress = '██████████';
    application.schoolName = '██████████';
    application.schoolAddress = '██████████';
  }

  return application;
}

export function find(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView(req.user)) {
        const query = {
          user: req.user._id,
          year: req.params.year,
        };

        applicationModel.findOne(query).exec((err, application) => {
          if (err) return res.status(500).send('Error fetching application');
          if (application) {
            req.application = application;
            redactApplication(req.jwt.user, req.application);
            next();
          } else {
            applicationModel.findOneAndUpdate(query, { }, { upsert: true, new: true }, (err, application) => {
              if (err) return res.status(500).send('Error fetching application');
              if (application) {
                req.application = application;
                redactApplication(req.jwt.user, req.application);
              }
              next();
            });
          }
        });
      } else {
        res.status(403).send('Not permitted to view application');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function findById(req, res, next) {
  if (req.jwt && req.jwt.user) {
    const query = {
      _id: req.params.id,
      year: req.params.year,
    };

    applicationModel.findOne(query, { }, { upsert: true, new: true })
      .populate('user')
      .exec((err, application) => {
        if (err) return res.status(500).send('Error fetching application');
        if (application) {
          if (req.jwt.user.canViewApplication(application)) {
            req.application = application;
            redactApplication(req.jwt.user, req.application);
            next();
          } else {
            res.status(403).send('Not permitted to view application');
          }
        } else {
          res.status(404).send('No application found');
        }
      });
  } else {
    res.status(401).send('Unauthenticated');
  }
}

export function get(req, res, next) {
  find(req, res, () => {
    if (req.application) res.json(req.application.toJSON());
    else res.json({});
  });
}

export function getById(req, res, next) {
  findById(req, res, () => {
    if (req.application) res.json(req.application.toJSON());
    else res.json({});
  });
}

export function getAll(req, res, next) {
  if (req.jwt && req.jwt.user) {
    if (req.jwt.user.isEvaluator) {
      const query = {
        year: req.params.year,
      };

      applicationModel
        .find(query, 'updatedAt firstName nickname submitted submittedAt lastName citizenship gender birthday juniorCounselor')
        .populate('evaluationCount')
        .exec((err, applications) => {
          if (err) return res.status(500).send('Error fetching applications');
          res.json(applications.map((application) => redactApplication(req.jwt.user, application).toJSON()));
        });
    } else {
      res.status(403).send('Not permitted to view applications');
    }
  } else {
    res.status(401).send('Unauthenticated');
  }
}

export function put(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canEdit(req.user)) {
        const query = {
          user: req.user._id,
          year: req.params.year,
        };
        applicationModel.findOne(query, (err, oldApplication) => {
          if (err) return res.status(500).send('Error finding application');

          if (oldApplication) {
            if (oldApplication.submitted && req.body.submitted !== false) {
              return res.status(403).send('Not permitted to update an already submitted application.  Withdraw your application first.');
            }
          }

          const setter = {
            $set: {
            },
          };

          const fields = applicationModel.schema.eachPath((p) => {
            if (p !== 'submitted' && p !== 'submittedAt') {
              if (p.match(/^[A-z]/)) {
                if (req.body[p] !== undefined) setter.$set[p] = req.body[p];
              }
            }
          });

          if (req.body.submitted !== undefined) {
            setter.$set.submitted = req.body.submitted;
            if (req.body.submitted === true) {
              setter.$set.submittedAt = Date.now();
            }
          }

          applicationModel.findOneAndUpdate(query, setter,
            { upsert: true, new: true }, (err, application) => {
              if (err) return res.status(500).send('Error saving application');
              return res.json(application.toJSON());
            });
        });
      } else {
        res.status(403).send('Not permitted to update application');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}
