const fs = require('fs');
const Discord = require('discord.js');
const bot = require('./config.json');
const utils = require('./utils.js');
const shlex = require("shlex");
const redisHandler = require("./handlers/redis");
const mysql = require("mysql");
const restify = require('restify');
const submitMapHandler = require("./handlers/submitMap");
const submitBanOrRestrictHandler = require("./handlers/submitBanOrRestrict");
const { initDonations } = require("./handlers/donateHandler")

//============= LOW-DB PART ============== //
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('crystalDb.json');
const db = low(adapter);

db.defaults({ users: [] }).write();

redisHandler.props.db = db;

//============= MYSQL-DB PART ============== //

console.log("[MySql] connecting to mysql");

const PoolDB = mysql.createPool({
    host: bot.mysql.host,
    user: bot.mysql.login,
    password: bot.mysql.password,
    database: bot.mysql.db
});

bot.SQL = PoolDB

console.log("[MySql] connected");

//============= MYSQL-DB PART END ============== //

//============= RESTIFY PART ============== //

const server = restify.createServer({
    name: 'KurikkuBot',
    version: bot.version
});
  
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());

server.listen(bot.web.port, bot.web.host, ()=> {
    console.log(`[Restify|${server.name}] listening at ${server.url}`)
    submitMapHandler.props.server = server;
    submitMapHandler.props.dsClient = client;
    submitBanOrRestrictHandler.props.server = server;
    submitBanOrRestrictHandler.props.dsClient = client;
    server.app_config = bot;
})

server.get('/', (req, res, next)=> {
    res.send({'name': 'KurikkuBotApi', 'code': 200, 'msg': 'пожалуйста ебись отсюда конём, нахуй ты тут нужон'});
    return next();
})

server.get("/api/v1/submitMap", submitMapHandler.execute)
server.get("/api/v1/submitBanOrRestrict", submitBanOrRestrictHandler.execute)

//=============== RESTIFY PART END ============== //

// ========== DISCORD PART ============= //

const client = new Discord.Client();

// Here we go!
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
let filesCommands = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

filesCommands.forEach((file) => {
    const command = require("./commands/"+file);

    client.commands.set(command.name, command)
    command.aliases.forEach((el)=>{
        client.aliases.set(el, command)    
    })
})

client.on('ready', async () => {
    console.log(`[System] Loaded ${client.commands.keyArray().length} commands`);
    console.log(`[Discord] Logged in as ${client.user.tag}! Bot version: ${bot.version}`);
    
    client.user.setPresence({
        game: {
            name: "osu!Kurikku"
        },
        status: "online"
    }).catch((error)=> {
        console.log("[Discord] Error while setting presence!");
    })

    client.db = db;
    //redisHandler.execute(client, "scores:new_score", '{\"gm\": 0, \"user\": {\"username\": \"Shinki\", \"userID\": 1901, \"rank\": 126, \"oldaccuracy\": 90.74479675293, \"accuracy\": 90.802619934082, \"oldpp\": 1696, \"pp\": 1699}, \"score\": {\"scoreID\": 91043, \"mods\": 72, \"accuracy\": 0.8563218390804598, \"missess\": 1, \"combo\": 450, \"pp\": 46.480323791503906, \"rank\": 1, \"ranking\": \"SSH\"}, \"beatmap\": {\"beatmapID\": 523397, \"beatmapSetID\": 224175, \"max_combo\": 466, \"song_name\": \"Tomatsu Haruka - courage [Insane]\"}}') // DEBUG!
})

client.on('message', (msg) => {
    messageHandler(msg);
})

client.on('error', (error)=> {
    console.log("[System] Processed fatal error! I will exit from this world! (O.^_^.O)");
    console.log(error);
    client.user.setPresence({status: 'invisible'}).catch(console.error);
    client.destroy();
    process.exitCode = 1;
})

client.on('disconnect', (event)=> {
    console.log("[Discord] Disconnected from discord server!");
    console.log("[System] Processed fatal error! I will exit from this world! (O.^_^.O)");
    client.destroy().catch(console.error);
    process.exitCode = 1;
})

client.cd = new Discord.Collection(); // Initialize CoolDowns, just i likes calls CoolDowns - cd ;D
client.utils = utils;
client.config = bot;

async function messageHandler(message) {
    if (!message.content.startsWith(bot.prefix) || message.author.bot) return;

    let textSheet = shlex.split(message.content.slice(bot.prefix.length));
    let commandd = textSheet[0];
    let args = textSheet.slice(1);

    let command = client.commands.get(commandd);
    if (!command) {
        // Trying aliases
        let alias = client.aliases.get(commandd);
        if (!alias) {
            return;
        } else {
            command = alias;
        }
    }
    if (!command.enabled) return;

    let author = message.author.id;
    let nowTime = Math.floor(Date.now() / 1000);

    let cdUser = client.cd.get(author);
    if (cdUser) { // If user wrote something when bot runned
        if ( nowTime - cdUser.lastMessage <= bot.cooldown ) { // Checking users cooldown
            message.reply(`Please, wait ${nowTime - cdUser.lastMessage} sec. before executing this command!`)
            client.cd.set(author, { lastMessage: nowTime });
            return;
        }
        client.cd.set(author, { lastMessage: nowTime });
    } else { // If user not write something after bot running
        client.cd.set(author, { lastMessage: nowTime });
    }

    console.log(`[Commands] bomj ${message.author.id} - '${command.name}'$'${args.join('|')}'`)

    try {
        command.execute(client, message, args);
    } catch (error) {
        console.error(error);
        message.reply("Please say hello to admin. He should fix that error!")
    }
}

client.login(bot.authdata.discordToken).catch(console.error);

// =============== DISCORD PART END ============= //


//============= Donate Handler PART ============= //

console.log("[Donates] inited")
initDonations(client, bot);

//============= Donate Handler PART END ============= //


// =============== REDIS PART ============= //

const redis = require("redis"),
    clientRedis = redis.createClient({
        host: bot.redis.host,
        port: bot.redis.port,
        password: bot.redis.password,
        db: bot.redis.db
    });

clientRedis.on("message", (chan, msg) => {
    redisHandler.execute(client, chan, msg);
})

clientRedis.subscribe("scores:new_score");

// ============ REDIS PART END ============= //

// ============ My pure js and things ============= //

// call private module if exists
try {
    const privateThings = require("./private/index");
    privateThings.init(client);
} catch (e) {
    console.log("[Private] Hey! It seems that you are using the public version from the github, well, use it further (✿◠‿◠) 〜")
}

console.logCopy = console.log.bind(console);

console.log = function (data) {
    const d = new Date();
    const currentDate = "[" + ("0" + d.getHours()).slice(-2) + ":" +
        ("0" + d.getMinutes()).slice(-2) + ":" +
        ("0" + d.getSeconds()).slice(-2) + "]";

    this.logCopy(currentDate, data);
};

// ============= My part is end ============= //