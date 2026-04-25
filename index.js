const { Client, GatewayIntentBits, Events } = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, (readyClient) => {
console.log('Bot online: ' + readyClient.user.tag);
});

client.on(Events.InteractionCreate, async (interaction) => {
if (!interaction.isChatInputCommand()) {
return;
}

if (interaction.commandName === 'job') {
await interaction.reply({
content: '🚚 JC Logistics Dispatch Working'
});
}
});

client.login(process.env.TOKEN);
