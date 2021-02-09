const { RichEmbed } = require('discord.js');
const utils = require('../utils');

try {
    const oopsie = require("../private/anticheat/redis_handler");
} catch (e) {
    const oopsie = null;
    console.log("sorry you can't use this <3");
}

module.exports = {
    props: {
        db: null
    },
    execute: (discordclient, channel, message) => {
        const ppmin = {0:120, 1:120, 2:200, 3:120}
        let values = module.exports;
        switch(channel){
            // {\"gm\": 0, \"user\": {\"username\": \"Shinki\", \"userID\": 1901, \"rank\": 126, \"oldaccuracy\": 90.74479675293, \"accuracy\": 90.802619934082, \"oldpp\": 1696, \"pp\": 1699}, \"score\": {\"scoreID\": 91043, \"mods\": 0, \"accuracy\": 0.8563218390804598, \"missess\": 1, \"combo\": 201, \"pp\": 46.480323791503906, \"rank\": 1, \"ranking\": null}, \"beatmap\": {\"beatmapID\": 523397, \"beatmapSetID\": 224175, \"max_combo\": 466, \"song_name\": \"Tomatsu Haruka - courage [Insane]\"}}W
            case "scores:new_score":
                scoreChannel = discordclient.config.channels.score_posting; 
                if (!scoreChannel) {
                    console.log("[Redis] Catched new score, but discord channel for scores is not specifed")
                    return;
                }
                try {
                    let score = JSON.parse(message);
                    if (score.score.pp<ppmin[score.gm]) return;
                    const embed = new RichEmbed()
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

                if (oopsie !== null) {
                    oopsie.call(discordclient, channel, message);
                }
                break;
        }
        //console.log(channel);
        //console.log(message);
        // LOL!
    }
}