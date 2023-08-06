import { SlashCommandBuilder } from 'discord.js';
import { searchConfig } from '../searchutils.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('toggledebug')
		.setDescription('Toggle debug mode, which allows any listings to be sent'),

	async execute(interaction) {
		searchConfig.debugMode = !searchConfig.debugMode;

		if (!searchConfig.debugMode) {
			await interaction.reply('Debug mode turned off.');
		} else {
			await interaction.reply('Debug mode turned on.');
		}	
	},
}