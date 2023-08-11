import { EmbedBuilder } from 'discord.js';
import { createClient } from 'redis';
import { getSite1Listings } from './scraper/site1/site1-scraper.js';
import { getSite2Listings } from './scraper/site2/site2-scraper.js';


const channels = {
	statusChannel: undefined,
	searchChannel: undefined
};

// Default search configs (exported to be changed by commands during runtime)
const searchConfig = {
	searchSite1: true,			// Listing filtering configs
	searchSite2: false,
    excludeAllFemale: true,
	debugMode: false,			
	
	autoSearch: false,			// Search timing configs
	startupSearch: true,

	numListings: 5,				// Search formatting configs
	descCharLimit: 150
};

let searchWait = 5;							// Minimum time to wait between searches in minutes
let searchWait_ms = searchWait*60*1000;		// searchWait in milliseconds
let searchTimeout;

export { channels, searchConfig, searchTimeout };

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

	if (searchConfig.searchSite1) {
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

				if (!searchConfig.debugMode)
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

	if (searchConfig.searchSite2) {
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

				if (!searchConfig.debugMode)
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

	if (!searchConfig.debugMode) await redisClient.bgSave();
	await redisClient.disconnect();
	
	if (searchConfig.autoSearch)
		scheduleSearch();
}

/********************************************************************************************************
 * Schedules a future call to sendListings. (Basically, an auto-search.)
 * 
 * Wait time is searchWait plus a random length of time whose upper bound is 
 * searchWait, added to ease traffic and make automated requests seem more human.
 ********************************************************************************************************/
export function scheduleSearch() {
		searchTimeout = setTimeout(sendListings, searchWait_ms + Math.floor(Math.random() * searchWait_ms) + 1);
}

/********************************************************************************************************
 * Assigns a new value to searchWait (and, consequently, searchWait_ms.)
 ********************************************************************************************************/
export function setSearchWait(newValue) {
	searchWait = newValue;
	searchWait_ms = searchWait*60*1000;
}