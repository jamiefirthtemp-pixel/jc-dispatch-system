require('dotenv').config();

const {
Client,
GatewayIntentBits,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
EmbedBuilder,
SlashCommandBuilder,
REST,
Routes
} = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

const stores = [
{ name: 'TESCO - LONDON', stock: 70 },
{ name: 'TESCO - NORWICH', stock: 70 },
{ name: 'LIDL - SWANSEA', stock: 70 },
{ name: 'ALDI - SHEFFIELD', stock: 70 }
];

const activeDrivers = {};
const jobs = [];

function getStatus(stock) {
if (stock <= 30) return '🔴 LOW';
if (stock <= 60) return '🟡 MEDIUM';
return '🟢 HIGH';
}

function getJobId() {
return 'J-' + Math.floor(Math.random() * 100000);
}

client.once('ready', async () => {
console.log('Bot online: ' + client.user.tag);

const commands = [
new SlashCommandBuilder()
.setName('job')
.setDescription('Generate a dispatch job')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

await rest.put(
Routes.applicationCommands(client.user.id),
{ body: commands }
);

console.log('Slash commands registered');
});

client.on('interactionCreate', async interaction => {

if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === 'job') {

```
if (activeDrivers[interaction.user.id]) {
  return interaction.reply({
    content: '❌ You already have an active job.',
    ephemeral: true
  });
}

const sortedStores = [...stores].sort((a, b) => a.stock - b.stock);
const store = sortedStores[0];

const jobId = getJobId();

jobs.push({
  id: jobId,
  userId: interaction.user.id,
  store: store.name
});

activeDrivers[interaction.user.id] = true;

const embed = new EmbedBuilder()
  .setTitle('JC LOGISTICS DISPATCH')
  .setDescription(
    '🚚 JOB ID: ' + jobId + '\n\n' +
    '🏪 STORE: ' + store.name + '\n\n' +
    '📊 STOCK: ' + getStatus(store.stock) + ' (' + store.stock + '%)'
  );

const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('complete_' + jobId)
    .setLabel('COMPLETE DELIVERY')
    .setStyle(ButtonStyle.Success)
);

await interaction.reply({
  embeds: [embed],
  components: [row]
});
```

}
});

client.on('interactionCreate', async interaction => {

if (!interaction.isButton()) return;

if (interaction.customId.startsWith('complete_')) {

```
const jobId = interaction.customId.split('_')[1];

const job = jobs.find(j => j.id === jobId);

if (!job) {
  return interaction.reply({
    content: 'Job not found.',
    ephemeral: true
  });
}

const store = stores.find(s => s.name === job.store);

store.stock += 20;

if (store.stock > 100) {
  store.stock = 100;
}

delete activeDrivers[job.userId];

await interaction.update({
  content:
    '✅ DELIVERY COMPLETED\n\n' +
    '🏪 STORE: ' + store.name + '\n' +
    '📊 NEW STOCK: ' + store.stock + '%',
  embeds: [],
  components: []
});
```

}
});

client.login(process.env.TOKEN);
