const { RichEmbed } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'Gives invite link to bot!',
    usage: 'invite',
    aliases: ['inv'],
    enabled: true,
    execute(client, message, args) {
        const resultEmbed = new RichEmbed()
            .setTitle("**Hey, that's your invite link for our bot!**")
            .setColor(0xec407a)
            .setDescription("`https://discord.com/oauth2/authorize?client_id=548179820698271756&scope=bot&permissions=522304`")

        message.channel.send(resultEmbed);
    }
};
