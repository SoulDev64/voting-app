import * as passport from 'passport';
import * as passportLocal from 'passport-local';
import User from '../../models/user.model';

const HashStrategy = require('passport-hash').Strategy;

export default function addLocalStrategy() {

  passport.use(new HashStrategy(
    {},
    function(hash, done) {
      console.log('addLocalStrategy',hash);
      User.findOne({ /*hash: hash*/ }, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

}
