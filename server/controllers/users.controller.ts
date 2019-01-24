import * as passport from 'passport';
import * as validator from 'validator';
import User from '../models/user.model';
const nodemailer = require("nodemailer");
const UIDGenerator = require('uid-generator');

export default class UsersController {

  checkToken = (req, res, next) => {
    passport.authenticate('hash', function(err, user, info) {
      if (err) { return res.status(500).send(err); }
      if (!user) { return res.status(400).send(info); }
      req.logIn(user, err => {
        if (err) { return next(err); }
        return res.send({_id: user._id, name: user.name, email: user.email});
      });
    })(req, res, next);
  }


  login = (req, res, next) => {

    const { email } = req.body;

    if (!email) return res.status(400).send({message: 'Email requis'});
    if (!validator.isEmail(email)) return res.status(400).send({message: 'Email invalide'});

    // Pas beau
    const myThis = this;

    // Test si compte existant
    User.findOne({ email: email }, function (err, user) {

      if (err) { res.status(500).send(err); }
      if (!user || user == null) { res.status(400).send({message: 'Email invalide'}) }

      return myThis.sendMailToken(res, user);

    });
  };

  register = (req, res) => {

    const { name, surname, city, email } = req.body;

    if (!name) return res.status(400).send({message: 'Nom requis'});
    if (!surname) return res.status(400).send({message: 'Prénom requis'});
    if (!city) return res.status(400).send({message: 'Comune requise'});
    if (!email) return res.status(400).send({message: 'Email requis'});

    if (!validator.isEmail(email)) return res.status(400).send({message: 'Email invalide'});

    const newUser = new User({name, surname, city, email});

    // Pas beau
    const myThis = this;

    User.findOne({email}, (err, user) => {

      if (err) return res.status(500).send(err);
      if (user) {
        return res.status(400).send({message: 'Un utilisateur éxiste déjà avec cet email'});
      }

      newUser.save(err => {
        if (err) return res.status(500).send(err);

        return myThis.sendMailToken(res, newUser);
      });

    });
  };

  logout = (req, res) => {
    req.logout();
    return res.send({message: 'L\'utilisateur est déconnecté'});
  };

  // TODO: Cette possibilité doit être supprimée
  changePassword = (req, res) => {
    const userId = req.body.userId;

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) return res.status(400).send({message: 'Ancien mot de passe requis'});
    if (!newPassword) return res.status(400).send({message: 'Nouveau mot de passe requis'});
    if (newPassword.length < 6) return res.status(400).send({message: 'Le nouveau mot de passe doit au moins contenir 6 caractères'});

    User.findById(userId, (err, user) => {
      if (err) return res.status(500).send({message: err.message});
      if (!user.validPassword(oldPassword)) {
        return res.status(400).send({message: 'Ancien mot de passe invalide'});
      }
      user.hashPassword();
      user.save(err => {
        if (err) return res.status(500).send({message: err.message});
        return res.send({message: 'Mot de passe changé avec succès'});
      })
    })
  };

  isAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send({message: 'L\'utilisateur n\'est pas authentifié'});
    }
    next();
  }

  // TODO: ajouter isAdmin

  sendMailToken = (res, user) => {
    console.log('passe')
    // Genere le hash
    const uidgen = new UIDGenerator(UIDGenerator.BASE36, 64);

    uidgen.generate((err, uid) => {
      if (err) return res.status(500).send(err);

      user.hash = uid;

      user.save(err => {
        if (err) return res.status(500).send({message: err.message});
        // Sendmail
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
          const baseUrl = "https://evote.gilets-jaunes.online/confirm/" + uid;
          let mailOptions = {
            from: '"eVoteGG" <evote@gilets-jaunes.online>', // sender address
            to: "jeff.besnard@gmail.com", // list of receivers
            subject: "eVoteGJ lien d'identification à la plateforme de vote ✔", // Subject line
            text: "URL : " + baseUrl, // plain text body
            html: "URL : " + baseUrl // html body
          };

          // send mail with defined transport object
          let info = transporter.sendMail(mailOptions)

          console.log("Message sent: %s", mailOptions.text);

          return res.status(401).send({message: 'Mail envoyé avec succès'});
        });
      });

  }
}
