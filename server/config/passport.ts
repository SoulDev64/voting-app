import * as passport from 'passport';
import User from '../models/user.model';

import addLocalStrategy from './strategies/hash';

export default function setPassport() {

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, function(err, user) {
      done(err, user);
    })
  });

  addLocalStrategy();

}
