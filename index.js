require('dotenv').config();

const {
Client,
GatewayIntentBits,
Events,
REST,
Routes,
SlashCommandBuilder
} = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, async (readyClient) => {
console.log('Bot online: ' + readyClient.user.tag);

const commands = [
new SlashCommandBuilder()
.setName('job')
.setDescription('Generate a test job')
.toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
await rest.put(
Routes.applicationCommands(readyClient.user.id),
{ body: commands }
);

```
console.log('Commands registered');
```

} catch (error) {
console.error(error);
}
});

client.on(Events.InteractionCreate, async (interaction) => {
try {
if (!interaction.isChatInputCommand()) {
return;
}

```
if (interaction.commandName === 'job') {
  await interaction.reply('🚚 JC Logistics Dispatch Working');
}
```

} catch (error) {
console.error(error);
}
});

client.login(process.env.TOKEN);
