const axios = require("axios");
const { RichEmbed } = require('discord.js');
const utils = require('../utils');

module.exports = {
    props: {
        dsClient: null,
        server: null
    },
    execute: async (req, res, next) => {
        const values = module.exports.props;
        if (!req.query.token || !req.query.poster || !req.query.bid && !req.query.sid || !req.query.type) {
            res.send({
                code: 400,
                msg: 'One of parameters is undefined!'
            })
            return next();
        }

        if (req.query.token != values.dsClient.config.web.token) {
            res.send({
                code: 400,
                msg: 'Not authed'
            })
            return next();
        }

        let map = null;
        let postingChannel = values.dsClient.config.channels.map_posting;
        if (req.query.bid) {
            let mapResponse = await axios("https://osu.ppy.sh/api/get_beatmaps?k="+values.dsClient.config.authdata.peppy+"&b="+req.query.bid)
            map = mapResponse.data
        }
        if (req.query.sid) {
            let mapResponse = await axios("https://osu.ppy.sh/api/get_beatmaps?k="+values.dsClient.config.authdata.peppy+"&s="+req.query.sid)
            map = mapResponse.data
        }
        if (!map) {
            res.send({
                code: 201,
                msg: 'Error while map parsing'
            })
            return next();
        }

        const embed = new RichEmbed()
            .setAuthor(`${req.query.poster}`, null, `https://kurikku.pw/u/${req.query.poster}`)
            .setTitle(`**New ${(req.query.bid) ? "beatmap" : "mapset" } has been ${req.query.type}d**`)
            .setColor(0x43a047)
            .setDescription(
                `${req.query.poster} has ${req.query.type}d the ${(req.query.bid) ? "beatmap" : "mapset" } called **${map[0].artist} - ${map[0].title}${(map.length > 1) ? "" : ` [${map[0].version}]`}** created by **${map[0].creator}**
                [Link to map](https://kurikku.pw/b/${map[0].beatmap_id})`
                )
            .setThumbnail(`https://assets.ppy.sh/beatmaps/${map[0].beatmapset_id}/covers/list@2x.jpg`)
            .setFooter('osu!Kurikku • today at '+utils.getDateTime())
        values.dsClient.channels.get(postingChannel).send(embed);

        res.send({
            code: 200,
            msg: "sended!"
        });
        return next();
    }
}