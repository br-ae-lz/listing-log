import { EmbedBuilder } from 'discord.js';
import { getSite1Listings } from './scraper/site1/site1-scraper.js';
import { getSite2Listings } from './scraper/site2/site2-scraper.js';


const SEARCHWAIT_MIN = 5;						// Minimum time to wait between searches in minutes
const SEARCHWAIT = SEARCHWAIT_MIN*60*1000;		// SEARCHWAIT_MIN in milliseconds

const LISTINGS_PER_SEARCH = 5;

const channels = {
	statusChannel: undefined,
	searchChannel: undefined
};

// Default search configs (exported to be changed by commands during runtime)
const searchConfig = {
	searchSite1: true,
	searchSite2: true,
	includeAllFemale: false,
	debugMode: false,
	autoSearch: true
};

export { channels, searchConfig };

let curDate = Date.now();
let lastDate = Date.now();

/********************************************************************************************************
 * @brief Scrapes for new listings and sends any that are found to the search channel.
 ********************************************************************************************************/
export function sendListings() {
	console.log('Searching for listings...');
	curDate = Date.now();
	channels.statusChannel.send(`Searching ${curDate - lastDate} following previous...`);
	lastDate = curDate;

	if (searchConfig.searchSite1) {
		let site1Listings = getSite1Listings();
		let site1Embeds = [];
		
		// Propagate embed array with scraped listing data
		for (let i = 0; i < LISTINGS_PER_SEARCH; ++i) {
			if (site1Listings[i] === undefined) 
				continue;

			const currentEmbed = new EmbedBuilder()
				.setColor(0xc4c4c4)
				.setTitle(site1Listings[i].title)
				.addFields({ name: site1Listings[i].subheading, value: site1Listings[i].description})
				.setThumbnail(site1Listings[i].image)
				.setURL(site1Listings[i].url)
				.setFooter({ text: site1Listings[i].postDate + '  •  id: ' + site1Listings[i].id})
				.setTimestamp()
			site1Embeds.push(currentEmbed);
		}

		if (site1Embeds.length > 0)
			channels.searchChannel.send({ content: '# Site 1', embeds: site1Embeds });
	}

	if (searchConfig.searchSite2) {
		let site2Listings = getSite2Listings();
		let site2Embeds = [];
		
		for (let i = 0; i < LISTINGS_PER_SEARCH; ++i) {
			if (site2Listings[i] === undefined) 
				continue;

			const currentEmbed = new EmbedBuilder()
				.setColor(0xc4c4c4)
				.setTitle(site2Listings[i].title)
				.addFields({ name: site2Listings[i].subheading, value: site2Listings[i].description})
				.setThumbnail(site2Listings[i].image)
				.setURL(site2Listings[i].url)
				.setFooter({ text: site2Listings[i].postDate + '  •  id: ' + site2Listings[i].id})
				.setTimestamp()
			site2Embeds.push(currentEmbed);
		}

		if (site2Embeds.length > 0)
			channels.searchChannel.send({ content: '# Site 2', embeds: site2Embeds });
	}
}