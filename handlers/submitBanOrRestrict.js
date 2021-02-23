const { RichEmbed } = require('discord.js');
const utils = require('../utils');

const messages = {
    0: "has been restricted",
    1: "has been banned",
    2: "has been unrestricted",
    3: "has been unbanned"
}

module.exports = {
    props: {
        dsClient: null,
        server: null
    },
    execute: (req, res, next) => {
        // Nickname who make ban
        // Nickname who banned
        // Type (0 - restrict 1 - ban, 2 - unrestrict, 3 - unban)
        const values = module.exports.props;
        if (!req.query.token || !req.query.banned || !req.query.author || !req.query.type) {
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

        if (!(+req.query.type in messages)) {
            res.send({
                code: 400,
                msg: 'Wrong type'
            })
            return next();
        }

        let message = messages[+req.query.type];
        let color = 0x000000;
        if (+req.query.type === 0 || +req.query.type === 1) {
            color = 0xf44336;
        }
        if (+req.query.type === 2 || +req.query.type === 3) {
            color = 0x66bb6a;
        }
        
        let postingChannel = values.dsClient.config.channels.ban_posting;

        const embed = new RichEmbed()
            .setAuthor(`${req.query.author}`, null, `https://kurikku.pw/u/${req.query.author}`)
            .setTitle(`User *${req.query.banned}* ${message}`)
            .setColor(color)
            .setDescription(
                `Player **${req.query.banned}** ${message} by *${req.query.author}*`
                )
            .setFooter('osu!Kurikku • today at '+utils.getDateTime())
        values.dsClient.channels.get(postingChannel).send(embed);

        res.send({
            code: 200,
            msg: 'sended!'
        });
        return next();
    }
}
