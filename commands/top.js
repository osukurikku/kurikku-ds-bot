const axios = require("axios");
const { MessageEmbed } = require('discord.js');
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
        
        let user = await axios("https://kurikku.pw/api/get_user_best?u=" + username + "&limit=3&type=string&m="+mode);
        if (user.data.length<1) {
            msg.channel.send(new MessageEmbed().setColor(0xffebee).setDescription("User not found!"));
            return;
        }
        
        // Just re-maked code of 4Fun
        const resultEmbed = new MessageEmbed()
            .setColor(0x4fc3f7)
            .setAuthor("Top-3 score "+username)
            .setDescription("**Last Top-3 scores of that player**");
        
        let rank = 1;
        for(let r of user.data) {
            //let r = user.data[x];
            let mods = utils.stringlifyMods("enabled_mods" in r ? r.enabled_mods : 0);
            let acc, totalPoints, totalHits;
            switch (+mode) {
                case 0:
                    totalPoints = (+r.count50)*50+(+r.count100)*100+(+r.count300)*300;
                    totalHits = (+r.count300)+(+r.count100)+(+r.count50)+(+r.countmiss);
                    acc = (totalHits === 0) ? 1 : totalPoints/(totalHits*300);
                    break;
                case 1:
                     totalPoints = (+r.count100*50)+(+r.count300*100);
                     totalHits = (+r.countmiss)+(+r.count100)+(+r.count300);
                    acc = totalPoints / (totalHits * 100);
                    break
                case 2:
                    totalHits = (+r.count300)+(+r.count100)+(+r.count50);
                    totalPoints = totalHits+(+r.countmiss)+(+r.countkatu);
                    acc = (totalPoints === 0) ? 1 : totalHits / totalPoints;
                    break;
                case 3:
                    totalPoints = (+r.count50)*50+(+r.count100)*100+(+r.countkatu)*200+(+r.count300)*300+(+r.countgeki)*300;
                    totalHits = (+r.countmiss)+(+r.count50)+(+r.count100)+(+r.count300)+(+r.countgeki)+(+r.countkatu);
                    acc = totalPoints / (totalHits * 300);
                    break;
                default:
                    acc = 0;
                    break;
            }
            let beatmap = await axios("https://osu.ppy.sh/api/get_beatmaps?k=" + client.config.authdata.peppy + "&b=" + r.beatmap_id)
            
            let bm = beatmap.data[0];
            resultEmbed.addField(`#${rank}`, `${bm.artist} - ${bm.title} [${bm.version}]
✩: **${Math.round((+bm.difficultyrating) * 100) / 100}**
Gived: **${Math.round((+r.pp) * 100) / 100}pp**
Rank: ${utils.getRank(r.rank)}
Mods: ${mods}
Combo: ${r.maxcombo}/${bm.max_combo}x
Accuracy: ${(acc*100).toFixed(2)}%
[Link to map](https://kurikku.pw/b/${r.beatmap_id})`);
                            
            rank+=1;
        }
        
        msg.channel.send(resultEmbed);
    }
}
