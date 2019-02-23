module.exports = {
    name: 'setnick',
    description: 'Setup your nickname and favourite mode for using command without arguments',
    usage: 'setnick [gamemode] [username]',
    enabled: true,
    aliases: ['sn'],
    execute: (client, msg, args) => {
        let mode = 0;
        let username = "";
        let userDB = client.db.get("users").find({ id: msg.author.id }).value();
        if (args.length<2) {
            msg.channel.send("Your account is not setted. To setup enter this command `!sn <your_favourite_gamemode(0|1|2|3)> <your_nickname>`\nGamemods:\n`0 - std\n1- taiko\n2 - ctb\n3 - mania`");
            return;
        }
        username = args.slice(1).join(" ");
        mode = +args[0];

        if (!userDB) {
            const result = client.db.get("users").push({ id: msg.author.id, username: username, mode: mode }).write()
        } else {
            client.db.get("users").find({ id: msg.author.id }).assign({
                username: username,
                mode: mode
            }).write();
        }
        msg.channel.send("Your nickname setted! Now you can enter short commands)")
    }
}
