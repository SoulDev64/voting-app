import * as passport from 'passport';
// import * as passportLocal from 'passport-local';
import User from '../../models/user.model';

const MagicLinkStrategy = require('passport-magic-link').Strategy
const nodemailer = require("nodemailer");

export default function addLocalStrategy() {

  console.log("init MagicLinkStrategy");

  passport.use(new MagicLinkStrategy({
    secret: 'my-secret',
    userFields: ['email'],
    tokenField: 'token'
  }, (user, token, done) => {

    console.log(user,token);
    // sendMail
    return user;

  }, (user) => {

    console.log(user);

    const myUsr = User.findOne({ email: user.email });
    return myUsr;
    // return done(null, myUsr);

  }))

/*
  passport.use(new MagicLinkStrategy({
    secret: 'my-secret',
    userFields: ['name', 'email'],
    tokenField: 'token'
  }, (user, token) => {
    console.log(user, token);

    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    //let account = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "localhost",
      port: 25,
      secure: false, // true for 465, false for other ports
      //auth: {
      //  user: account.user, // generated ethereal user
      //  pass: account.pass // generated ethereal password
      //}
    });

    // setup email data with unicode symbols
    let mailOptions = {
      from: '"eVoteGG" <evote@gilets-jaunes.online>', // sender address
      to: "bar@example.com, baz@example.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>" // html body
    };

    // send mail with defined transport object
    let info = transporter.sendMail(mailOptions)

    console.log("Message sent: %s", info.messageId);

    return info;
  }, (user, password, done) => {
    console.log(user);
    User.findOne({ email: user.email }, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'Cet utilisateur n\'éxiste pas' });
      return done(null, user);
    })
    //return User.findOrCreate({email: user.email, name: user.name})
  }));
  */
}
