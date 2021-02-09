const axios = require("axios");
const { RichEmbed } = require('discord.js');
const utils = require('../utils');
const secretUtils = require("../private/utils");

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
        try {
            let recent = await axios.get("https://kurikku.pw/api/v1/users/scores/recent", {
                params: {
                    name: username,
                    mode: mode
                }
            })

            let userTop = await axios.get("https://kurikku.pw/api/v1/users/scores/best", {
                params: {
                    name: username,
                    mode: mode,
                    limit: 100
                }
            })
            
            if ((!('scores' in recent.data) || recent.data['scores'].length < 1) || (!('scores' in userTop.data) || userTop.data['scores'].length < 1)) throw Exception("");
            recent = recent.data['scores'][0];

            let topBeatIds = []
            for (let x of userTop.data["scores"]) {
                topBeatIds.push(x.beatmap.beatmap_id);
            } 

            let resultEmbed = new RichEmbed()
                .setColor(0xec407a)
                .setAuthor(username)
                .setDescription(`[⯈ ${recent.beatmap.song_name}] +${utils.stringlifyMods(recent.mods)}](https://kurikku.pw/b/${recent.beatmap.beatmap_id})`)
                .addField('⯈ Score', utils.formatNumber(recent.score), true)
                .addField('⯈ Combo', ((recent.max_combo===recent.beatmap.max_combo) ? `**FC (${recent.beatmap.max_combo}x)**` : `*${recent.max_combo}/${recent.beatmap.max_combo}x*`), true)
                .setThumbnail(`https://assets.ppy.sh/beatmaps/${recent.beatmap.beatmapset_id}/covers/list@2x.jpg`);

            if (+mode === 0) {
                let mapStat = await secretUtils.getCoolMapStat(recent.beatmap.beatmap_id,
                    recent.mods,
                    recent.max_combo,
                    recent.accuracy,
                    recent.count_miss) // calling for secret stuff(only for std now)

                resultEmbed.setDescription(`${resultEmbed.description} [★ ${mapStat.data.stats.star.pure}]\n(${Math.round(mapStat.data.stats.bpm.api)} BPM)`)
                            .addField('⯈ PP', `${recent.pp} (100%:${mapStat.data.pp.acc["100"]}, 99%:${mapStat.data.pp.acc["99"]}, 95%:${mapStat.data.pp.acc["95"]}, 90%:${mapStat.data.pp.acc["90"]}, 80%:${mapStat.data.pp.acc["80"]})`, false)

            } else {
                resultEmbed.addField('⯈ PP', recent.pp, true)
            }
            //msg.channel.send("<:hit300:764220170603331595>")
            resultEmbed.addField("⯈ Hits", `[<:hit300:764220055818338324>${recent.count_300}/<:hit100:764220096594968576>${recent.count_100}/<:hit50:764220115839090688>${recent.count_50}/<:hit0:764220129273708564>${recent.count_miss}]`, true)
                        .addField('⯈ Rank', utils.getRank(recent.rank), false)
                        .setFooter(`osu!Kurikku${(topBeatIds.indexOf(recent.beatmap.beatmap_id) != -1) ? ` | This score is #${topBeatIds.indexOf(recent.beatmap.beatmap_id)+1} in user top-100` : ""}`)
            
            msg.channel.send(resultEmbed);
        } catch (e) {
           msg.channel.send("Not found!")
        }        
    }
}
