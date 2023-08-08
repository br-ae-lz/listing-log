import { EmbedBuilder } from 'discord.js';
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

	if (searchConfig.searchSite1) {
		try {
			let site1Embeds = [];
			let site1Listings = await getSite1Listings();
			
			// Propagate embed array with scraped listing data
			for (let i = 0; i < searchConfig.numListings; ++i) {
				if (site1Listings[i] === undefined) 
					continue;

				const currentEmbed = new EmbedBuilder()
					.setColor(0xc4c4c4)
					.setTitle(site1Listings[i].title)
					.addFields({ name: site1Listings[i].subheading, value: site1Listings[i].description})
					.setThumbnail(site1Listings[i].image)
					.setURL(site1Listings[i].url)
					.setFooter({ text: site1Listings[i].postDate + '  •  id: ' + site1Listings[i].id})
				site1Embeds.push(currentEmbed);
			}

			if (site1Embeds.length > 0)
				await channels.searchChannel.send({ content: '# Site 1', embeds: site1Embeds });
		}
		catch (e) {
			console.log(e);
			await channels.statusChannel.send('Site 1 encountered an error while fetching listings!');
		}
	}

	if (searchConfig.searchSite2) {
		let site2Embeds = [];
		let site2Listings = await getSite2Listings();
		
		for (let i = 0; i < searchConfig.numListings; ++i) {
			if (site2Listings[i] === undefined) 
				continue;

			const currentEmbed = new EmbedBuilder()
				.setColor(0xc4c4c4)
				.setTitle(site2Listings[i].title)
				.addFields({ name: site2Listings[i].subheading, value: site2Listings[i].description})
				.setThumbnail(site2Listings[i].image)
				.setURL(site2Listings[i].url)
				.setFooter({ text: site2Listings[i].postDate + '  •  id: ' + site2Listings[i].id})
			site2Embeds.push(currentEmbed);
		}

		if (site2Embeds.length > 0)
			await channels.searchChannel.send({ content: '# Site 2', embeds: site2Embeds });
	}

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