```javascript
require(‘dotenv’).config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require(‘discord.js’);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const CHANNELS = { dispatchConsole: ‘PASTE_CHANNEL_ID’, activeJobs: ‘PASTE_CHANNEL_ID’, stockBoard: ‘PASTE_CHANNEL_ID’, alerts: ‘PASTE_CHANNEL_ID’, driverStats: ‘PASTE_CHANNEL_ID’ };
const stores = [ { name: ‘ALDI - PORTHMADOG’, stock: 70 }, { name: ‘ALDI - WATERFORD’, stock: 70 }, { name: ‘ALDI - SHEFFIELD’, stock: 70 }, { name: ‘ALDI - NEWCASTLE’, stock: 70 }, { name: ‘ALDI - LONDON’, stock: 70 }, { name: ‘TESCO - LONDON’, stock: 70 }, { name: ‘TESCO - NORWICH’, stock: 70 }, { name: ‘TESCO - ULLAPOOL’, stock: 70 }, { name: ‘LIDL - SWANSEA’, stock: 70 }, { name: ‘IKEA - CROYDON’, stock: 70 }];
const activeDrivers = {}; const driverStats = {}; const jobs = [];
function getStatus(stock) { if (stock <= 30) return ‘🔴 LOW’; if (stock <= 60) return ‘🟡 MEDIUM’; return ‘🟢 HIGH’; }
function generateJobId() { return ‘J-’ + Math.floor(Math.random() * 100000); }
function randomIncrease() { return Math.floor(Math.random() * 21) + 15; }
function getPriorityStore() { const sorted = […stores].sort((a, b) => a.stock - b.stock); return sorted[0]; }
setInterval(() => { for (const store of stores) { store.stock = Math.floor(store.stock * 0.9);
if (store.stock < 0) {
  store.stock = 0;
}
}
console.log(‘10 percent stock depletion complete’); }, 86400000);
async function updateDispatchConsole() { try { const channel = await client.channels.fetch(CHANNELS.dispatchConsole);
if (!channel) return;

const activeCount = jobs.filter(j => j.status === 'ACTIVE').length;
const lowStores = stores.filter(s => s.stock <= 30).length;

const content = 'JC LOGISTICS // DISPATCH CONTROL\n\n' +
  'ACTIVE JOBS: ' + activeCount + '\n\n' +
  'LOW STOCK STORES: ' + lowStores + '\n\n' +
  'SYSTEM STATUS: ONLINE\n\n' +
  'STOCK CYCLE: ACTIVE (10% DAILY)\n\n' +
  'LAST REFRESH:\n' +
  new Date().toLocaleString();

const messages = await channel.messages.fetch({ limit: 1 });
const first = messages.first();

if (first) {
  await first.edit(content);
} else {
  await channel.send(content);
}
} catch (err) { console.log(err); } }
async function updateStockBoard() { try { const channel = await client.channels.fetch(CHANNELS.stockBoard);
if (!channel) return;

let content = 'JC LOGISTICS // STOCK BOARD\n\n';

for (const store of stores) {
  content += store.name + ' - ' + store.stock + '% - ' + getStatus(store.stock) + '\n';
}

const messages = await channel.messages.fetch({ limit: 1 });
const first = messages.first();

if (first) {
  await first.edit(content);
} else {
  await channel.send(content);
}
} catch (err) { console.log(err); } }
async function updateDriverStats() { try { const channel = await client.channels.fetch(CHANNELS.driverStats);
if (!channel) return;

let content = 'JC LOGISTICS // DRIVER STATS\n\n';

for (const id in driverStats) {
  content += driverStats[id].name + '\n';
  content += 'Jobs Completed: ' + driverStats[id].completed + '\n\n';
}

const messages = await channel.messages.fetch({ limit: 1 });
const first = messages.first();

if (first) {
  await first.edit(content);
} else {
  await channel.send(content);
}
} catch (err) { console.log(err); } }
client.once(‘ready’, async () => { console.log(‘Logged in as’ + client.user.tag);
const commands = [ new SlashCommandBuilder() .setName(‘job’) .setDescription(‘Generate dispatch job’),
new SlashCommandBuilder()
  .setName('deplete')
  .setDescription('Manually deplete stock')
].map(command => command.toJSON());
const rest = new REST({ version: ‘10’ }).setToken(process.env.TOKEN);
try { await rest.put( Routes.applicationCommands(client.user.id), { body: commands } );
console.log('Slash commands registered');
} catch (err) { console.log(err); }
setInterval(updateDispatchConsole, 30000); setInterval(updateStockBoard, 30000); setInterval(updateDriverStats, 30000); });
client.on(‘interactionCreate’, async interaction => { if (interaction.isChatInputCommand()) {
if (interaction.commandName === 'job') {

  if (activeDrivers[interaction.user.id]) {
    return interaction.reply({
      content: '❌ You already have an active job.',
      ephemeral: true
    });
  }

  const store = getPriorityStore();
  const jobId = generateJobId();

  const job = {
    id: jobId,
    driverId: interaction.user.id,
    driverName: interaction.user.username,
    store: store.name,
    status: 'ACTIVE'
  };

  jobs.push(job);
  activeDrivers[interaction.user.id] = true;

  const embed = new EmbedBuilder()
    .setTitle('JC LOGISTICS DISPATCH')
    .setDescription(
      '🚚 JOB ID: ' + jobId + '\n\n' +
      '🏪 STORE:\n' + store.name + '\n\n' +
      '📊 STOCK:\n' + getStatus(store.stock) + ' (' + store.stock + '%)\n\n' +
      '📡 STATUS:\nACTIVE DISPATCH'
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('complete_' + jobId)
      .setLabel('COMPLETE DELIVERY')
      .setStyle(ButtonStyle.Success)
  );

  const activeChannel = await client.channels.fetch(CHANNELS.activeJobs);

  if (activeChannel) {
    await activeChannel.send({
      content: '🚚 Dispatch assigned to <@' + interaction.user.id + '>',
      embeds: [embed],
      components: [row]
    });
  }

  await interaction.reply({
    content: '✅ Dispatch generated for ' + store.name,
    ephemeral: true
  });
}

if (interaction.commandName === 'deplete') {
  const store = stores[Math.floor(Math.random() * stores.length)];

  store.stock -= 20;

  if (store.stock < 0) {
    store.stock = 0;
  }

  await interaction.reply({
    content: '⚠️ ' + store.name + ' depleted.',
    ephemeral: true
  });
}
}
if (interaction.isButton()) { if (interaction.customId.startsWith(‘complete_’)) {
  const jobId = interaction.customId.split('_')[1];
  const job = jobs.find(j => j.id === jobId);

  if (!job) return;

  const store = stores.find(s => s.name === job.store);
  const increase = randomIncrease();

  store.stock += increase;

  if (store.stock > 100) {
    store.stock = 100;
  }

  job.status = 'COMPLETED';

  delete activeDrivers[job.driverId];

  if (!driverStats[job.driverId]) {
    driverStats[job.driverId] = {
      name: job.driverName,
      completed: 0
    };
  }

  driverStats[job.driverId].completed++;

  await interaction.update({
    content:
      '✅ DELIVERY COMPLETED\n\n' +
      'DRIVER:\n<@' + job.driverId + '>\n\n' +
      'STORE:\n' + store.name + '\n\n' +
      'STOCK INCREASE:\n+' + increase + '%\n\n' +
      'NEW STOCK:\n' + store.stock + '%',
    embeds: [],
    components: []
  });
}
} });
client.login(process.env.TOKEN);