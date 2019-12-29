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
    //secure: SMTP_PORT == 465, // true for 465, false for other ports
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

export function put(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canEdit(req.user)) {
        const query = {
          user: req.user._id,
          year: req.params.year,
        };

        const setter = {
          $set: {
          },
        };

        const fields = applicationModel.schema.eachPath((p) => {
          if (p.match(/^[A-z]/)) {
            if (req.body[p] !== undefined) setter.$set[p] = req.body[p];
          }
        });

        applicationModel.findOneAndUpdate(query, setter,
          { upsert: true, new: true }, (err, application) => {
            if (err) return res.status(500).send('Error saving application');
            return res.json(application.toJSON());
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
