import { SlashCommandBuilder } from 'discord.js';
import { searchConfig } from '../searchutils.js';

export const command = {
	data: new SlashCommandBuilder()
		.setName('configure')
		.setDescription('Access the search configuration menu'),

	async execute(interaction) {
		// TBD
	},
}