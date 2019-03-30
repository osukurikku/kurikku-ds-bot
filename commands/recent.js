const axios = require("axios");
const { RichEmbed } = require('discord.js');
const utils = require('../utils');

module.exports = {
    name: 'recent',
    enabled: true,
    usage: "recent [username] [gamemode(optional)]",
    description: "With that command you can discover your last score",
    aliases: ['last', 'l', 'r'],
    execute: async (client, msg, args) => {
        let username = "";
        let mode = 0;
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
        
        let recent = await axios("https://kurikku.pw/api/get_user_recent?u=" + username + "&limit=1&type=string&m="+mode);
        if (recent.data.length<1) {
            msg.channel.send(new RichEmbed().setColor(0xffebee).setDescription("User not found!"));
            return;
        }
        recent = recent.data[0];

        let beatmap = await axios("https://osu.ppy.sh/api/get_beatmaps?k=" + client.config.authdata.peppy + "&b=" + recent.beatmap_id)
        if (beatmap.data.length<1) {
            msg.channel.send(new RichEmbed().setColor(0xffebee).setDescription("Beatmap not found!"));
            return;
        }
        beatmap = beatmap.data[0]
        const resultEmbed = new RichEmbed()
            .setColor(0xec407a)
            .setAuthor(username)
            .setDescription(`[⯈ ${beatmap.artist} - ${beatmap.title} [${beatmap.version}] by ${beatmap.creator} +${utils.stringlifyMods(recent.enabled_mods)}](https://kurikku.pw/b/${recent.beatmap_id})`)
            .addField('Score', utils.formatNumber(recent.score), true)
            .addField('Combo', ((recent.maxcombo===beatmap.max_combo) ? `**FC (${beatmap.max_combo}x)**` : `*${recent.maxcombo}/${beatmap.max_combo}x*`), true)
            .addField('PP', recent.pp, true)
            .addField('Rank', utils.getRank(recent.rank), true)
            .setFooter('osu!Kurikku')
            .setThumbnail(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapset_id}/covers/list@2x.jpg`);

        msg.channel.send(resultEmbed);
    }
}
