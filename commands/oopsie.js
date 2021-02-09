const { execute: oopsieCall } = require("../private/anticheat/discord_command");

module.exports = {
    name: 'oopsie',
    enabled: true,
    hidden: true,
    usage: "oopsie [id]",
    description: "Only for admin stuff",
    aliases: ['oop'],
    async execute(client, message, args) {
        await oopsieCall(client, message, args);
    }
}