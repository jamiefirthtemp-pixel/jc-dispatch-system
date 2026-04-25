Replace EVERYTHING in index.js with this EXACT code:

require('dotenv').config();

const {
Client,
GatewayIntentBits,
SlashCommandBuilder,
REST,
Routes,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

const stores = [
{ name: 'TESCO - LONDON', stock: 25 },
{ name: 'LIDL - SWANSEA', stock: 50 },
{ name: 'ALDI - SHEFFIELD', stock: 75 }
];

const activeJobs = {};

function stockStatus(stock) {
if (stock <= 30) return '🔴 LOW';
if (stock <= 60) return '🟡 MEDIUM';
return '🟢 HIGH';
}

client.once('ready', async () => {
console.log('Bot online: ' + client.user.tag);

const commands = [
new SlashCommandBuilder()
.setName('job')
.setDescription('Generate a job')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

await rest.put(
Routes.applicationCommands(client.user.id),
{ body: commands }
);

console.log('Slash commands registered');
});

client.on('interactionCreate', async interaction => {

try {

```
if (interaction.isChatInputCommand()) {

  if (interaction.commandName === 'job') {

    if (activeJobs[interaction.user.id]) {
      return interaction.reply({
        content: '❌ You already have an active job.',
        ephemeral: true
      });
    }

    const store = stores.sort((a, b) => a.stock - b.stock)[0];

    const jobId = 'J-' + Math.floor(Math.random() * 100000);

    activeJobs[interaction.user.id] = true;

    const embed = new EmbedBuilder()
      .setTitle('JC LOGISTICS DISPATCH')
      .setDescription(
        '🚚 JOB ID: ' + jobId + '\n\n' +
        '🏪 STORE: ' + store.name + '\n\n' +
        '📊 STOCK: ' + stockStatus(store.stock) + ' (' + store.stock + '%)'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('complete')
        .setLabel('COMPLETE DELIVERY')
        .setStyle(ButtonStyle.Success)
    );

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
}

if (interaction.isButton()) {

  if (interaction.customId === 'complete') {

    delete activeJobs[interaction.user.id];

    return interaction.update({
      cont
```
