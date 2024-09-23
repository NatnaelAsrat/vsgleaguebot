const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token, guildId } = require('./config/config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // Check if command has 'data' and 'execute'
    if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
    } else {
        console.error(`The command at '${filePath}' is missing 'data' or 'execute'.`);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        await guild.commands.set(client.commands.map(cmd => cmd.data));
        console.log('Slash commands registered!');
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
    }
});

client.login(token);
