import userModel from '../models/users';
import applicationModel from '../models/application';
import attachmentModel from '../models/attachment';

export function getById(req, res, next) {
  attachmentModel.findById(req.params.id).populate('application').exec((err, attachment) => {
    if (err)
      res.status(500).send('Error fetching attachment data');
    else {
      userModel.findById( attachment.application.user ).exec((err, user) => {
        if (err)
          res.status(500).send('Error fetching user for application');
        else {
          if (req.jwt && req.jwt.user) {
            if (req.jwt.user.canViewAttachment(attachment)) {
              if (attachment.type)
                res.setHeader("Content-Type",attachment.type);
              if (attachment.name)
                res.setHeader("Content-Dispositon",`attachment; filename=${attachment.name}`);
              
              res.send(attachment.data);
            } else {
              res.status(403).send('Not permitted to view attachment');              
            }
          } else {
            res.status(401).send('Unauthenticated');            
          }
        }
      });
    }
  });
}


export function get(req, res, next) {
  if (req.application) {
    const query = {
      application: req.application._id,
    };

    attachmentModel.find(query, '-data').populate('application').exec((err, attachments) => {
      if (err)
        res.status(500).send('Error fetching attachments');
      else {
        if (req.jwt && req.jwt.user) {
          res.json( attachments
                    .filter( (attachment) => req.jwt.user.canViewAttachment(attachment) )
                    .map( (attachment) => attachment.toJSON() ) );
        } else {
          res.json( [] );
        }
      }
    });
  } else {
    res.json( [] );
  }
}

export function remove(req, res, next) {
  if (req.application.submitted) {
    return res.status(403).send('Not permitted to update an already submitted application.  Withdraw your application first.');    
  }
  
  const query = {
    application: req.application._id,
    _id: req.params.id
  };
  
  attachmentModel.deleteOne(query, (err) => {
    if (err)
      res.status(500).send('Error removing attachment');
    else
      res.status(200).send('Attachment deleted');
  });
}

export async function post(req, res, next) {
  if (req.application.submitted) {
    return res.status(403).send('Not permitted to update an already submitted application.  Withdraw your application first.');    
  }
  
  const query = {
    application: req.application._id,
  };

  if (req.files) {
    if (req.files.file) {
      let attachment = new attachmentModel({
        application: req.application._id,
        name: req.files.file.name,
        type: req.files.file.mimetype,
        data: req.files.file.data
      });

      if (req.params.label)
        attachment.label = req.params.label;
      
      attachment.save(function (err, result) {
        if (err)
          res.status(500).send('Error saving attachment');
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
