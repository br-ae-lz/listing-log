// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Notify in console and status channel after starting
client.once(Events.ClientReady, c => {
	console.log(`Successfully started logged in as ${c.user.tag}`);
	const channel = c.channels.cache.get(`${process.env.STATUS_CHANNEL_ID}`);
	channel.send('Started!');
});


// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);