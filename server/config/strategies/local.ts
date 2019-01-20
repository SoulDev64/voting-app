import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import User from '../../models/user.model';

const LocalStrategy = passportLocal.Strategy;

export default function addLocalStrategy() {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, (username, password, done) => {
    User.findOne({email: username}, (err, user) => {
      if (err) return done(err);
      if (!user) return done(null, false, {message: 'Cet utilisateur n\'éxiste pas'});
      if (!user.validPassword(password)) {
        return done(null, false, {message: 'Mot de passe incorrect'});
      }
      return done(null, user);
    })
  }));
}
