// when i use the word user thats in regards to the gm/hc , or the person using the command
// player is the free agent getting signed, released, promoted, demoted

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { GeneralManagerRoleID, HeadCoachRoleID, freeAgentRoleID, teams } = require('./constants/constants'); // Import constants

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sign')
        .setDescription('Offer to sign a player to a team role.')
        .addUserOption(option =>
            option.setName('player')
                .setDescription('The player to offer the role')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign (team role)')
                .setRequired(true)),

    async execute(interaction) {
        const player = interaction.options.getUser('player');
        const role = interaction.options.getRole('role');
        const member = interaction.guild.members.cache.get(player.id);
        const user = interaction.member; // the user running the cmd

        const freeAgentRole = interaction.guild.roles.cache.get(freeAgentRoleID);

        // checks if user has gm or hc
        if (!user.roles.cache.has(GeneralManagerRoleID) && !user.roles.cache.has(HeadCoachRoleID)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('You do not have permission to sign players.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // checks player is still in server
        if (!member) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`<@${player.id}> not found in VSG.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // check if player has Free Agent role
        if (!member.roles.cache.has(freeAgentRoleID)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`<@${player.id}> is not a Free Agent and cannot be signed.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // checks if gm or hc is on a team
        const userTeamRole = teams.find(team => user.roles.cache.has(team.role));
        if (!userTeamRole) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('You do not belong to any team.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // checks the selected role in interaction is the same as the gm/hc
        if (role.id !== userTeamRole.role) {
            const teamRole = interaction.guild.roles.cache.get(userTeamRole.role);
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`You can only sign players to The ${teamRole.name}.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // contract embed and buttons
        const offerEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`The ${role.name} have offered you a contract. Please accept or decline this contract.`);

        const acceptButton = new ButtonBuilder()
            .setCustomId('accept_offer')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const declineButton = new ButtonBuilder()
            .setCustomId('decline_offer')
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

        try {
            const dmMessage = await member.send({ embeds: [offerEmbed], components: [row] });
            await interaction.reply({ content: `Offer sent to <@${player.id}>!`, ephemeral: true });

            const filter = i => i.user.id === player.id;
            const collector = dmMessage.createMessageComponentCollector({ filter, time: 300000 });

            collector.on('collect', async i => {
                if (i.customId === 'accept_offer') {
                    await member.roles.add(role);
                    if (freeAgentRole) await member.roles.remove(freeAgentRole);
                    await i.update({ content: 'You have accepted the offer!', components: [] });

                    const successEmbed = new EmbedBuilder()
                        .setColor('#00ff00')
                        .setDescription(`<@${player.id}> has been signed to the ${role.name}.`);
                    await interaction.followUp({ embeds: [successEmbed] });

                } else if (i.customId === 'decline_offer') {
                    await i.update({ content: `You have declined the offer from The ${role.name}.`, components: [] });
                    await interaction.followUp(`<@${player.id}> has declined the offer from The ${role.name}.`);
                }
                collector.stop();
            });

            collector.on('end', collected => {
                if (collected.size === 0) interaction.followUp(`<@${player.id}> did not respond in time.`);
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: `Could not send DM to <@${player.id}>.`, ephemeral: true });
        }
    },
};
