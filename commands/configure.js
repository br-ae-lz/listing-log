import {
    SlashCommandBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    TextInputStyle,
    TextInputBuilder,
    ModalBuilder
} from 'discord.js';
import { 
    searchFilterConfig, 
	searchTimeConfig,
	searchFormatConfig,
    searchTimeout,
    scheduleSearch
} from '../searchutils.js';

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
        .setStyle((searchFilterConfig.searchSite1) ? ButtonStyle.Primary : ButtonStyle.Secondary);
    const site2Button = new ButtonBuilder()
        .setCustomId('site2')
        .setLabel('Site 2')
        .setStyle((searchFilterConfig.searchSite2) ? ButtonStyle.Primary : ButtonStyle.Secondary);
    const sitesRow = new ActionRowBuilder()
        .addComponents(site1Button, site2Button);

    // Prepare filters row
    const allFemaleButton = new ButtonBuilder()
        .setCustomId('allfemale')
        .setLabel('Exclude \'All Female\'')
        .setStyle((searchFilterConfig.excludeAllFemale) ? ButtonStyle.Primary : ButtonStyle.Secondary);
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
                    searchFilterConfig.searchSite1 = false;
                    site1Button.setStyle(ButtonStyle.Secondary);
                } else {
                    searchFilterConfig.searchSite1 = true;
                    site1Button.setStyle(ButtonStyle.Primary);
                }
                break;
            case 'site2':
                if (site2Button.data.style === ButtonStyle.Primary) {
                    searchFilterConfig.searchSite2 = false;
                    site2Button.setStyle(ButtonStyle.Secondary);
                } else {
                    searchFilterConfig.searchSite2 = true;
                    site2Button.setStyle(ButtonStyle.Primary);
                }
                break;
            
            case 'allfemale':
                if (allFemaleButton.data.style === ButtonStyle.Primary) {
                    searchFilterConfig.excludeAllFemale = false;
                    allFemaleButton.setStyle(ButtonStyle.Secondary);
                } else {
                    searchFilterConfig.excludeAllFemale = true;
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
        .setStyle((searchTimeConfig.autoSearch) ? ButtonStyle.Primary : ButtonStyle.Secondary);
    const startupSearchButton = new ButtonBuilder()
        .setCustomId('startupsearch')
        .setLabel('Search on Startup')
        .setStyle((searchTimeConfig.startupSearch) ? ButtonStyle.Primary : ButtonStyle.Secondary);
    const toggleRow = new ActionRowBuilder()
        .addComponents(autoSearchButton, startupSearchButton);

    // Prepare search wait form and row w/ button that calls modal
    const modal = new ModalBuilder()
        .setCustomId('searchTimingModal')
        .setTitle('testModal');
    const searchWaitInput = new TextInputBuilder()
        .setCustomId('searchwait')
        .setLabel('Time to wait (in min):')
        .setStyle(TextInputStyle.Short);
    const searchWaitForm = new ActionRowBuilder()
        .addComponents(searchWaitInput);
    modal.addComponents(searchWaitForm);
    
    const searchWaitButton = new ButtonBuilder()
        .setCustomId('searchwait')
        .setLabel('Change time between searches')
        .setStyle(ButtonStyle.Success)
    const searchWaitRow = new ActionRowBuilder()
        .addComponents(searchWaitButton);
    
    // Prepare back row
    const backButton = new ButtonBuilder()
        .setCustomId('back')
        .setLabel('Back')
        .setStyle(ButtonStyle.Danger);
    const backRow = new ActionRowBuilder()
        .addComponents(backButton);

    await menuChoice.update({ content: '**Search Timing**', components: [toggleRow, searchWaitRow, backRow] });

    while (true) {
        const selection = await menu.awaitMessageComponent({ time: MENU_TIMEOUT });

        switch (selection.customId) {
            // Buttons change config settings based on their current visual state, not by toggling
            // (This is an extreme edge case, but avoids confusion if different instances change the
            //  same setting -- the result always matches the final button press)
            case 'autosearch':
                if (autoSearchButton.data.style === ButtonStyle.Primary) {
                    searchTimeConfig.autoSearch = false;
                    clearTimeout(searchTimeout);
                    autoSearchButton.setStyle(ButtonStyle.Secondary);
                } else {
                    searchTimeConfig.autoSearch = true;
                    scheduleSearch();
                    autoSearchButton.setStyle(ButtonStyle.Primary);
                }
                break;
            case 'startupsearch':
                if (startupSearchButton.data.style === ButtonStyle.Primary) {
                    searchTimeConfig.startupSearch = false;
                    startupSearchButton.setStyle(ButtonStyle.Secondary);
                } else {
                    searchTimeConfig.startupSearch = true;
                    startupSearchButton.setStyle(ButtonStyle.Primary);
                }
                break;
            case 'searchwait':
                await selection.showModal(modal);
                // Handle modal response... Don't quit out of here until we've processed it.
                // If there's some response that isn't a modal interaction (i.e. a cancel or
                // an actual response), then have the menu warn a modal is still in use
                //   (Honestly, no clue how to do a warning. Maybe an ephemeral response)
                const modalResponse = await selection.awaitModalSubmit({ time: MENU_TIMEOUT });
                console.log(modalResponse.fields.getTextInputValue('searchwait'));
                
                continue;

            case 'back':
                return selection;
        }
        await selection.update({ components: [toggleRow, searchWaitRow, backRow] });
    }
}

/********************************************************************************************************
 * Handles passed menuChoice interaction by updating to the search formatting menu, then serving all 
 * interactions with said menu. Throws an error on timeout or returns the back interaction if the
 * user hits the "back" button.
 ********************************************************************************************************/
async function executeSearchFormatting(menuChoice, menu) {
    // Prepare number of listings row
    const selectNumListings = new StringSelectMenuBuilder()
        .setCustomId('numlistings')
        .setPlaceholder(`Number of listings returned per site: ${searchFormatConfig.numListings}`)
        .addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel('1')
                .setValue('changeNum1'),
            new StringSelectMenuOptionBuilder()
                .setLabel('2')
                .setValue('changeNum2'),
            new StringSelectMenuOptionBuilder()
                .setLabel('3')
                .setValue('changeNum3'),
            new StringSelectMenuOptionBuilder()
                .setLabel('4')
                .setValue('changeNum4'),
            new StringSelectMenuOptionBuilder()
                .setLabel('5')
                .setValue('changeNum5'),
            new StringSelectMenuOptionBuilder()
                .setLabel('6')
                .setValue('changeNum6'),
            new StringSelectMenuOptionBuilder()
                .setLabel('7')
                .setValue('changeNum7'),
            new StringSelectMenuOptionBuilder()
                .setLabel('8')
                .setValue('changeNum8'),
            new StringSelectMenuOptionBuilder()
                .setLabel('9')
                .setValue('changeNum9'),
            new StringSelectMenuOptionBuilder()
                .setLabel('10')
                .setValue('changeNum10')
        );	
    const numListingsRow = new ActionRowBuilder()
        .addComponents(selectNumListings);

    // Prepare listing character limit row
    const charLimitInput = new TextInputBuilder()
        .setCustomId("charlimit")
        .setLabel('placeholder')
        .setStyle(TextInputStyle.Short);
    const charLimitRow = new ActionRowBuilder()
        .addComponents(charLimitInput);

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

        switch (selection.customId) {
            case 'numlistings':
                searchFormatConfig.numListings = selection.values[0].slice(9);
                selectNumListings.setPlaceholder(`Number of listings returned per site: ${searchFormatConfig.numListings}`);
                break;

            case 'back':
                return selection;
        }

        await selection.update({ components: [numListingsRow, backRow ]});
    }
}
