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
                msg.channel.send("Your account is not setted. If you want watch some user write `!recent <nickname>`");
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
        
        // Just re-maked code of 4Fun, that code maybe can be cleaner
        // TODO: make this code more clear!

        let r1 = user.data[0];
        let r2 = user.data[1];
        let r3 = user.data[2];

        let mods = utils.stringlifyMods(r1.enabled_mods);
        let mods2 = utils.stringlifyMods(r2.enabled_mods);
        let mods3 = utils.stringlifyMods(r3.enabled_mods);
        let acc = 100 * (+r1.count300) * 6 + (+r1.count100) * 2 + (+r1.count50) / (6 * ((+r1.count300) + (+r1.count100) + (+r1.count50) + (+r1.countmiss)));
        let acc2 = 100 * (+r2.count300) * 6 + (+r2.count100) * 2 + (+r2.count50) / (6 * ((+r2.count300) + (+r2.count100) + (+r2.count50) + (+r2.countmiss)));
        let acc3 = 100 * (((+r3.count300)) * 6 + ((+r3.count100)) * 2 + (+r3.count50)) / (6 * ((+r3.count300) + (+r3.count100) + (+r3.count50) + (+r3.countmiss)));
        
        const beatmap1 = await axios("https://osu.ppy.sh/api/get_beatmaps?k=" + client.config.authdata.peppy + "&b=" + r1.beatmap_id); 
        const beatmap2 = await axios("https://osu.ppy.sh/api/get_beatmaps?k=" + client.config.authdata.peppy + "&b=" + r1.beatmap_id); 
        const beatmap3 = await axios("https://osu.ppy.sh/api/get_beatmaps?k=" + client.config.authdata.peppy + "&b=" + r1.beatmap_id); 

        let bm1 = beatmap1.data[0];
        let bm2 = beatmap2.data[0];
        let bm3 = beatmap3.data[0];

        const resultEmbed = new RichEmbed()
            .setColor(0x4fc3f7)
            .setAuthor("Top-3 score "+username)
            .setDescription("**Last Top-3 scores of that player**")
            .addField("#1", `${bm1.artist} - ${bm1.title} [${bm1.version}]
            ✩: **${Math.round((+bm1.difficultyrating) * 100) / 100}**
            Gived: **${Math.round((+r1.pp) * 100) / 100}pp**
            Rank: ${utils.getRank(r1.rank)}
            Mods: ${mods}
            Combo: ${r1.maxcombo}/${bm1.max_combo}x
            Accuracy: ${Math.round((+acc) * 100) / 100}
            [Link to map](https://kurikku.pw/b/${r1.beatmap_id})`)

            .addField("#2", `${bm2.artist} - ${bm2.title} [${bm2.version}]
            ✩: **${Math.round((+bm2.difficultyrating) * 100) / 100}**
            Gived: **${Math.round((+r2.pp) * 100) / 100}pp**
            Rank: ${utils.getRank(r2.rank)}
            Mods: ${mods2}
            Combo: ${r2.maxcombo}/${bm2.max_combo}x
            Accuracy: ${Math.round((+acc2) * 100) / 100}
            [Link to map](https://kurikku.pw/b/${r2.beatmap_id})`)

            .addField("#3", `${bm3.artist} - ${bm3.title} [${bm3.version}]
            ✩: **${Math.round((+bm3.difficultyrating) * 100) / 100}**
            Gived: **${Math.round((+r3.pp) * 100) / 100}pp**
            Rank: ${utils.getRank(r3.rank)}
            Mods: ${mods3}
            Combo: ${r3.maxcombo}/${bm3.max_combo}x
            Accuracy: ${Math.round((+acc3) * 100) / 100}
            [Link to map](https://kurikku.pw/b/${r3.beatmap_id})`)
        
        msg.channel.send(resultEmbed);
    }
}