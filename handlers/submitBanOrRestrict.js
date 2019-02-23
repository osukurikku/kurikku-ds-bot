const { RichEmbed } = require('discord.js');

module.exports = {
    props: {
        dsClient: null,
        server: null
    },
    execute: (req, res, next) => {
        // Nickname who make ban
        // Nickname who banned
        // Type (0 - restrict 1 - ban)
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
        
        let date = new Date(Date.now());
        let postingChannel = values.dsClient.config.channels.ban_posting;

        const embed = new RichEmbed()
            .setAuthor(`${req.query.author}`, null, `https://kurikku.pw/u/${req.query.author}`)
            .setTitle(`User *${req.query.banned}* ${(req.query.type === 1) ? "has been restricted" : "has been banned" }`)
            .setColor(0xf44336)
            .setDescription(
                `Player **${req.query.banned}** ${(req.query.type === 1) ? "has been restricted" : "has been banned" } by *${req.query.author}*`
                )
            .setFooter('osu!Kurikku • today at '+date.getHours() + ":" + date.getMinutes())
        values.dsClient.channels.get(postingChannel).send(embed);

        res.send({
            code: 200,
            msg: 'sended!'
        });
        return next();
    }
}