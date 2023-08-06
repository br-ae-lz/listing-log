import { SlashCommandBuilder } from 'discord.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('togglesearch')
		.setDescription('Toggle automatic searching'),

	async execute(interaction) {
		// TBD
	},
}