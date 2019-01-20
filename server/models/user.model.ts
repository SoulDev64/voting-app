import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: 'Nom requis'
  },
  email: {type: String,
    unique: true,
    required: 'Email requis',
    match: [/.+\@.+\..+/, "Merci d\'indiquer un email valide"]
  },
  password: {
    type: String,
    required: 'Mot de passe requis'
  }
});

UserSchema.methods.hashPassword = function(password) {
  this.password = bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

const User = mongoose.model('User', UserSchema);

export default User;
