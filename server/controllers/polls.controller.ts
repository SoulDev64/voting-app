import Poll from '../models/poll.model';
import Stack from '../models/stack.model';

export default class PollsController {

  create = (req, res) => {
    let poll = new Poll(req.body);

    // TODO: Vérification isAdmin


    poll.createdBy = req.user;
    poll.save((err) => {
      if (err) return res.status(500).send(err);
      res.send(poll);
    })
  };

  canVote = (req, res, next) => {
    const { id, value} = req.body;

    if (value && !req.isAuthenticated()) {
      return res.status(403).send({message: 'Non autorisé'});
    }

    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let userVoted;
    let ipVoted;

    userVoted = req.user && req.poll.users.some(user => {
      return user.equals(req.user.id);
    });

    ipVoted = req.poll.ips.indexOf(ip) !== -1;

    if (userVoted) {// || ipVoted) { 
      return res.status(403).send({message: 'Vous avez déjà voté'});
    }
    return next();
  };

  canDelete = (req, res, next) => {
    if (!req.poll.createdBy.equals(req.user._id)) {
      return res.status(403).send({message: 'Non autorisé'})
    }
    return next();
  };

  getPoll(req, res, next) {
    Poll.findById(req.params.id).exec((err, poll) => {
      if (err) return res.status(500).send(err);
      if (!poll) return res.status(500).send({message: 'Ce vote n\'éxiste pas'});
      req.poll = poll;
      return next();
    })
  }

  get = (req, res) => {
    // exclude , { users:0, ips:0 }
    const pollOut = req.poll;
    pollOut.users = undefined;
    pollOut.ips = undefined;
    res.send(pollOut);
  };

  delete = (req, res) => {
    req.poll.remove((err) => {
      if (err) return res.status(500).send(err);
      return res.send({});
    })
  };

  list = (req, res) => {
    const includeChp = {name:1,options:1,category:1,createdBy:1};
    if(req.isAuthenticated()) includeChp['users'] = { $elemMatch: { $eq:req.user._id } } ;
    Poll.find({}, includeChp).limit(parseInt(req.query.limit || 100)).populate('createdBy', 'name').exec((err, polls) => {
      if (err) return res.status(500).send(err);
      res.send(polls);
    })
  };

  vote = (req, res) => {
    const { id, value} = req.body,
      poll = req.poll;

    // Vote seulement si authentifié
    if (!req.isAuthenticated()) {
      return res.status(403).send({message: 'Non autorisé (ERR-VOTE1)'});
    }

    if (id) {
      const optionToVote = poll.options.id(id);
      optionToVote.votes++;
    } else {
      return res.status(403).send({message: 'Non autorisé (ERR-VOTE2)'});
      // poll.options.push({value, votes: 1});
    }
    if (req.user) {
      poll.users.push(req.user._id);
    } else {
      return res.status(403).send({message: 'Non autorisé (ERR-VOTE3)'});
    }
    poll.ips.push(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    poll.save((err) => {
      if (err) return res.status(500).send(err);
      //
      // Stack pour filtration GJ de l'AC
      // /!\ Cela oblige à un vote non anonyme
      //
      const stackVote = new Stack({poll:poll._id,optionToVote:id,user:req.user._id});
      stackVote.save((err) => {
        if (err) return res.status(500).send(err);
        poll.users = undefined;
        poll.ips = undefined;
        return res.send(poll);
      });
    });
  };
}
