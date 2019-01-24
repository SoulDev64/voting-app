import * as passport from 'passport';
import * as validator from 'validator';
import User from '../models/user.model';
const nodemailer = require("nodemailer");
const UIDGenerator = require('uid-generator');
const ZipCodesValidator = require('i18n-zipcodes');

export default class UsersController {

  checkToken = (req, res, next) => {
    passport.authenticate('hash', function(err, user, info) {
      if (err) { return res.status(500).send(err); }
      if (!user) { return res.status(400).send(info); }
      req.logIn(user, err => {
        if (err) { return next(err); }
        // const userOut = user;
        user.hash = undefined;
        user.__v = undefined;
        return res.send(user);
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

      if (err) { return res.status(500).send(err); }
      if (!user || user == null) { return res.status(400).send({message: 'Email invalide'}) }

      return myThis.sendMailToken(req, res, user);

    });
  };

  register = (req, res) => {

    const { name, surname, city, zipcode, email } = req.body;

    if (!name) return res.status(400).send({message: 'Nom requis'});
    if (!surname) return res.status(400).send({message: 'Prénom requis'});
    if (!zipcode) return res.status(400).send({message: 'Code postal requis'});
    if (!city) return res.status(400).send({message: 'Commumne requise'});
    if (!email) return res.status(400).send({message: 'Email requis'});

    if (!validator.isEmail(email)) return res.status(400).send({message: 'Email invalide'});
    if (!ZipCodesValidator('fr', zipcode)) return res.status(400).send({message: 'Code postal invalide'});

    const newUser = new User({name, surname, zipcode, city, email});

    // Pas beau
    const myThis = this;

    User.findOne({email}, (err, user) => {

      if (err) return res.status(500).send(err);
      if (user) {
        return res.status(400).send({message: 'Un utilisateur éxiste déjà avec cet email'});
      }

      newUser.save(err => {
        if (err) return res.status(500).send(err);

        return myThis.sendMailToken(req, res, newUser);
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

  sendMailToken = (req, res, user) => {

    if (!user || user == null) { return res.status(400).send({message: 'Email invalide'}) }

    // Genere le hash
    const uidgen = new UIDGenerator(UIDGenerator.BASE36, 64);

    uidgen.generate((err, uid) => {
      if (err) return res.status(500).send(err);

      // Génération du Token + expiration
      user.hash = uid;
      user.expireToken = (Date.now()) + (1 * 60 * 60 * 1000); // Maintenant + 1 heure

      user.save(err => {
        if (err) return res.status(500).send({message: err.message});

        // Sendmail
        let transporter = nodemailer.createTransport({
          host: "localhost",
          port: 25,
          secure: false,
          tls: {rejectUnauthorized: false}
        });

        // setup email data with unicode symbols
        const confirmUrl = "https://evote.gilets-jaunes.online/confirm/" + uid;
        const fromMail = '"eVoteGJ" <evote@gilets-jaunes.online>'
        const toMail = '"' + user.surname + ' ' + user.name + '" <' + user.email + '>';
        let mailOptions = {
          from: fromMail, // sender address
          to: toMail, // list of receivers
          subject: "eVoteGJ lien d'identification à la plateforme de vote ✔", // Subject line
          text: "Lien pour s'identifier sur la plateforme de vote : " + confirmUrl, // plain text body
          html: "Lien pour s'identifier sur la plateforme de vote : " + confirmUrl // html body
        };

        // send mail with defined transport object

        // // TODO: Erreurs sur une machine sans sendmail
        // (node:57427) UnhandledPromiseRejectionWarning: Error: connect ECONNREFUSED 127.0.0.1:25
        // [3]     at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1082:14)
        // [3] (node:57427) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1)
        // [3] (node:57427) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.

        let info = transporter.sendMail(mailOptions)

        console.log("Message sent: %s", mailOptions.text);

        return res.send({message: 'Mail envoyé avec succès'});
      });
    });
  }
}
