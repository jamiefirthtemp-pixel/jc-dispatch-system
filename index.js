const { Client, GatewayIntentBits, Events } = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, (clientReady) => {
console.log('Bot online: ' + clientReady.user.tag);
});

client.on(Events.InteractionCreate, async (interaction) => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === 'job') {
await interaction.reply({
content: 'Job system working'
});
}
});

client.login(process.env.TOKEN);
