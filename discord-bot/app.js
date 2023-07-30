import 'dotenv/config';
import {
	Client,
	Events,
	GatewayIntentBits,
	EmbedBuilder,
} from 'discord.js';
import { getSite1Listings } from './scraper/site1/site1-scraper.js';
import { getSite2Listings } from './scraper/site2/site2-scraper.js';

const SEARCHWAIT_MIN = 5;						// Minimum time to wait between searches in minutes
const SEARCHWAIT = SEARCHWAIT_MIN*60*1000;		// SEARCHWAIT_MIN in milliseconds
const LISTINGS_PER_SEARCH = 5;

let statusChannel;
let searchChannel;

// Default options block
let searchSite1 = true;
let searchSite2 = true;


const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.login(process.env.DISCORD_TOKEN);

// Startup routine: Notify in appropriate channels and begin searching
client.once(Events.ClientReady, c => {
	console.log(`Successfully started logged in as ${c.user.tag}`);

	statusChannel = c.channels.cache.get(`${process.env.STATUS_CHANNEL_ID}`);
	searchChannel = c.channels.cache.get(`${process.env.SEARCH_CHANNEL_ID}`);
	if (statusChannel === undefined || searchChannel === undefined) 
		throw new Error("Status or search channel not found! Did you supply the right ID's in .env?");
	
	statusChannel.send('Started!');
	sendListings();
	// Wait SEARCHWAIT plus random timelength between [1, SEARCHWAIT] between each search (to seem human)
	//setInterval(sendListings, SEARCHWAIT + Math.floor(Math.random() * SEARCHWAIT) + 1);
});


/********************************************************************************************************
 * @brief Scrapes for new listings and sends any that are found to the search channel.
 ********************************************************************************************************/
function sendListings() {
	console.log('Searching for listings...');
	statusChannel.send('Searching...');

	if (searchSite1) {
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
				.setFooter({ text: site1Listings[i].postDate})
				.setTimestamp()
			site1Embeds.push(currentEmbed);
		}

		if (site1Embeds.length > 0)
			searchChannel.send({ content: '# Site 1', embeds: site1Embeds });
	}
	
	if (searchSite2) {
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
				.setFooter({ text: site2Listings[i].postDate})
				.setTimestamp()
			site2Embeds.push(currentEmbed);
		}

		if (site2Embeds.length > 0)
			searchChannel.send({ content: '# Site 2', embeds: site2Embeds });
	}
}
