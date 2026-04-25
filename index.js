```javascript
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

/* =========================
   CHANNEL IDS
========================= */

const CHANNELS = {
  dispatchConsole: 'PASTE_CHANNEL_ID',
  activeJobs: 'PASTE_CHANNEL_ID',
  stockBoard: 'PASTE_CHANNEL_ID',
  alerts: 'PASTE_CHANNEL_ID',
  driverStats: 'PASTE_CHANNEL_ID'
};

/* =========================
   STORE DATA
========================= */

const stores = [
  { name: "ALDI - PORTHMADOG", stock: 70 },
  { name: "ALDI - WATERFORD", stock: 70 },
  { name: "ALDI - SHEFFIELD", stock: 70 },
  { name: "ALDI - NEWCASTLE", stock: 70 },
  { name: "ALDI - LONDON", stock: 70 },

  { name: "HAWES MARKETPLACE - HAWES", stock: 70 },

  { name: "DREAMS - EXETER", stock: 70 },

  { name: "HOMEBASE - EXETER", stock: 70 },
  { name: "HOMEBASE - PLYMOUTH", stock: 70 },

  { name: "IKEA - CROYDON", stock: 70 },
  { name: "IKEA - DOUGLAS", stock: 70 },
  { name: "IKEA - DUBLIN", stock: 70 },

  { name: "LIDL - PERTH", stock: 70 },
  { name: "LIDL - EDINBURGH", stock: 70 },
  { name: "LIDL - WATERFORD", stock: 70 },
  { name: "LIDL - SWANSEA", stock: 70 },
  { name: "LIDL - SOUTHAMPTON", stock: 70 },
  { name: "LIDL - CANTERBURY", stock: 70 },
  { name: "LIDL - ANTRIM", stock: 70 },

  { name: "MCDONALD'S - LONDON", stock: 70 },

  { name: "SAINSBURY'S - EXETER", stock: 70 },
  { name: "SAINSBURY'S - NEWPORT", stock: 70 },
  { name: "SAINSBURY'S - LISBURN", stock: 70 },

  { name: "TESCO - DUBLIN", stock: 70 },
  { name: "TESCO - BELFAST", stock: 70 },
  { name: "TESCO - ANTRIM", stock: 70 },
  { name: "TESCO - DUMFRIES", stock: 70 },
  { name: "TESCO - HOLYHEAD", stock: 70 },
  { name: "TESCO - PORTHMADOG", stock: 70 },
  { name: "TESCO - ABERYSTWYTH", stock: 70 },
  { name: "TESCO - FOLKESTONE", stock: 70 },
  { name: "TESCO - LONDON", stock: 70 },
  { name: "TESCO - CHELMSFORD", stock: 70 },
  { name: "TESCO - NORWICH", stock: 70 },
  { name: "TESCO - ULLAPOOL", stock: 70 },
  { name: "TESCO - STORNOWAY", stock: 70 }
];

/* =========================
   SYSTEM DATA
========================= */

const activeDrivers = {};
const driverStats = {};
const jobs = [];

/* =========================
   FUNCTIONS
========================= */

function getStatus(stock) {
  if (stock <= 30) return "🔴 LOW";
  if (stock <= 60) return "🟡 MEDIUM";
  return "🟢 HIGH";
}

function generateJobId() {
  return "J-" + Math.floor(Math.random() * 100000);
}

function randomIncrease() {
  return Math.floor(Math.random() * 21) + 15;
}

function getPriorityStore() {
  const sorted = [...stores].sort((a, b) => a.stock - b.stock);
  return sorted[0];
}

/* =========================
   DAILY STOCK DEPLETION
========================= */

setInterval(() => {

  for (const store of stores) {

    store.stock = Math.floor(store.stock * 0.9);

    if (store.stock < 0) {
      store.stock = 0;
    }

  }

  console.log("10 percent stock depletion complete");

}, 86400000);

/* =========================
   DISPATCH CONSOLE
========================= */

async function updateDispatchConsole() {

  try {

    const channel = await client.channels.fetch(CHANNELS.dispatchConsole);

    if (!channel) return;

    const activeCount = jobs.filter(j => j.status === "ACTIVE").length;
    const lowStores = stores.filter(s => s.stock <= 30).length;

    const content =
`JC LOGISTICS // DISPATCH CONTROL

ACTIVE JOBS: ${activeCount}

LOW STOCK STORES: ${lowStores}

SYSTEM STATUS: ONLINE

STOCK CYCLE: ACTIVE (10% DAILY)

LAST REFRESH:
${new Date().toLocaleString()}
`;

    const messages = await channel.messages.fetch({ limit: 1 });

    const first = messages.first();

    if (first) {
      await first.edit(content);
    } else {
      await channel.send(content);
    }

  } catch (err) {
    console.log(err);
  }

}

/* =========================
   STOCK BOARD
========================= */

async function updateStockBoard() {

  try {

    const channel = await client.channels.fetch(CHANNELS.stockBoard);

    if (!channel) return;

    let low = "";
    let medium = "";
    let high = "";

    for (const store of stores) {

      const line = `${store.name} - ${store.stock}%\n`;

      if (store.stock <= 30) {
        low += line;
      } else if (store.stock <= 60) {
        medium += line;
      } else {
        high += line;
      }

    }

    const content =
`JC LOGISTICS // STOCK BOARD

🔴 LOW STOCK
${low || "NONE"}

🟡 MEDIUM STOCK
${medium || "NONE"}

🟢 HIGH STOCK
${high || "NONE"}
`;

    const messages = await channel.messages.fetch({ limit: 1 });

    const first = messages.first();

    if (first) {
      await first.edit(content);
    } else {
      await channel.send(content);
    }

  } catch (err) {
    console.log(err);
  }

}

/* =========================
   DRIVER STATS
========================= */

async function updateDriverStats() {

  try {

    const channel = await client.channels.fetch(CHANNELS.driverStats);

    if (!channel) return;

    let content = `JC LOGISTICS // DRIVER STATS\n\n`;

    for (const id in driverStats) {

      content += `${driverStats[id].name}\n`;
      content += `Jobs Completed: ${driverStats[id].completed}\n\n`;

    }

    const messages = await channel.messages.fetch({ limit: 1 });

    const first = messages.first();

    if (first) {
      await first.edit(content);
    } else {
      await channel.send(content);
    }

  } catch (err) {
    console.log(err);
  }

}

/* =========================
   READY
========================= */

client.once('ready', async () => {

  console.log(`Logged in as ${client.user.tag}`);

  const commands = [

    new SlashCommandBuilder()
      .setName('job')
      .setDescription('Generate dispatch job'),

    new SlashCommandBuilder()
      .setName('deplete')
      .setDescription('Manually deplete stock')

  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {

    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );

    console.log('Slash commands registered');

  } catch (err) {
    console.log(err);
  }

  setInterval(updateDispatchConsole, 30000);
  setInterval(updateStockBoard, 30000);
  setInterval(updateDriverStats, 30000);

});

/* =========================
   INTERACTIONS
========================= */

client.on('interactionCreate', async interaction => {

  /* ======================
     JOB COMMAND
  ====================== */

  if (interaction.isChatInputCommand()) {

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
`🚚 JOB ID: ${jobId}

🏪 STORE:
${store.name}

📊 STOCK:
${getStatus(store.stock)} (${store.stock}%)

📡 STATUS:
ACTIVE DISPATCH`
        );

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`complete_${jobId}`)
            .setLabel('COMPLETE DELIVERY')
            .setStyle(ButtonStyle.Success)
        );

      const activeChannel = await client.channels.fetch(CHANNELS.activeJobs);

      if (activeChannel) {

        await activeChannel.send({
          content: `🚚 Dispatch assigned to <@${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

      }

      await interaction.reply({
        content: `✅ Dispatch generated for ${store.name}`,
        ephemeral: true
      });

    }

    /* ======================
       DEPLETE COMMAND
    ====================== */

    if (interaction.commandName === 'deplete') {

      const store = stores[Math.floor(Math.random() * stores.length)];

      store.stock -= 20;

      if (store.stock < 0) {
        store.stock = 0;
      }

      const alertChannel = await client.channels.fetch(CHANNELS.alerts);

      if (alertChannel) {

        await alertChannel.send(
`🚨 MANUAL STOCK EVENT

STORE:
${store.name}

NEW STOCK:
${store.stock}%`
        );

      }

      await interaction.reply({
        content: `⚠️ ${store.name} depleted.`,
        ephemeral: true
      });

    }

  }

  /* ======================
     COMPLETE BUTTON
  ====================== */

  if (interaction.isButton()) {

    if (interaction.customId.startsWith('complete_')) {

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
`✅ DELIVERY COMPLETED

DRIVER:
<@${job.driverId}>

STORE:
${store.name}

STOCK INCREASE:
+${increase}%

NEW STOCK:
${store.stock}%`,

        embeds: [],
        components: []

      });

    }

  }

});

client.login(process.env.TOKEN);
```
