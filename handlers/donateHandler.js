const io = require('socket.io-client');
const Discord = require("discord.js");
const utils = require("../utils");
let socket = io('wss://socket.donationalerts.ru:443');

const initDonations = (client, bot) => {
    socket.emit('add-user', {token: bot.donationalerts.widget_token, type: "alert_widget"});

    socket.on('donation', async (msg) => {
        var donat = JSON.parse(msg);
        if (donat.amount_main == '0'){
            return;
        }
        else {
            var embed = new Discord.RichEmbed()
                .setTitle(`New donate message!`)
                .setAuthor(donat.username)
                .setColor("aa1a4d")
                .setDescription(`${donat.message}`)
                .addField("Summ", `${donat.amount} ${donat.currency}`)
                .addField("Donate link", "https://www.donationalerts.com/r/osukurikku")
    
            client.channels.get(bot.channels.donates_posting).send({embed});

            // okay go try to update user balance
            try {
                let result = await utils.query(bot.SQL, `SELECT id FROM users WHERE username = "${donat.username.toLowerCase()}"`)
                if (result.length < 1) {
                    console.log(`[Donates] Donate by ${donat.username} cannot added to balance because user not found(`)
                    return;
                }

                await utils.query(bot.SQL, `UPDATE users SET balance = balance+${donat.amount_main} WHERE id = ${result[0].id}`)
                console.log(`[Donates] Donate by ${donat.username}(${donat.amount_main} RUB) added to user balance`)
            } catch (e) {
                console.log(e);
            }
        }
    });
}

module.exports = {
    initDonations
}

