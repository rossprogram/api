import userModel from '../models/users';
import applicationModel from '../models/application';
import recommendationModel from '../models/recommendation';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import generatePassword from 'generate-password';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

export async function post(req, res, next) {
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
  if (req.application.firstName) {
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
                                   text: `Dear recommender,\n\n${applicantName} has requested you write a recommendation letter to the Ross Mathematics Program on their behalf.\n\nPlease go to\n\n  ${theUrl}\n\nto submit your letter.\n\nThank you for your time; your expert feedback enables us to better evaluate candidates for the Program.\n\nThe Ross Mathematics Program`, // plain text body
                                   html: `<p>Dear recommender,</p><p>${applicantName} has requested you write a recommendation letter to the Ross Mathematics Program on their behalf.</p><p>Please go to\n\n  <a href="${theUrl}">${theUrl}</a> to submit your letter.</p><p>Thank you for your time; your expert feedback enables us to better evaluate candidates for the Program.</p><p>The Ross Mathematics Program</p>` // html body
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
  const query = {
    application: req.application._id,
  };
  
  recommendationModel.find(query, '-letter').exec((err, recommendations) => {
    if (err)
      res.status(500).send('Error fetching recommendations');
    else
      res.json( recommendations.map( (recommendation) => recommendation.toJSON() ) );
  });
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
                  else
                    res.json( result.toJSON() );
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
