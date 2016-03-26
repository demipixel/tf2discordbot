const config = require('config');
const DiscordClient = require('discord.io');
const moment = require('moment');
const Snoowrap = require('snoowrap');
const emoji = require('node-emoji');
const CleverBot = require('cleverbot.io');
const chrono = require('chrono-node')
const mathjs = require('mathjs');

const bot = new DiscordClient({
    autorun: true,
    email: config.get('discord.email'),
    password: config.get('discord.password'),
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
const idFromName = (name) => {
  name = name.replace(/[@<>]/g, '').toLowerCase();
  return Object.keys(mainServer.members).reduce((chosen, id) => {
    return (mainServer.members[id].user.username || '').toLowerCase() == name || id == name ? id : chosen;
  }, null);
}
const channelFromName = (name) => {
  return Object.keys(mainServer.channels).reduce((chosen, id) => {
    return mainServer.channels[id].name == name ? id : chosen;
  }, null);
}
const chooseRandom = (arr) => {
  return arr[Math.floor(Math.random()*arr.length)];
}
const DEMIPIXEL_ID = '125696820901838849';
const DEMI_SEND = ['lmao', 'stfu', 'kid', 'fucking bot', 'FUCK'];
const DEMI_RESPOND = ['Stop fucking saying "lmao"', 'no you', 'bitch', 'dumbass human', 'YOURSELF'];

bot.on('ready', function() {
    console.log(bot.username + ' [' + bot.id + '] has started up!');
    mainServer = bot.servers[config.get('discord.server')];
});

var REDDIT_MATCH = /https?:\/\/www\.reddit\.com\/r\/([^/]+)\/comments\/([^/]+)\//;

bot.on('message', function(user, userID, channelID, message, rawEvent) {
  var channel = mainServer.channels[channelID];
  if (!channel) channel = bot.directMessages[channelID];
  var pm = !channel.name;
  if (!pm) console.log('['+userID+']', user, channel.name+':', message);
  else console.log('['+userID+']', user, 'PM:', message);
  if (userID == bot.id) return;
  if (pm) parsePM(user, userID, channelID, message, rawEvent);

  var math = null;
  var mathError = null;
  try {
    math = mathjs.eval(message.replace('!debug ', '').trim(), {});
  } catch (e) {
    mathError = e;
  }

  if (message == '!hey') {
    chat(channelID, 'Hey there, <@'+userID+'>!');
  } else if (message == '!info') {
    chat(channelID, 'Hey! I\'m the /r/tf2 Discord Bot created by <@'+DEMIPIXEL_ID+'>! Send any suggestions or feedback to him :)');
  } else if (message == '!hug' || message.indexOf('!hug ') == 0) {
    var match = message.match(/!hug (.*)/);
    var name = (match ? match[1] : '').replace(/[@<>]/g, '');
    var id = idFromName(name);
    if (!match || !match[1]) chat(channelID, '<@'+userID+'> hugs himself!');
    else if (!id) chat(channelID, '<@'+userID+'> couldn\'t find '+name+' in the room so he hugs himself!');
    else if (id == userID) chat(channelID, '<@'+userID+'> gives himself a big warm hug!');
    else if (id == bot.id) chat(channelID, 'I wuv you too, <@'+userID+'>');
    else chat(channelID, '<@'+userID+'> hugs <@'+id+'>!');
  } else if (message.match(/!joined .+/)) {
    var match = message.match(/!joined (.+)/);
    var id = idFromName(match[1]);
    if (id == null) chat(channelID, 'Couldn\'t find '+match[1].replace(/[@<>]/g, '')+'!');
    else chat(channelID, '<@'+id+'> joined this discord '+moment(mainServer.members[id].joined_at).fromNow()+'.');
  } else if (message == '!random') {
    sayRandomPost(channelID).catch(e=>{throw e;});
  } else if (!!~message.indexOf(bot.id)) {
    if (user == 'DemiPixel') chat(channelID, chooseRandom(['Talking about me, bby?', 'I\'m here, ya know :wink:', 'Hey <@'+userID+'> :heart:', 'Me? :wink:']));
  } else if (message.match(/^!chat .+/)) {
    sayCleverBot(message.match(/!chat (.+)/)[1], userID, channelID);
  } else if (!!~DEMI_SEND.indexOf(message.toLowerCase()) && user == 'DemiPixel') {
    chat(channelID, DEMI_RESPOND[DEMI_SEND.indexOf(message.toLowerCase())]);
  } else if (message.indexOf('!main ') == 0 || message == '!main') {
    var sel = message.trim() == '!main' ? userID : message.match(/!main (.+)/)[1];
    var classList = ['none', 'scout', 'soldier', 'pyro', 'demo', 'heavy', 'engi', 'med', 'sniper', 'spy', 'civilian', 'dispenser', 'tele', 'sentry'];
    var chosenClass = classList.reduce((s, curr, ind) => {
      return sel.toLowerCase().indexOf(curr) == '0' ? ind : s;
    }, null);
    if (chosenClass == null) {
      var id = idFromName(sel);
      if (id == null) {
        chat(channelID, 'Couldn\'t find '+sel.replace(/[@<>/g]/g, '')+'!');
      } else {
        var theirClass = localData.user(id).classMain;
        if (theirClass === undefined) chat(channelID, '<@'+id+'> has not set a main!');
        else chat(channelID, '<@'+id+'> mains '+classList[theirClass]);
      }
    } else {
      if (chosenClass == 0) {
        delete localData.user(userID).classMain;
        localData.save();
        chat(channelID, '<@'+userID+'> is no longer maining any class!');
      } else {
        localData.user(userID).classMain = chosenClass;
        localData.save();
        chat(channelID, '<@'+userID+'> is now a '+sel+' main!');
      }
    }
  } else if ((math !== null || message.indexOf('!debug') == 0) && (math ? math.toString() : '') != message.replace(/"/g, '')) {
    var show = message.indexOf('!debug') == 0;
    sayMath(userID, message, math, show ? mathError : null, channelID, show);
  } else if (message == '!git') {
    chat(channelID, 'https://github.com/demipixel/tf2discordbot');
  } else if (message == '!help') {
    chat(channelID, '`!hey, !info, !hug <user>, !joined <user>, !random, !chat <message>, med down, !main <user>, !main <class>, any math expression, !debug <math expr>`');
  } else if (message.match(/((scout|soli|sold|pyro|demo|heavy|engi|med|sniper|spy)[^ ]{0,15}) down/i)) {
    var match = message.match(/((scout|soli|sold|pyro|demo|heavy|engi|med|sniper|spy)[^ ]{0,15}) down/i);
    match[2] = match[2].toLowerCase();
    if (match[2] == 'sold') match[2] = 'soli';
    var str = ({
      scout: 'My dream is to be in a highlander match and for the enemy mumble to say "Watch out for the scout".',
      soli: 'SON OF A CUSSING CUSS WORD',
      pyro: 'BAD CLASS DOWN',
      demo: '%CLASS% TAKES SKILL',
      heavy: '%CLASS% DOWN, GET THE MED!!!!',
      engi: 'DISPENSER DOWN EVERYBODY PUSH',
      med: '%CLASS% DOWN EVERYBODY PUSH GOD DAMNIT',
      sniper: 'ONLY '+(Math.floor(Math.random()*10)+2)+' %CLASS%S LEFT',
      spy: 'No one gives a fuck.'
    })[match[2]];
    chat(channelID, str.replace('%CLASS%', match[1].toUpperCase()));
  }

  /*var date = chrono.parseDate(message);
  if (date) {
    var m = moment(date);
    var str = '<@'+userID+'>: '+m.tz('America/Los_Angeles').calendar()+' PST, '
  }*/
});

var sayRandomPost = async (channelID) => {
  const random_post = await reddit.get_subreddit('tf2').get_random_submission();
  const link = 'https://www.reddit.com' + (await random_post.permalink);
  chat(channelID, link);
}

var sayCleverBot = (str, userID, channelID) => {
  clever.ask(str, (err, resp) => {
    if (err) {
      console.log(err);
      chat(channelID, '<@'+userID+'>, I don\'t know how to respond...');
    }
    else chat(channelID, '<@'+userID+'>, '+resp.replace(/\*/g, '\\*'));
  });
}

var sayMath = (userID, str, math, mathError, channelID, debug) => {
  if (mathError) {
    chat(channelID, '<@'+userID+'>: '+mathError);
    return;
  } else if (math == null) return;
  else if (str == 'e' && !debug) return;
  if (math.entries) {
    math = math.entries;
    var output = math.reduce((str, m) => {
      if (typeof m != 'function' || debug) return str + m.toString() + '\n';
      else return str;
    }, '');
    output = output.trim();
    if (output) chat(channelID, '<@'+userID+'>\n'+output);
  } else if (typeof math != 'function' || debug) {
    chat(channelID, '<@'+userID+'>: '+math);
  }
}

function parsePM(user, userID, channelID, message, rawEvent) {
  if (userID != DEMIPIXEL_ID) return;
  if (message.indexOf('say ') == 0) {
    var match = message.match(/say ([^ ]+) (.+)/);
    if (!match) {
      chat(userID, 'Format: `say <channel> <message>`');
      return;
    }
    var channel = channelFromName(match[1]);
    if (!channel) {
      chat(userID, 'That is not a valid channel!');
      return;
    }
    chat(channel, match[2]);
  }
}