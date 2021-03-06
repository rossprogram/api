import userModel from '../models/users';
import applicationModel from '../models/application';
import recommendationModel from '../models/recommendation';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import generatePassword from 'generate-password';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

export async function post(req, res, next) {
  if (req.application === undefined) {
    res.status(500).send('Before adding a recomender, save your background information.');
    return;
  }
  
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,    
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  let email = req.params.recommender;
  
  const query = { application: req.application,
                  email
                };

  let applicantName = 'An applicant';
  if (req.application && req.application.firstName) {
    applicantName = req.application.firstName;
    if (req.application.lastName)
      applicantName = `${applicantName} ${req.application.lastName}`;
  }

  let password = generatePassword.generate({length: 16}).toLowerCase();

  const saltRounds = 10;
  const setter = { $set: { password: bcrypt.hashSync(password, saltRounds) } };

  recommendationModel.findOneAndUpdate(query, setter,
                             { upsert: true, new: true }, (err, recommendation) => {
                               if (err)
                                 res.status(500).send('Error upserting recommender');
                               else {
                                 const theUrl = `https://recommend.rossprogram.org/${recommendation._id}/${password}`;
  
                                 // send mail with defined transport object
                                 transporter.sendMail({
                                   from: 'The Ross Mathematics Program <ross@rossprogram.org>',
                                   to: email,
                                   subject: "Recommendation letter requested for the Ross Program",
                                   text: `Dear recommender,\n\n${applicantName} has requested you write a recommendation letter to the Ross Mathematics Program on their behalf.\n\nPlease talk to the student to verify that they are applying to the Ross Program, and then go to\n\n  ${theUrl}\n\nto submit your letter as a PDF.\n\nPlease submit the recommendation within a week of receiving the request.  If more time is needed, note that the Ross Admissions Committee will start making acceptance decisions in April.  All application windows will close on March 31.\n\nThank you for your time; your expert feedback enables us to better evaluate candidates for the Program.\n\nThe Ross Mathematics Program`, // plain text body
                                   html: `<p>Dear recommender,</p><p>${applicantName} has requested you write a recommendation letter to the Ross Mathematics Program on their behalf.</p><p>Please talk to the student to verify that they are applying to the Ross Program, and then go to <a href="${theUrl}">${theUrl}</a> to submit your letter as a PDF.</p><p>Please submit the recommendation within a week of receiving the request.  If more time is needed, note that the Ross Admissions Committee will start making acceptance decisions in April.  All application windows will close on March 31.</p><p>Thank you for your time; your expert feedback enables us to better evaluate candidates for the Program.</p><p>The Ross Mathematics Program</p>` // html body
                                 })
                                   .then( () => {
                                     res.json(recommendation.toJSON());
                                   })
                                   .catch( (err) => {
                                     res.status(500).send(err);
                                   });
                               }
                             });
}

export function getAll(req, res, next) {
  if (req.application) {
    const query = {
      application: req.application._id,
    };
  
    recommendationModel.find(query, '-letter').exec((err, recommendations) => {
      if (err)
        res.status(500).send('Error fetching recommendations');
      else
        res.json( recommendations.map( (recommendation) => recommendation.toJSON() ) );
    });
  } else {
    res.json( [] );
  }
}

export function get(req, res, next) {
  recommendationModel.findById(req.params.id, '-letter').populate({ path: 'application', select: 'firstName nickname lastName' }).exec((err, recommendation) => {
    if (err)
      res.status(500).send('Error fetching recommendation letter data');
    else {
      if (recommendation) {
        if (bcrypt.compareSync(req.params.password, recommendation.password)) {
          res.status(200).json(recommendation.toJSON());
        } else {
          res.status(401).send('Invalid credentials');
        }
      } else {
        res.status(403).send('Could not find recommendation letter.');
      }
    }
  });
}

export async function put(req, res, next) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,    
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  
  recommendationModel.findById(req.params.id, '-letter').exec((err, recommendation) => {
    if (err)
      res.status(500).send('Error fetching recommendation letter data');
    else {
      if (recommendation) {
        if (bcrypt.compareSync(req.params.password, recommendation.password)) {
          if (recommendation.submittedAt) {
            res.status(401).send('Recommendation letter has already been submitted.');
          } else {
            if (req.files) {
              if (req.files.file) {
                recommendation.letter = req.files.file.data;
                recommendation.type = req.files.file.mimetype;
                recommendation.name = req.files.file.name;
                recommendation.submittedAt = Date.now();
                
                recommendation.save(function (err, result) {
                  if (err)
                    res.status(500).send('Error saving recommendation letter');
                  else {
                    res.json( result.toJSON() );
                    // send mail with defined transport object
                    transporter.sendMail({
                      from: 'The Ross Mathematics Program <ross@rossprogram.org>',
                      to: email,
                      subject: "Your recommendation letter has been received",
                      text: `Dear recommender,\n\nYour recommendation letter to the Ross Program has been received.\n\nThank you for your time.  Your expert feedback enables us to evaluate candidates for the Program.\n\nSincerely,\nThe Ross Mathematics Program`, // plain text body
                      html: `<p>Dear recommender,</p><p>Your recommendation letter to the Ross Program has been received.</p><p>Thank you for your time.  Your expert feedback enables us to evaluate candidates for the Program.</p><p>Sincerely,<br/>The Ross Mathematics Program</p>` // html body
                    })
                      .then( () => {
                      })
                      .catch( (err) => {
                      });
                  }
                });
                
              } else {
                res.status(500).send('Wrong name of file');
              }
            } else {
              res.status(500).send('No file uploaded');
            } 
          }
        } else {
          res.status(401).send('Invalid credentials');
        }
      } else {
        res.status(403).send('Could not find recommendation letter.');
      }
    }
  });
}

export function getById(req, res, next) {
  recommendationModel.findById(req.params.id).populate('application').exec((err, recommendation) => {
    if (err)
      res.status(500).send('Error fetching recommendation data');
    else {
      userModel.findById( recommendation.application.user ).exec((err, user) => {
        if (err)
          res.status(500).send('Error fetching user for application');
        else {
          if (req.jwt && req.jwt.user) {
            if (req.jwt.user.canViewRecommendation(recommendation)) {
              if (recommendation.type)
                res.setHeader("Content-Type",recommendation.type);
              if (recommendation.name)
                res.setHeader("Content-Dispositon",`recommendation; filename=${recommendation.name}`);
              
              res.send(recommendation.letter);
            } else {
              res.status(403).send('Not permitted to view recommendation');              
            }
          } else {
            res.status(401).send('Unauthenticated');            
          }
        }
      });
    }
  });
}
