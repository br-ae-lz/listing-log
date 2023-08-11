import { 
	SlashCommandBuilder, 
	ButtonBuilder, 
	ButtonStyle, 
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder
} from 'discord.js';
import { searchConfig, searchTimeout } from '../searchutils.js';

const MENU_TIMEOUT = 300000;

export const command = {
	data: new SlashCommandBuilder()
		.setName('configure')
		.setDescription('Access the search configuration menus'),

	async execute(interaction) {
		// Prepare initial menu
		const searchFiltersButton = new ButtonBuilder()
			.setCustomId('searchFilters')
			.setLabel('Search filters')
			.setStyle(ButtonStyle.Secondary);
		const searchTimingButton = new ButtonBuilder()
			.setCustomId('searchTiming')
			.setLabel('Search timing')
			.setStyle(ButtonStyle.Secondary);
		const searchFormattingButton = new ButtonBuilder()
			.setCustomId('searchFormatting')
			.setLabel('Search formatting')
			.setStyle(ButtonStyle.Secondary);
		const menusRow = new ActionRowBuilder()
			.addComponents(searchFiltersButton, searchTimingButton, searchFormattingButton);
			
		const menu = await interaction.reply({
			content: `Press a button to bring up its respective configuration menu.`,
			components: [menusRow],
		});

		// Wrap in try-catch to ensure all timeout errors are handled gracefully
		// (Menu interactions are serviced until 5 min pass without any)
		try {
			// One loop comprises menu switch to user's choice, then a reset when they hit "back" button
			while (true) {
				const menuChoice = await menu.awaitMessageComponent({ time: MENU_TIMEOUT });
				let back;

				switch (menuChoice.customId) {
					case 'searchFilters':
						back = await executeSearchFilters(menuChoice, menu);
						break;
					case 'searchTiming':
						back = await executeSearchTiming(menuChoice, menu);
						break;
					case 'searchFormatting':
						back = await executeSearchFormatting(menuChoice, menu);
						break;
				}

				await back.update({
					content: `Press a button to bring up its respective configuration menu.`,
					components: [menusRow],
				});
			}		
		} catch (e) {
			console.log(e);
			await interaction.editReply({ 
				content: 'Command expired. Repeat `/configure` if needed.', 
				components: [] 
			});
		}

	},
}


/********************************************************************************************************
 * Handles passed menuChoice interaction by updating to the search filters menu, then serving all 
 * interactions with said menu. Throws an error on timeout or returns the back interaction if the
 * user hits the "back" button.
 ********************************************************************************************************/
async function executeSearchFilters(menuChoice, menu) {
	// Prepare sites row
	const site1Button = new ButtonBuilder()
		.setCustomId('site1')
		.setLabel('Site 1')
		.setStyle((searchConfig.searchSite1) ? ButtonStyle.Primary : ButtonStyle.Secondary);
	const site2Button = new ButtonBuilder()
		.setCustomId('site2')
		.setLabel('Site 2')
		.setStyle((searchConfig.searchSite2) ? ButtonStyle.Primary : ButtonStyle.Secondary);
	const sitesRow = new ActionRowBuilder()
		.addComponents(site1Button, site2Button);

	// Prepare filters row
	const allFemaleButton = new ButtonBuilder()
		.setCustomId('allfemale')
		.setLabel('Exclude \'All Female\'')
		.setStyle((searchConfig.excludeAllFemale) ? ButtonStyle.Primary : ButtonStyle.Secondary);
	const filtersRow = new ActionRowBuilder()
		.addComponents(allFemaleButton);

	// Prepare back row
	const backButton = new ButtonBuilder()
		.setCustomId('back')
		.setLabel('Back')
		.setStyle(ButtonStyle.Danger);
	const backRow = new ActionRowBuilder()
		.addComponents(backButton);
	
	await menuChoice.update({ content: '**Search Filters**', components: [sitesRow, filtersRow, backRow] });

	while (true) {
		const selection = await menu.awaitMessageComponent({ time: MENU_TIMEOUT });

		// Buttons change config settings based on their current visual state, not by toggling
		// (This is an extreme edge case, but avoids confusion if different instances change the
		//  same setting -- the result always matches the final button press)
		switch (selection.customId) {
			case 'site1':
				if (site1Button.data.style === ButtonStyle.Primary) {
					searchConfig.searchSite1 = false;
					site1Button.setStyle(ButtonStyle.Secondary);
				} else {
					searchConfig.searchSite1 = true;
					site1Button.setStyle(ButtonStyle.Primary);
				}
				break;
			case 'site2':
				if (site2Button.data.style === ButtonStyle.Primary) {
					searchConfig.searchSite2 = false;
					site2Button.setStyle(ButtonStyle.Secondary);
				} else {
					searchConfig.searchSite2 = true;
					site2Button.setStyle(ButtonStyle.Primary);
				}
				break;
			
			case 'allfemale':
				if (allFemaleButton.data.style === ButtonStyle.Primary) {
					searchConfig.excludeAllFemale = false;
					allFemaleButton.setStyle(ButtonStyle.Secondary);
				} else {
					searchConfig.excludeAllFemale = true;
					allFemaleButton.setStyle(ButtonStyle.Primary);
				}
				break;

			case 'back':
				return selection;
		}

		await selection.update({ components: [sitesRow, filtersRow, backRow] });
	}
}


/********************************************************************************************************
 * Handles passed menuChoice interaction by updating to the search timing menu, then serving all 
 * interactions with said menu. Throws an error on timeout or returns the back interaction if the
 * user hits the "back" button.
 ********************************************************************************************************/
async function executeSearchTiming(menuChoice, menu) {
	// Prepare toggleable row
	const autoSearchButton = new ButtonBuilder()
		.setCustomId('autosearch')
		.setLabel('Auto-search')
		.setStyle((searchConfig.autoSearch) ? ButtonStyle.Primary : ButtonStyle.Secondary);
	const startupSearchButton = new ButtonBuilder()
		.setCustomId('startupsearch')
		.setLabel('Search on Startup')
		.setStyle((searchConfig.startupSearch) ? ButtonStyle.Primary : ButtonStyle.Secondary);
	const toggleRow = new ActionRowBuilder()
		.addComponents(autoSearchButton, startupSearchButton);

	// Prepare search wait row 
	
	// Prepare back row
	const backButton = new ButtonBuilder()
		.setCustomId('back')
		.setLabel('Back')
		.setStyle(ButtonStyle.Danger);
	const backRow = new ActionRowBuilder()
		.addComponents(backButton);

	await menuChoice.update({ content: '**Search Timing**', components: [toggleRow, backRow] });

	while (true) {
		const selection = await menu.awaitMessageComponent({ time: MENU_TIMEOUT });

		switch (selection.customId) {
			// Buttons change config settings based on their current visual state, not by toggling
			// (This is an extreme edge case, but avoids confusion if different instances change the
			//  same setting -- the result always matches the final button press)
			case 'autosearch':
				if (autoSearchButton.data.style === ButtonStyle.Primary) {
					searchConfig.autoSearch = false;
					clearTimeout(searchTimeout);
					autoSearchButton.setStyle(ButtonStyle.Secondary);
				} else {
					searchConfig.autoSearch = true;
					scheduleSearch();
					autoSearchButton.setStyle(ButtonStyle.Primary);
				}
				break;
			case 'startupsearch':
				if (startupSearchButton.data.style === ButtonStyle.Primary) {
					searchConfig.startupSearch = false;
					startupSearchButton.setStyle(ButtonStyle.Secondary);
				} else {
					searchConfig.startupSearch = true;
					startupSearchButton.setStyle(ButtonStyle.Primary);
				}
				break;

			case 'back':
				return selection;
		}

		await selection.update({ components: [toggleRow, backRow] });
	}
}

/********************************************************************************************************
 * Handles passed menuChoice interaction by updating to the search formatting menu, then serving all 
 * interactions with said menu. Throws an error on timeout or returns the back interaction if the
 * user hits the "back" button.
 ********************************************************************************************************/
async function executeSearchFormatting(menuChoice, menu) {
	// Prepare number of listings row
	// (Future: Range from 1-10, as there are 10 embeds max per message)
	const selectNumListings = new StringSelectMenuBuilder()
		.setCustomId('numlistings')
		.setPlaceholder(`Number of listings returned per site: ${searchConfig.numListings}`)
		.addOptions(
			new StringSelectMenuOptionBuilder()
				.setLabel('1')
				.setValue('changeNum1'),
			new StringSelectMenuOptionBuilder()
				.setLabel('2')
				.setValue('changeNum2'),
			new StringSelectMenuOptionBuilder()
				.setLabel('3')
				.setValue('changeNum3')
		);	
	const numListingsRow = new ActionRowBuilder()
		.addComponents(selectNumListings);

	// Prepare back row
	const backButton = new ButtonBuilder()
		.setCustomId('back')
		.setLabel('Back')
		.setStyle(ButtonStyle.Danger);
	const backRow = new ActionRowBuilder()
		.addComponents(backButton);
	
	await menuChoice.update({ content: '**Search Formatting**', components: [numListingsRow, backRow] });

	while (true) {
		const selection = await menu.awaitMessageComponent( { time: MENU_TIMEOUT });
		// TODO: Fix this -- this isn't the right way to handle multiselects
		switch (selection.customId) {
			case 'changeNum1':
				console.log('changeNum1');
				break;
			case 'changeNum2':
				console.log('changeNum2');
				break;
			case 'changeNum3':
				console.log('changeNum3');
				break;

			case 'back':
				return selection;
		}

		await selection.update({ components: [numListingsRow, backRow ]});
	}
}