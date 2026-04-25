const {
Client,
GatewayIntentBits,
Events,
REST,
Routes,
SlashCommandBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

const stores = [
{ name: 'TESCO - LONDON', stock: 20 },
{ name: 'LIDL - SWANSEA', stock: 45 },
{ name: 'ALDI - SHEFFIELD', stock: 80 }
];

const activeJobs = {};

function getLowestStockStore() {
return [...stores].sort((a, b) => a.stock - b.stock)[0];
}

function generateJobId() {
return 'J-' + Math.floor(Math.random() * 100000);
}

function increaseStoreStock(storeName) {

const store = stores.find(s => s.name === storeName);

if (!store) return;

store.stock += 20;

if (store.stock > 100) {
store.stock = 100;
}

}

function depleteStock() {

stores.forEach(store => {

store.stock -= 10;

if (store.stock < 0) {
  store.stock = 0;
}

});

}

client.once(Events.ClientReady, async (readyClient) => {

console.log('Bot online: ' + readyClient.user.tag);

const commands = [

new SlashCommandBuilder()
  .setName('job')
  .setDescription('Generate a delivery job'),

new SlashCommandBuilder()
  .setName('stock')
  .setDescription('View stock levels'),

new SlashCommandBuilder()
  .setName('deplete')
  .setDescription('Deplete stock')

].map(command => command.toJSON());

const rest = new REST({ version: '10' })
.setToken(process.env.TOKEN);

await rest.put(
Routes.applicationCommands(readyClient.user.id),
{ body: commands }
);

console.log('Commands registered');

});

client.on(Events.InteractionCreate, async (interaction) => {

try {

if (interaction.isChatInputCommand()) {

  if (interaction.commandName === 'job') {

    if (activeJobs[interaction.user.id]) {

      await interaction.reply({
        content: 'You already have an active job.',
        ephemeral: true
      });

      return;
    }

    const store = getLowestStockStore();

    const jobId = generateJobId();

    activeJobs[interaction.user.id] = {
      jobId: jobId,
      store: store.name
    };

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('complete_delivery')
          .setLabel('COMPLETE DELIVERY')
          .setStyle(ButtonStyle.Success)
      );

    await interaction.reply({
      content:
        '🚛 JOB GENERATED\n\n' +
        'Job ID: ' + jobId + '\n' +
        'Store: ' + store.name + '\n' +
        'Stock: ' + store.stock + '%',
      components: [row]
    });

    return;

  }

  if (interaction.commandName === 'stock') {

    let message = '📦 STORE STOCK LEVELS\n\n';

    stores.forEach(store => {
      message += store.name + ': ' + store.stock + '%\n';
    });

    await interaction.reply({
      content: message,
      ephemeral: true
    });

    return;

  }

  if (interaction.commandName === 'deplete') {

    depleteStock();

    await interaction.reply({
      content: '⚠️ Stock manually depleted.',
      ephemeral: true
    });

    return;

  }

}

if (interaction.isButton()) {

  if (interaction.customId === 'complete_delivery') {

    const job = activeJobs[interaction.user.id];

    if (!job) {

      await interaction.reply({
        content: 'No active job found.',
        ephemeral: true
      });

      return;

    }

    increaseStoreStock(job.store);

    delete activeJobs[interaction.user.id];

    await interaction.reply({
      content:
        '✅ DELIVERY COMPLETED\n\n' +
        'Stock increased for: ' + job.store,
      ephemeral: true
    });

    return;

  }

}

} catch (error) {

console.log(error);

}

});

client.login(process.env.TOKEN);