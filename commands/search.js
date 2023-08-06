import { SlashCommandBuilder } from 'discord.js';
import { sendListings } from '../searchutils.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Force a search for listings among all requested sites'),

	async execute(interaction) {
		await interaction.reply('\u200b');
		sendListings();
	},
}