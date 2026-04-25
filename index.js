const { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

if (!store) {
return;
}

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

console.log('Stock depleted');

}

setInterval(() => {
depleteStock();
}, 86400000);

client.once(Events.ClientReady, (readyClient) => {
console.log('Bot online: ' + readyClient.user.tag);
});

client.on(Events.InteractionCreate, async (interaction) => {

if (!interaction.isChatInputCommand()) {
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

if (interaction.isButton()) {

if (interaction.customId === 'complete_delivery') {

  const job = activeJobs[interaction.user.id];

  if (!job) {
    return;
  }

  increaseStoreStock(job.store);

  delete activeJobs[interaction.user.id];

  await interaction.update({
    content: '✅ DELIVERY COMPLETED\n\nStock increased for: ' + job.store,
    components: []
  });

  return;

}

}

});

client.login(process.env.TOKEN);