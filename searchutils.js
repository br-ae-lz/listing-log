import { EmbedBuilder } from 'discord.js';
import { createClient } from 'redis';
import { getSite1Listings } from './scraper/site1/site1-scraper.js';
import { getSite2Listings } from './scraper/site2/site2-scraper.js';


const channels = {
    statusChannel: undefined,
    searchChannel: undefined
};

// Default search configs (exported to be changed by commands during runtime)
const searchFilterConfig = {
    searchSite1: true,
    searchSite2: false,
    excludeAllFemale: true,
    debugMode: false
}
const searchTimeConfig = {
    autoSearch: false,
    startupSearch: false,
	searchWait_ms: 5*60*1000
}
const searchFormatConfig = {
    numListings: 5,				
    descCharLimit: 150
}

let searchTimeout;

export { channels, searchFilterConfig, searchTimeConfig, searchFormatConfig, searchTimeout };

/********************************************************************************************************
 * Scrapes for new listings and sends any that are found to the search channel. Upon 
 * completion with autoSearch enabled, schedules next call with pseudorandom timeout.
 ********************************************************************************************************/
export async function sendListings() {
    console.log(`Searching for listings...`);
    await channels.statusChannel.send(`Searching...`);

    const redisClient = createClient();
    redisClient.on('error', err => console.log('Error creating Redis client', err));
    await redisClient.connect();

    if (searchFilterConfig.searchSite1) {
        let site1Embeds = [];
        let site1Listings = await getSite1Listings(redisClient);

        try {
            // Propagate embed array with listing data, marking any that succeed as 'seen'
            for (const listing of site1Listings) {
                const currentEmbed = new EmbedBuilder()
                    .setColor(0xc4c4c4)
                    .setTitle(listing.title)
                    .addFields({ name: listing.subheading, value: listing.description})
                    .setThumbnail(listing.image)
                    .setURL(listing.url)
                    .setFooter({ text: listing.postDate + '  •  id: ' + listing.id})
                site1Embeds.push(currentEmbed);

                if (!searchFilterConfig.debugMode)
                    await redisClient.set(`site1:${listing.id}`, 1);
            }
        }
        catch (e) {
            console.log(e);
            await channels.statusChannel.send('Site 1 encountered an error while fetching listings!');
        }

        if (site1Embeds.length > 0)
            await channels.searchChannel.send({ content: '# Site 1', embeds: site1Embeds });
    }

    if (searchFilterConfig.searchSite2) {
        let site2Embeds = [];
        let site2Listings = await getSite2Listings(redisClient);
        
        try {
            for (const listing of site2Listings) {
                const currentEmbed = new EmbedBuilder()
                    .setColor(0xc4c4c4)
                    .setTitle(listing.title)
                    .addFields({ name: listing.subheading, value: listing.description})
                    .setThumbnail(listing.image)
                    .setURL(listing.url)
                    .setFooter({ text: listing.postDate + '  •  id: ' + listing.id})
                site2Embeds.push(currentEmbed);

                if (!searchFilterConfig.debugMode)
                    await redisClient.set(`site2:${listing.id}`, 1);
            }
        }
        catch (e) {
            console.log(e);
            await channels.statusChannel.send('Site 2 encountered an error while fetching listings!');
        }

        if (site2Embeds.length > 0)
            await channels.searchChannel.send({ content: '# Site 2', embeds: site2Embeds });
    }

    if (!searchFilterConfig.debugMode) await redisClient.bgSave();
    await redisClient.disconnect();
    
    if (searchTimeConfig.autoSearch)
        scheduleSearch();
}

/********************************************************************************************************
 * Schedules a future call to sendListings. (Basically, queues up an auto-search.)
 * 
 * Minimum search wait time follows configuration. If random sway is enabled, a random length
 * of time whose upper bound is the minimum wait time is added. (This ideally eases traffic and
 * makes automated requests seem more human.)
 ********************************************************************************************************/
export function scheduleSearch() {
    searchTimeout = setTimeout(sendListings, 
		searchTimeConfig.searchWait_ms + Math.floor(Math.random() * searchTimeConfig.searchWait_ms) + 1);
}
