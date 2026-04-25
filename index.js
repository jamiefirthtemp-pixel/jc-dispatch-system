const { Client, GatewayIntentBits, Events } = require('discord.js');

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

client.once(Events.ClientReady, (readyClient) => {
console.log('Bot online: ' + readyClient.user.tag);
});

client.on(Events.InteractionCreate, async (interaction) => {

if (!interaction.isChatInputCommand()) {
return;
}

if (interaction.commandName === 'job') {

```
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

await interaction.reply({
  content:
    '🚛 JOB GENERATED\n\n' +
    'Job ID: ' + jobId + '\n' +
    'Store: ' + store.name + '\n' +
    'Stock: ' + store.stock + '%'
});
```

}

});

client.login(process.env.TOKEN);
