const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
console.log('Bot online: ' + client.user.tag);

const commands = [
new SlashCommandBuilder()
.setName('job')
.setDescription('Generate a dispatch job')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
await rest.put(
Routes.applicationCommands(client.user.id),
{ body: commands }
);

```
console.log('Slash commands registered');
```

} catch (error) {
console.log(error);
}
});

client.on('interactionCreate', async interaction => {

if (!interaction.isChatInputCommand()) {
return;
}

if (interaction.commandName === 'job') {

```
await interaction.reply({
  content: '🚚 JC Logistics Dispatch Test Successful',
  ephemeral: true
});
```

}
});

client.login(process.env.TOKEN);
