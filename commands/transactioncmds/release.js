const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GeneralManagerRoleID, HeadCoachRoleID, freeAgentRoleID, teams } = require('./constants/constants'); // Import constants

module.exports = {
    data: new SlashCommandBuilder()
        .setName('release')
        .setDescription('Release a player from their team role.')
        .addUserOption(option =>
            option.setName('player')
                .setDescription('The player to release')
                .setRequired(true)),

    async execute(interaction) {
        const player = interaction.options.getUser('player');
        const member = interaction.guild.members.cache.get(player.id);
        const user = interaction.member; // The user running the command

        // checks if user has gm or hc
        if (!user.roles.cache.has(GeneralManagerRoleID) && !user.roles.cache.has(HeadCoachRoleID)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('You do not have permission to release players.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // checks if player is still in server
        if (!member) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('Player not found in this server.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // gets the team/role of the gm/hc and player
        const gmTeamRole = teams.find(team => user.roles.cache.has(team.role));
        const playerTeamRole = teams.find(team => member.roles.cache.has(team.role));
        const teamRole = interaction.guild.roles.cache.get(playerTeamRole.role);

        // Check if player is on the same team
        if (!playerTeamRole || playerTeamRole.role !== gmTeamRole.role) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`You can only release players from The ${teamRole.name}.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Remove team role and assign Free Agent role
        try {
            await member.roles.remove(teamRole); // Remove team role
            if (freeAgentRoleID) await member.roles.add(freeAgentRoleID); // Add Free Agent role

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`<@${player.id}> has been released from The ${teamRole.name} and is now a Free Agent.`);
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'There was an error while trying to release the player.', ephemeral: true });
        }
    },
};
