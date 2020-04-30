import userModel from '../models/users';
import paymentModel from '../models/payment';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

function paymentIntentSucceeded(req, res, intent) {
  let query = {
    intent: intent.id
  };

  let setter = { $set: {
    succeeded: true
  } };
  
  paymentModel.findOneAndUpdate(query, setter, (err, oldPayment) => {  });

}

function paymentIntentCanceled(req, res, intent) {
  let query = {
    intent: intent.id
  };

  let setter = { $set: {
    canceled: true
  } };
  
  paymentModel.findOneAndUpdate(query, setter, (err, oldPayment) => {  });
}

function paymentIntentFailed(req, res, intent) {
  let query = {
    intent: intent.id
  };

  let setter = { $set: {
    succeeded: false,
    lastPaymentError: intent.last_payment_error
  } };
  
  paymentModel.findOneAndUpdate(query, setter, (err, oldPayment) => {  });
}

function paymentIntentProcessing(req, res, intent) {
  let query = {
    intent: intent.id
  };

  let setter = { $set: {
    processing: true
  } };
  
  paymentModel.findOneAndUpdate(query, setter, (err, oldPayment) => {  });
}

export async function stripeWebhook(req, res, next) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  }
  catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  
  // Handle the event
  switch (event.type) {
  case 'payment_intent.succeeded':
    paymentIntentSucceeded(req, res, event.data.object);
    break;
  case 'payment_intent.canceled':
    paymentIntentCanceled(req, res, event.data.object);
    break;
  case 'payment_intent.payment_failed':
    paymentIntentFailed(req, res, event.data.object);
    break;
  case 'payment_intent.processing':
    paymentIntentProcessing(req, res, event.data.object);
    break;

  default:
    // Unexpected event type
    return res.status(400).end();
  }
  
  // Return a response to acknowledge receipt of the event
  res.json({received: true});
}

export async function getAll(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView(req.user)) {
        const query = {
          user: req.user._id,
        };

        paymentModel.find(query).exec((err, payments) => {
          if (err) return res.status(500).send('Error fetching payments');
          if (payments) {
            return res.json(payments.map((payment) => payment.toJSON()));
          } else {
            return res.status(404).send('No payments found');            
          }
        });
      } else {
        res.status(403).send('Not permitted to view payments');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}

export async function get(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView(req.user)) {
        const query = {
          user: req.user._id,
          _id: req.params.id,
        };

        paymentModel.findOne(query).exec((err, payment) => {
          if (err) return res.status(500).send('Error fetching payment');
          if (payment) {
            return res.json(payment.toJSON());
          } else {
            return res.status(404).send('No payment found');            
          }
        });
      } else {
        res.status(403).send('Not permitted to view payment');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}


export async function post(req, res, next) {
  if (req.user) {
    if (req.jwt && req.jwt.user) {
      if (req.jwt.user.canView(req.user)) {
        stripe.paymentIntents.create(
          {
            amount: req.body.amount,
            currency: 'usd',
            payment_method_types: ['card'],
            description: req.body.description,
            metadata: {
              user: req.user._id.toString(),
              email: req.user.email,
            },
            receipt_email: req.jwt.user.email,
          },
          function(err, paymentIntent) {
            if (err) {
              return res.status(500).send('Error creating payment intent');
            } else {
              var payment = new paymentModel({
                user: req.user._id,
                description: req.body.description,
                amount: req.body.amount,
                intent: paymentIntent.id
              });

              payment.save(function (err) {
                if (err) {
                  return res.status(500).send('Error saving payment');
                }
                return res.json( { clientSecret: paymentIntent.client_secret } );
              });
            }
          }
        );
      } else {
        res.status(403).send('Not permitted to view payment');
      }
    } else {
      res.status(401).send('Unauthenticated');
    }
  } else {
    res.status(404).send('User not found');
  }
}
