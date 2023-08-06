import { SlashCommandBuilder } from 'discord.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('send a ping...to test'),

	async execute(interaction) {
		await interaction.reply('pong');
	},
};