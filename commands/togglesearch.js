import { SlashCommandBuilder } from 'discord.js';
import { searchTimeout, searchConfig, scheduleSearch } from '../searchutils.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('togglesearch')
		.setDescription('Toggle automatic searching'),

	async execute(interaction) {
		searchConfig.autoSearch = !searchConfig.autoSearch;

		if (!searchConfig.autoSearch) {
			clearTimeout(searchTimeout);
			await interaction.reply('Automatic searching stopped.');
		} else {
			scheduleSearch();
			await interaction.reply('Automatic searching started.');
		}
	},
}