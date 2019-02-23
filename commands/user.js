const axios = require("axios");
const { RichEmbed } = require('discord.js');


module.exports = {
    name: 'user',
    description: "Get info about user",
    usage: "user [nickname] [mode(optional)]",
    enabled: true,
    aliases: ['u'],
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
        
        let user = await axios("https://kurikku.pw/api/get_user?u=" + username + "&m=" + mode);
        if (user.data.length<1) {
            msg.channel.send(new RichEmbed().setColor(0xffebee).setDescription("User not found!"));
            return;
        }
        user = user.data[0];
        const resultEmbed = new RichEmbed()
            .setColor(0xe91e63)
            .setAuthor(user.username, `https://a.kurikku.pw/${user.user_id}`, `https://kurikku.pw/u/${user.user_id}`)
            .addField("Country", user.country, true)
            .addField("Country ranking", "#"+user.pp_country_rank, true)
            .addField("Level", (+user.level).toFixed(0), true)
            .addField("PP", Math.round(user.pp_raw), true)
            .addField("Play Count", user.playcount, true)
            .addField("Accuracy", (+user.accuracy).toFixed(2)+"%", true)
            .setThumbnail(`https://a.kurikku.pw/${user.user_id}`);

        msg.channel.send(resultEmbed);
    }
}
