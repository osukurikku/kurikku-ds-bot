const axios = require("axios");
const { RichEmbed } = require('discord.js');
const utils = require('../utils');

module.exports = {
    name: 'top',
    description: "Top-3 player scores",
    usage: "top [username] [mode(optional)]",
    enabled: true,
    aliases: ['t'],
    execute: async (client, msg, args) => {
        let mode = 0;
        let username = "";
        let userDB = client.db.get("users").find({ id: msg.author.id }).value();
        if (!userDB) {
            if (args.length<1) {
                msg.channel.send("Your account is not setted. To setup use `!sn <nickname>`");
                return;
            }
            username = args[0];
            if (args.length>1) {
                mode = args[1];
            }
        } else {
            if(args.length>0) {
                username = args[0];
                if (args.length>1) {
                    mode = args[1];
                }
            } else {
                username = userDB.username;
                mode = userDB.mode;
            }
        }
        
        let user = await axios("https://kotorikku.ru/api/get_user_best?u=" + username + "&limit=3&type=string&m="+mode);
        if (user.data.length<1) {
            msg.channel.send(new RichEmbed().setColor(0xffebee).setDescription("User not found!"));
            return;
        }
        
        // Just re-maked code of 4Fun
        const resultEmbed = new RichEmbed()
            .setColor(0x4fc3f7)
            .setAuthor("Top-3 score "+username)
            .setDescription("**Last Top-3 scores of that player**");
        
        let rank = 1;
        user.data.forEach(async (el) => {
            let r = el;
            let mods = utils.stringlifyMods(r.enabled_mods);
            let acc = 100 * (+r.count300) * 6 + (+r.count100) * 2 + (+r.count50) / (6 * ((+r.count300) + (+r.count100) + (+r.count50) + (+r.countmiss)));
            let beatmap = await axios("https://osu.ppy.sh/api/get_beatmaps?k=" + client.config.authdata.peppy + "&b=" + r.beatmap_id); 
            
            let bm = beatmap.data[0];

            resultEmbed.addField(`#${rank}`, `${bm.artist} - ${bm.title} [${bm.version}]
✩: **${Math.round((+bm.difficultyrating) * 100) / 100}**
Gived: **${Math.round((+r.pp) * 100) / 100}pp**
Rank: ${utils.getRank(r.rank)}
Mods: ${mods}
Combo: ${r.maxcombo}/${bm.max_combo}x
Accuracy: ${Math.round((+acc) * 100) / 100}
[Link to map](https://kurikku.pw/b/${r.beatmap_id})`);

            rank+=1;
        });
        
        msg.channel.send(resultEmbed);
    }
}