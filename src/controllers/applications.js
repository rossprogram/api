import crypto from 'crypto';
import userModel from '../models/users';
import applicationModel from '../models/application';

const prepositions = ['aboard', 'about', 'above', 'across', 'after', 'against', 'along', 'alongside', 'amid', 'around', 'as', 'at', 'before', 'behind', 'below', 'beneath', 'beside', 'besides', 'between', 'beyond', 'by', 'despite', 'down', 'during', 'except', 'from', 'into', 'less', 'like', 'near', 'nearer', 'of', 'off', 'on', 'onto', 'opposite', 'outside', 'over', 'past', 'through', 'throughout', 'to', 'toward', 'towards', 'under', 'underneath', 'unlike', 'until', 'up', 'upon', 'upside', 'versus', 'via', 'with', 'within', 'without', 'according to', 'adjacent to', 'ahead of', 'apart from', 'as for', 'as of', 'as per', 'as regards', 'aside from', 'back to', 'because of', 'close to', 'due to', 'except for', 'far from', 'inside of', 'instead of', 'left of', 'near to', 'next to', 'opposite of', 'opposite to', 'out from', 'out of', 'outside of', 'owing to', 'prior to', 'pursuant to', 'rather than', 'regardless of', 'right of', 'subsequent to', 'such as', 'thanks to', 'up to', 'as far as', 'as opposed to', 'as soon as', 'as well as'];

const adjectives = ['quick', 'gray', 'red', 'orange', 'green', 'blue', 'purple', 'magenta', 'maroon', 'navy', 'silver', 'gold', 'lime', 'teal', 'violet', 'bright', 'tall', 'short', 'dark', 'cloudy', 'summer', 'winter', 'spring', 'fall', 'autumn', 'windy', 'noisy', 'loud', 'quiet', 'heavy', 'light', 'strong', 'powerful', 'wonderful', 'amazing', 'super', 'sour', 'bitter', 'beautiful', 'good', 'bad', 'great', 'important', 'useful', 'free', 'fine', 'sad', 'proud', 'lonely', 'frowning', 'comfortable', 'happy', 'clever', 'interesting', 'famous', 'exciting', 'funny', 'kind', 'polite', 'fair', 'careful', 'rainy', 'humid', 'arid', 'frigid', 'foggy', 'windy', 'stormy', 'breezy', 'windless', 'calm', 'still'];

const nouns = ['mountain', 'tree', 'lake', 'water', 'river', 'ocean', 'sea', 'gulf', 'bay', 'town', 'city', 'village', 'house', 'bird', 'fish', 'cat', 'flower', 'butterfly', 'owl', 'book', 'hummingbird', 'eyes', 'building', 'home', 'raft', 'number', 'expression', 'equation', 'manifold', 'group', 'ring', 'set', 'prime', 'square', 'hexagon', 'cube', 'quadrilateral', 'rectangle', 'rhombus', 'parallelogram', 'trapezoid', 'tetrahedron', 'octahedron', 'circle', 'sphere', 'dodecahedron', 'icosahedron', 'disk', 'line', 'angle', 'chord', 'arc', 'approximation', 'function', 'formula', 'calculation', 'matrix', 'solution', 'theorem', 'fact', 'lemma', 'castle'];

function poeticName(text) {
  const sha = crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');

  const buffer = new Buffer(sha, 'hex');

  var n = buffer.readUInt32LE(7);
  const preposition = prepositions[n % prepositions.length];

  var n = buffer.readUInt32LE(11);
  const adjective = adjectives[n % adjectives.length];

  let article = 'the';
  if (buffer.readUInt8(6) % 2 == 0) {
    if (adjective.substr(0, 1).match(/[aeiou]/)) article = 'an';
    else article = 'a';
  }

  var n = buffer.readUInt32LE(15);
  const noun = nouns[n % nouns.length];

  const phrase = [preposition, article, adjective, noun].join(' ');
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return capitalizeFirstLetter(phrase.toLowerCase());
}


function redactApplication(user, application) {
  if (user.isEvaluator && !user.isSuperuser) {
    application.firstName = '█████';
    application.lastName = '█████';

    application.firstName = `“${poeticName(application.id.toString())}”`;
    application.lastName = '';

    application.nickname = '█████';
    application.gender = '█████';
    application.citizenship = ['██'];
    application.parentName = '█████ █████';

    if (application.user) application.user.email = '█████@█████.███';

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
        .populate('offer')
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
