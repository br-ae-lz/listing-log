import 'dotenv/config';
import {
	Client,
	Events,
	Collection,
	GatewayIntentBits
} from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { 
	sendListings, 
	channels, 
	searchConfig, 
	scheduleSearch
} from './searchutils.js';


const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Get a full path to this directory in the ES6 way
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import each command for which there is a complete source file in the command directory
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
	const { command } = await import(`./commands/${file}`);
	
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command)
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.login(process.env.DISCORD_TOKEN);

// Startup routine: Notify in appropriate channels and begin searching based on config
client.once(Events.ClientReady, c => {
	console.log(`Successfully started logged in as ${c.user.tag}`);

	channels.statusChannel = c.channels.cache.get(`${process.env.STATUS_CHANNEL_ID}`);
	channels.searchChannel = c.channels.cache.get(`${process.env.SEARCH_CHANNEL_ID}`);
	if (channels.statusChannel === undefined || channels.searchChannel === undefined) 
		throw new Error("Status or search channel not found! Did you supply the right ID's in .env?");
	
	channels.statusChannel.send('Started!');

	if (searchConfig.startupSearch) sendListings();
	else if (searchConfig.autoSearch) scheduleSearch();
});

// Interaction routine: Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	console.log(interaction);

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});
