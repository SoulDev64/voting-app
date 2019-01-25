import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

const StackSchema = new Schema({
  poll: {type: Schema.Types.ObjectId, ref: 'Poll'},
  optionToVote : {type: Schema.Types.ObjectId, ref: 'Option'},
  user: {type: Schema.Types.ObjectId, ref: 'User'}
});

const Stack = mongoose.model('Stack', StackSchema);

export default Stack;
