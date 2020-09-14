const http = require('http');
const Discord = require('discord.js');
const redis = require('redis');
const dotenv = require('dotenv');
const { url } = require('inspector');
dotenv.config();

var redisClient = redis.createClient(process.env.REDIS_URL);
var discordClient = new Discord.Client();

const ONY_TIMER = 6;
const NEF_TIMER = 8;
const REND_TIMER = 3;

const realms = [
    'Golemagg',
    'Zandalar Tribe'
];

const factions = [
    'Alliance',
    'Horde'
];

function formatTimer(name, timer, checkTimer) {
    let now = new Date();
    let text = name + ': ';

    if (timer && (timer.getTime() > now.getTime() || !checkTimer)) {
        let hh = timer.getHours();
        let mm = timer.getMinutes();
        if (hh < 10) {
            hh = '0' + hh;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        text += hh + ':' + mm;
    } else {
        text += 'no timer';
    }
    return text;
}

function setRealmForServer(server, realm) {
    realmLowerCase = realm.toLocaleLowerCase();
    for (i = 0; i < realms.length; i++) {
        if (realms[i].toLowerCase() === realmLowerCase) {
            redisClient.set('server-realm-' + server, realmLowerCase);
            return true;
        }
    }
    return false;
}

function setFactionForServer(server, faction) {
    factionLowerCase = faction.toLocaleLowerCase();
    for (i = 0; i < factions.length; i++) {
        if (factions[i].toLowerCase() === factionLowerCase) {
            redisClient.set('server-faction-' + server, factionLowerCase);
            return true;
        }
    }
    return false;
}

function getRedisKey(realm, faction) {
    return ('realm_' + realm + '_' + faction).split(' ').join('_').toLowerCase();
}

discordClient.on('ready', () => {
    console.log(`Logged in to Discord as ${discordClient.user.tag}!`);
});

discordClient.on('message', msg => {
    const setRealmCmd = 'wb set realm=';
    const setFactionCmd = 'wb set faction=';

    if (msg.content === 'wb help') {
        msg.reply('type: ' + setRealmCmd + 'YOUR REALM and ' + setFactionCmd + 'YOUR FACTION');
    } else if (msg.content.startsWith(setRealmCmd)) {
        var realm = msg.content.substring(setRealmCmd.length).trim();
        if (setRealmForServer(msg.guild.id, realm)) {
            msg.reply(`Realm for ${msg.guild.id} set to ${realm}!`);
        } else {
            msg.reply(`Unknown realm ${realm}!`);
        }
    } else if (msg.content.startsWith(setFactionCmd)) {
        var faction = msg.content.substring(setFactionCmd.length).trim();
        if (setFactionForServer(msg.guild.id, realm)) {
            msg.reply(`Faction for ${msg.guild.id} set to ${faction}!`);
        } else {
            msg.reply(`Unknown faction ${faction}!`);
        }
    } else if (msg.content === 'wb who is best shaman') {
        msg.reply('Furryhoof is the best shaman I know!');
    } else if (msg.content === 'wb') {
        // redis client does not support await/async
        redisClient.get('server-realm-' + msg.guild.id, (err, realm) => {
            if (!realm) {
                realm = 'Zandalar Tribe';
            }

            redisClient.get('server-faction-' + msg.guild.id, (err, faction) => {
                if (!faction) {
                    faction = 'Horde';
                }

                redisClient.get(getRedisKey(realm, faction), (err, reply) => {
                    if (!reply) {
                        msg.reply('no timer data for ' + realm + ' ' + faction + ' :(');
                        return;
                    }
                    realmData = JSON.parse(reply);
        
                    var onyTimer = new Date((realmData.onyTimer + (ONY_TIMER * 3600)) * 1000);
                    var nefTimer = new Date((realmData.nefTimer + (NEF_TIMER * 3600)) * 1000);
                    var rendTimer = new Date((realmData.rendTimer + (REND_TIMER * 3600)) * 1000);
        
                    msg.reply([
                        realm,
                        faction,
                        formatTimer('Ony', onyTimer, true),
                        formatTimer('Nef', nefTimer, true),
                        formatTimer('Rend', rendTimer, true),
                        formatTimer('Updated', new Date(realmData.updated * 1000), false)
                    ].join(' '));
                });
            });
        });
    }
});

redisClient.on('connect', () => {
    console.log('Connected to redis');
});

discordClient.login(process.env.DISCORD_TOKEN);

const server = http.createServer((request, response) => {
    if (request.method === 'POST') {
        console.log('POST');
        var body = '';
        request.on('data', (data) => {
            body += data;
        })
        request.on('end', () => {
            let json = body;
            console.log('Body: ' + body);
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('post received');

            let clientData = JSON.parse(json);

            realms.forEach((realm) => {
                factions.forEach((faction) => {
                    if (typeof clientData[realm] !== 'undefined' && typeof clientData[realm][faction] !== 'undefined') {
                        realmData = clientData[realm][faction];
                        // todo check data structure before saving and parse each fields
                        // todo check client data is not outdated?
                        // todo check client timers may differ for few seconds?
                        // todo check client timezone?

                        realmData.updated = parseInt(Math.round(Date.now() / 1000), 10);
                        redisClient.set(getRedisKey(realm, faction), JSON.stringify(realmData));
                    }
                })
            });

        })
    } else {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');

        let urlParts = request.url.split('/', 3);
        if (urlParts.length === 3) {

            let realm = urlParts[1];
            let faction = urlParts[2];

            // todo check data validity
            
            redisClient.get(getRedisKey(realm, faction), (err, reply) => {
                if (!reply) {
                    let = data = {};
                    data.message = 'no timer data for ' + realm + ' ' + faction + ' :(';
                    response.end(JSON.stringify(data));
                    return;
                }

                response.end(reply);
            });
        } else {
            response.end('{}');
        }
    }
});

server.listen(process.env.PORT || 8080, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
