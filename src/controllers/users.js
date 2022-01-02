import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import userModel from '../models/users';
import nodemailer from 'nodemailer';
import generatePassword from 'generate-password';

export function findUser(req, res, next) {
  function handleUser(err, user) {
    if (err) {
      next(err);
    } else if (user) {
      req.user = user;
      next();
    } else {
      res.status(404).send('User not found');
    }
  }

  if (req.params.user) {
    if (req.params.user == 'me') {
      // BADBAD: deal with the jwt user
      if (req.jwt && req.jwt.user) {
        req.user = req.jwt.user;
      }
      next();
    } else {
      // if we are searching by email
      if (req.params.user.indexOf('@') >= 0) {
        userModel.findOne({ email: req.params.user }, handleUser);
      } else {
        // otherwise we are searching by user id
        userModel.findById(req.params.user, handleUser);
      }
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function get(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView(req.user)) {
        res.json(req.user.toJSON());
      } else {
        res.status(403).send('Not permitted to view');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export function put(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canEdit(req.user)) {
        // FIXME missing edits
        req.user.save()
          .then(() => {
            delete req.user.password;
            res.json(req.user);
          })
          .catch((err) => {
            res.sendStatus(500);
          });
      } else {
        res.status(403).send('Not permitted to edit');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

export async function post(req, res, next) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_HOST != 'smtp.mailtrap.io',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    },
  });

  let email = req.params.user;
  const query = { email };

  let password = generatePassword.generate({length: 16});

  const saltRounds = 10;
  const setter = { $set: { password: bcrypt.hashSync(password, saltRounds) } };

  userModel.findOneAndUpdate(query, setter,
                             { upsert: true, new: true }, (err, user) => {
                               if (err) return res.status(500).send('Error upserting user');

                               // send mail with defined transport object
                               transporter.sendMail({
                                 from: 'The Ross Mathematics Program <ross@rossprogram.org>',
                                 to: email, // list of receivers
                                 subject: "Your password for apply.rossprogram.org", // Subject line
                                 text: `Dear applicant,\n\nThank you for registering on apply.rossprogram.org.\n\nPlease go to https://apply.rossprogram.org/login and use the following credentials.\n\nemail: ${email}\npassword: ${password}\n\nLet us know if you have trouble logging in.\n\nThe Ross Mathematics Program`, // plain text body
                                 html: `<p>Dear applicant,</p><p>Thank you for registering on apply.rossprogram.org.<br/>Please <a href="https://apply.rossprogram.org/login">login</a> with the following credentials.</p><table><tr><td>email:</td><td>${email}</td><tr><td>password:</td><td>${password}</td></tr></table><p>Let us know if you have trouble logging in.</p><p>The Ross Mathematics Program</p>` // html body
                               }).then( () => {
                                 res.json(user.toJSON());
                               } )
                                 .catch( (err) => {
                                   console.log(err);
                                   res.status(500).send(err);
                                 });
                             });
}


function generateJWT(req, res, callback) {
  const auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(auth, 'base64').toString().split(':');
  
  if (login != req.params.user) {
    res.sendStatus(500);
  } else if (req.user && req.user.password) {
    if (bcrypt.compareSync(password, req.user.password)) {
      const token = jwt.sign({ id: req.user._id }, req.app.get('secretKey'), { expiresIn: '1y' });

      var ip = (req.headers['x-forwarded-for'] || '').split(',').pop() || 
          req.connection.remoteAddress || 
          req.socket.remoteAddress || 
          req.connection.socket.remoteAddress;

      req.user.update( { '$addToSet': { 'ipAddresses': ip } }, function() { return; });

      delete req.user.password;
      // res.cookie('token', token, { maxAge: 86400000, httpOnly: true });
      callback(null, token);
    } else {
      res.status(401).send('Invalid credentials');
    }
  }
}

export function authorize(req, res, next) {
  generateJWT(req, res, (err, token) => {
    if (err) res.status(500).send('Could not generate JWT');
    // express records maxAge in milliseconds to be consistent with javascript mroe generally
    else {
      res.cookie('token', token, { maxAge: 604800000, httpOnly: true, secure: true });
      res.json(req.user.toJSON());
    }
  });
}

