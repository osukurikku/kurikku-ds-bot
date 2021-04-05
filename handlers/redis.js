const { MessageEmbed } = require('discord.js');
const utils = require('../utils');
const axios = require('axios');

let oopsie = null;
try {
    oopsie = require("../private/anticheat/redis_handler");
} catch (e) {
    console.log("sorry you can't use this <3");
}

module.exports = {
    props: {
        db: null
    },
    execute: async (discordclient, channel, message) => {
        const ppmin = {0:120, 1:120, 2:200, 3:120}
        let values = module.exports;
        switch(channel){
            // {\"gm\": 0, \"user\": {\"username\": \"Shinki\", \"userID\": 1901, \"rank\": 126, \"oldaccuracy\": 90.74479675293, \"accuracy\": 90.802619934082, \"oldpp\": 1696, \"pp\": 1699}, \"score\": {\"scoreID\": 91043, \"mods\": 0, \"accuracy\": 0.8563218390804598, \"missess\": 1, \"combo\": 201, \"pp\": 46.480323791503906, \"rank\": 1, \"ranking\": null}, \"beatmap\": {\"beatmapID\": 523397, \"beatmapSetID\": 224175, \"max_combo\": 466, \"song_name\": \"Tomatsu Haruka - courage [Insane]\"}}W
            case "scores:new_score":
                if (oopsie !== null) {
                    oopsie.call(discordclient, channel, message);
                }
                scoreChannel = discordclient.config.channels.score_posting; 
                if (!scoreChannel) {
                    console.log("[Redis] Catched new score, but discord channel for scores is not specifed")
                    return;
                }
                try {
                    let score = JSON.parse(message);
                    if (score.score.pp<ppmin[score.gm]) return;
                    const embed = new MessageEmbed()
                        .setAuthor(`${score.user.username}`, `https://a.kurikku.pw/${score.user.userID}`, `https://kurikku.pw/u/${score.user.userID}`)
                        .setColor(0xffee58)
                        .setDescription(
`__New **${score.score.pp.toFixed(0)}pp** score!__ (o\´∀\`o)
${score.user.username} made new #${score.score.rank} epic score!
~ ${utils.getGM(score.gm)} • #${score.user.rank} • ${score.user.pp}pp • ${score.user.accuracy.toFixed(2)}%
~ ${((score.score.combo===score.beatmap.max_combo) ? `**FC (${score.beatmap.max_combo}x)**` : `*${score.score.combo}/${score.beatmap.max_combo}x*`) } • ${utils.getRank(score.score.ranking)} • ${utils.stringlifyMods(score.score.mods)} • **${(score.score.accuracy*100).toFixed(2)}%**
[${score.beatmap.song_name}](https://kurikku.pw/b/${score.beatmap.beatmapID})`
                            )
                        .setThumbnail(`https://assets.ppy.sh/beatmaps/${score.beatmap.beatmapSetID}/covers/list@2x.jpg`)
                        .setFooter('osu!Kurikku • today at '+utils.getDateTime())

                        discordclient.channels.get(scoreChannel).send(embed);
                } catch(err) {
                    console.error(err);
                    console.log("[Redis] Error while score parsing!")
                    break;
                }
                break;
            case "maps:new_request":
                batChannel = discordclient.config.channels.bat_channel;
                if (!batChannel) {
                    console.log("[Redis] Catched new map request, but discord channel for staff is not specified(")
                    return;
                }
                try {
                    let mapR = JSON.parse(message);                    
                    let userInfo = await axios.get("https://kurikku.pw/api/v1/users", {
                        params: {
                            id: mapR.Uid
                        }
                    })
                    if (userInfo.data.code != 200) {
                        throw Error("User corrupted")
                    }

                    let map = null;
                    switch (mapR.Type) {
                        case "b":
                            let mapResponse = await axios("https://osu.ppy.sh/api/get_beatmaps?k="+discordclient.config.authdata.peppy+"&b="+mapR.Bid)
                            map = Array.isArray(mapResponse.data) && mapResponse.data.length > 0 && mapResponse.data[0]
                            break;
                        case "s":
                            let mapResponse1 = await axios("https://osu.ppy.sh/api/get_beatmaps?k="+discordclient.config.authdata.peppy+"&s="+mapR.Bid)
                            map = Array.isArray(mapResponse1.data) && mapResponse1.data.length > 0 && mapResponse1.data[0]
                            break;
                        default:
                            throw Error("CAN'T IDENTIFY TYPE")
                    }

                    if (!map) {
                        throw Error("CAN'T IDENTIFY MAP")
                    }

                    const embed = new MessageEmbed()
                        .setAuthor(`${userInfo.data.username}`, null, `https://kurikku.pw/u/${mapR.Uid}`)
                        .setTitle(`**New ${(mapR.Type === "b") ? "beatmap" : "mapset" } has been requested**`)
                        .setColor(0xe26a6a)
                        .setDescription(
                            `**${userInfo.data.username}**(*${mapR.Uid}*) has map requested called **${map.artist} - ${map.title}${(map.length > 1) ? "" : ` [${map.version}]`}** created by **${map.creator}**
                            [Link to map](https://kurikku.pw/b/${map.beatmap_id})
                            [Link moderate](https://oadmin.kurikku.pw/index.php?p=124&bsid=${map.beatmapset_id})`
                            )
                        .setThumbnail(`https://assets.ppy.sh/beatmaps/${map.beatmapset_id}/covers/list@2x.jpg`)
                        .setFooter('osu!Kurikku • today at '+utils.getDateTime())
                    
                        discordclient.channels.get(batChannel).send("<@&514167453509615660> check this!", { embed });
                } catch(e) {
                    console.error(e);
                    console.log("[Redis] Error while map request parsing!")
                    break;
                }
                break;
        }
        //console.log(channel);
        //console.log(message);
        // LOL!
    }
}