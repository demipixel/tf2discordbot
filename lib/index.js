function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const config = require('config');
const DiscordClient = require('discord.io');
const moment = require('moment');
const Snoowrap = require('snoowrap');
const emoji = require('node-emoji');
const CleverBot = require('cleverbot.io');
const chrono = require('chrono-node');

const bot = new DiscordClient({
  autorun: true,
  email: config.get('discord.email'),
  password: config.get('discord.password')
});

const clever = new CleverBot('oer8pvtEbyCskunk', 't5dQ7A8VnobCXPdD21hISsjbt1EvYCfx');
clever.setNick('TF2Discord');

clever.create((err, session) => {
  if (err) throw err;
});

const reddit = new Snoowrap({
  client_id: config.get('reddit.id'),
  client_secret: config.get('reddit.secret'),
  refresh_token: config.get('reddit.refresh_token'),
  user_agent: config.get('reddit.user_agent')
});

const localData = require('./data')('./data');

var mainServer;
const chat = (id, message, noEmoji) => {
  bot.sendMessage({
    to: id,
    message: !noEmoji ? emoji.emojify(message) : message
  });
};
const idFromName = name => {
  name = name.replace(/[@<>]/g, '');
  return Object.keys(mainServer.members).reduce((chosen, id) => {
    return mainServer.members[id].user.username == name || id == name ? id : chosen;
  }, null);
};
const chooseRandom = arr => {
  return arr[Math.floor(Math.random() * arr.length)];
};
const DEMIPIXEL_ID = '125696820901838849';

bot.on('ready', function () {
  console.log(bot.username + ' [' + bot.id + '] has started up!');
  mainServer = bot.servers[config.get('discord.server')];
});

var REDDIT_MATCH = /https?:\/\/www\.reddit\.com\/r\/([^/]+)\/comments\/([^/]+)\//;

bot.on('message', function (user, userID, channelID, message, rawEvent) {
  var channel = mainServer.channels[channelID];
  if (!channel) channel = bot.directMessages[channelID];
  var pm = !channel.name;
  if (!pm) console.log('[' + userID + ']', user, channel.name + ':', message);else console.log('[' + userID + ']', user, 'PM:', message);
  if (userID == bot.id) return;
  if (pm) parsePM(user, userID, channelID, message, rawEvent);
  if (message == '!hey') {
    chat(channelID, 'Hey there, <@' + userID + '>!');
  } else if (message == '!info') {
    chat(channelID, 'Hey! I\'m the /r/tf2 Discord Bot created by <@' + DEMIPIXEL_ID + '>! Send any suggestions or feedback to him :)');
  } else if (message == '!hug' || message.indexOf('!hug ') == 0) {
    var match = message.match(/!hug (.*)/);
    var name = (match ? match[1] : '').replace(/[@<>]/g, '');
    var id = idFromName(name);
    if (!match || !match[1]) chat(channelID, '<@' + userID + '> hugs himself!');else if (!id) chat(channelID, '<@' + userID + '> couldn\'t find ' + name + ' in the room so he hugs himself!');else if (id == userID) chat(channelID, '<@' + userID + '> gives himself a big warm hug!');else if (id == bot.id) chat(channelID, 'I wuv you too, <@' + userID + '>');else chat(channelID, '<@' + userID + '> hugs <@' + id + '>!');
  } else if (message.match(/!joined .+/)) {
    var match = message.match(/!joined (.+)/);
    var id = idFromName(match[1]);
    if (id == null) chat(channelID, 'Couldn\'t find ' + match[1].replace(/[@<>]/g, '') + '!');else chat(channelID, '<@' + id + '> joined this discord ' + moment(mainServer.members[id].joined_at).fromNow() + '.');
  } else if (message == '!random') {
    sayRandomPost(channelID).catch(e => {
      throw e;
    });
  } else if (!! ~message.indexOf(bot.id)) {
    if (user == 'DemiPixel') chat(channelID, chooseRandom(['Talking about me, bby?', 'I\'m here, ya know :wink:', 'Hey <@' + userID + '> :heart:', 'Me? :wink:']));
  } else if (message.match(/!chat .+/)) {
    sayCleverBot(message.match(/!chat (.+)/)[1], channelID);
  } else if (!! ~message.toLowerCase().indexOf('med down')) {
    chat(channelID, 'MED DOWN EVERYBODY PUSH GOD DAMNIT');
  } else if (!! ~message.toLowerCase().indexOf('lmao') && user == 'DemiPixel') {
    chat(channelID, 'Stop fucking saying "lmao"');
  }

  var date = chrono.parseDate(message);
  if (date) {
    var m = moment(date);
    var str = '<@' + userID + '>: ' + m.tz('America/Los_Angeles').calendar() + ' PST, ';
  }
});

var sayRandomPost = (() => {
  var ref = _asyncToGenerator(function* (channelID) {
    const random_post = yield reddit.get_subreddit('tf2').get_random_submission();
    const link = 'https://www.reddit.com' + (yield random_post.permalink);
    chat(channelID, link);
  });

  return function sayRandomPost(_x) {
    return ref.apply(this, arguments);
  };
})();

var sayCleverBot = (str, channelID) => {
  clever.ask(str, (err, resp) => {
    if (err) console.log(err);else chat(channelID, resp.replace(/\*/g, '\\*'));
  });
};

function ParsePM(user, userID, channelID, message, rawEvent) {}