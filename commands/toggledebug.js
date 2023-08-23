import { SlashCommandBuilder } from 'discord.js';
import { searchFilterConfig } from '../searchutils.js';

export const command = {
    data: new SlashCommandBuilder()
        .setName('toggledebug')
        .setDescription('Toggle debug mode, which removes all search filters and marks no listings sent as "seen"'),

    async execute(interaction) {
        searchFilterConfig.debugMode = !searchFilterConfig.debugMode;

        if (!searchFilterConfig.debugMode) {
            await interaction.reply('Debug mode turned off.');
        } else {
            await interaction.reply('Debug mode turned on.');
        }	
    },
}