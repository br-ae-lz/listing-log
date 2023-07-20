import 'dotenv/config';
import {
	Client,
	Events,
	GatewayIntentBits,
} from 'discord.js';

const SEARCHWAIT_MIN = 5;						// Minimum time to wait between searches in minutes
const SEARCHWAIT = SEARCHWAIT_MIN*60*1000;		// SEARCHWAIT_MIN in milliseconds

let statusChannel;
let searchChannel;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.login(process.env.DISCORD_TOKEN);

// Note in console and status channel and begin searching once ready
client.once(Events.ClientReady, c => {
	console.log(`Successfully started logged in as ${c.user.tag}`);

	statusChannel = c.channels.cache.get(`${process.env.STATUS_CHANNEL_ID}`);
	searchChannel = c.channels.cache.get(`${process.env.SEARCH_CHANNEL_ID}`);
	if (statusChannel === undefined || searchChannel === undefined) 
		throw new Error("Status or search channel not found! Did you supply the right ID's in .env?");
	
	statusChannel.send('Started!');
	sendListings();
	// Wait SEARCHWAIT plus random timelength between [1, SEARCHWAIT] between each search (to seem human)
	setInterval(sendListings, SEARCHWAIT + Math.floor(Math.random() * SEARCHWAIT) + 1);
});

// sendListings(): Scrape for new listings and send any that are found to the search channel
function sendListings() {
	console.log('Searching for listings...');
	statusChannel.send('Searching...');
}