const { RichEmbed } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Helping you since!',
    usage: 'help [command name]',
    aliases: ['h'],
    enabled: true,
    execute(client, message, args) {
        if (args.length>0)
        {
            let cmd = client.commands.get(args[0]);
            if(!cmd) {
                message.channel.send("Command not found!")
                return;
            }
            const resultEmbed = new RichEmbed()
                .setTitle(cmd.name)
                .setColor(0x66bb6a)
                .setDescription(`__Enabled:__ ${(cmd.enabled ? '**yes**' : '**NO**')}
                __Usage:__ **${cmd.usage}**
                __Aliases:__ **${cmd.aliases.length ? (cmd.aliases.join(" or ")) : 'None'}**
                __Description:__ **${cmd.description}**`)

            message.channel.send(resultEmbed).catch(console.error);
        } else {
            let cmd = client.commands.array();
            const resultEmbed = new RichEmbed()
                .setTitle("**Helping:**")
                .setColor(0x66bb6a)
            let msg = '';
            for (let i = 0; i < cmd.length; i++) {
                if ('hidden' in cmd[i] && cmd[i]['hidden']) continue;
                resultEmbed.addField(cmd[i].name, `Enabled: ${cmd[i].enabled ? "**yes**" : "**No**"}
                Aliases: **${cmd[i].aliases.length ? (cmd[i].aliases.join(" or ")) : 'None'}**
                Usage: **${cmd[i].usage}**
                Description: **${cmd[i].description}**`)
            }

            message.channel.send(resultEmbed).catch(console.error);
        }
        
    },
};
