import { SlashCommandBuilder } from 'discord.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('toggledebug')
		.setDescription('Toggle debug mode, which allows any listings to be sent'),

	async execute(interaction) {
		// TBD
	},
}