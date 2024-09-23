// when i use the word user thats in regards to the FO, or the person using the command
// player is the free agent getting signed, released, promoted, demoted


const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

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
        const user = interaction.member; // The user running the command

        // define franchise owner role and free agents
        const franchiseOwnerRoleName = 'Franchise Owner';
        const freeAgentRoleName = 'Free Agent'; 

        // teams
        const teams = [
            { role: 'Rockford Renegades' },
            { role: 'Boston Cardinals' },
            { role: 'Miami Pirates' },
            { role: 'Toronto Tundra' },
            { role: 'North Carolina Panthers' },
            { role: 'Oregon Eagles' },
            { role: 'Omaha Blizzards' },
            { role: 'Minnesota Monarchs' },
            { role: 'Beverly Bobcats' },
            { role: 'Oklahoma Bears' },
        ];

        // check if user has FO role
        if (!user.roles.cache.some(r => r.name === franchiseOwnerRoleName)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('You do not have permission to offer roles.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // make sure player is still in the server
        if (!member) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('Player not found in this server.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // check if player has free agent role
        if (!member.roles.cache.some(r => r.name === freeAgentRoleName)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`<@${player.id}> is not a Free Agent and cannot be offered a role.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // check if the user has a team role
        const userTeamRole = teams.find(team => user.roles.cache.some(r => r.name === team.role));

        if (!userTeamRole) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription('You do not belong to any team.');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // check if the selected role matches the user's team role
        if (role.name !== userTeamRole.role) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`You can only sign players to the ${userTeamRole.role} team.`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // contract embed
        const offerEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`The ${userTeamRole.role} team has offered you a role. Please accept or decline this offer.`);

        // create buttons for accept and decline
        const acceptButton = new ButtonBuilder()
            .setCustomId('accept_offer')
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success);

        const declineButton = new ButtonBuilder()
            .setCustomId('decline_offer')
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

        // dms the player
        try {
            const dmMessage = await member.send({ embeds: [offerEmbed], components: [row] });

            await interaction.reply({ content: 'Offer sent to the player!', ephemeral: true });

            // waits and listens for dm interaction
            const filter = i => i.user.id === player.id;
            const collector = dmMessage.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                if (i.customId === 'accept_offer') {
                    await member.roles.add(role); // Assign the role
                    await i.update({ content: 'You have accepted the offer!', components: [] });
                    await interaction.followUp(`<@${player.id}> has been signed to the ${userTeamRole.role} team.`);
                } else if (i.customId === 'decline_offer') {
                    await i.update({ content: 'You have declined the offer.', components: [] });
                    await interaction.followUp(`<@${player.id}> has declined the offer from the ${userTeamRole.role} team.`);
                }
                collector.stop();
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    interaction.followUp(`<@${player.id}> did not respond in time.`);
                }
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: 'Could not send DM to the player.', ephemeral: true });
        }
    },
};
