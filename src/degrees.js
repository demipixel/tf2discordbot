const config = require('config');
const sw = require('./steamweb')(config.get('steam.key'));

module.exports = getDegree;

function getDegree(id1, id2, cb, friends1, friends2, tracker1, tracker2, count) {
  if (count == 4) {
    cb(null);
    return;
  }
  if (!friends1) {
    friends1 = {};
    friends2 = {};
    tracker1 = {};
    tracker2 = {};
    friends1[id1] = false;
    friends2[id2] = false;
    tracker1[id1] = null;
    tracker2[id2] = null;
    count = 0;
  }

  var firstDone = false;
  iteration(friends1, tracker1, () => {
    var match = checkMatch(tracker1, tracker2);
    if (match) {
      cb(match);
    } else iteration(friends2, tracker2, () => {
      var match = checkMatch(tracker1, tracker2);
      if (match) cb(match);
      else getDegree(id1, id2, cb, friends1, friends2, tracker1, tracker2, count+2);
    });
  });
}

function iteration(obj, tracker, cb) {
  var doneCount = 0;
  var checkFriends = Object.keys(obj).filter(k => !obj[k]);
  var done = () => {
    if (doneCount != checkFriends.length-1) doneCount++;
    else {
      cb();
    }
  }

  for (var i = 0; i < checkFriends.length; i++) {
    getFriends(checkFriends[i], obj, tracker, done)
  }
}

function getFriends(id, obj, tracker, cb) {
  obj[id] = true;
  sw.friends(id, (err, friends) => {
    if (!err && friends) {
      friends = parseFriends(friends);
      addNoDuplicates(friends, obj);
      for (var i = 0; i < friends.length; i++) {
        if (tracker[friends[i]] === undefined) {
          tracker[friends[i]] = id;
        }
      }
    }
    cb();
  });
}

function checkMatch(list1, list2) {
  var keys1 = Object.keys(list1);
  var keys2 = Object.keys(list2);
  for (var i = 0; i < keys1.length; i++) {
    if (keys2.indexOf(keys1[i]) != -1) {
      return track(list1[keys1[i]], list1, false).concat(track(keys2[keys2.indexOf(keys1[i])], list2, true));
    }
  }
  return null;
}

function parseFriends(list) {
  return list.friends.map(i => i.steamid);
}

function addNoDuplicates(list, toObj) {
  var keys = Object.keys(toObj);
  var valids = list.filter(i => keys.indexOf(i) == -1);
  for (var i = 0; i < valids.length; i++) {
    toObj[valids[i]] = false;
  }
}

function track(id, obj, forward) {
  if (!obj[id]) return [];
  else if (forward) return [id].concat(track(obj[id], obj, forward));
  else return track(obj[id], obj, forward).concat(id);
}
