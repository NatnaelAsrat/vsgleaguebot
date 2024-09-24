const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { token, guildId } = require('./config/config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Function to load commands recursively from a directory
const loadCommands = (directory) => {
    const files = fs.readdirSync(directory);

    for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        // If it's a directory, recurse into it
        if (stat.isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);

            // Check if command has 'data' and 'execute'
            if (command.data && command.execute) {
                client.commands.set(command.data.name, command);
            } else {
                console.error(`The command at '${filePath}' is missing 'data' or 'execute'.`);
            }
        }
    }
};

// Load commands from the 'commands' folder
const commandsPath = path.join(__dirname, 'commands');
loadCommands(commandsPath);

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
