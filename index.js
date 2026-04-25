const { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

const stores = [
{ name: 'TESCO - LONDON', stock: 20 },
{ name: 'LIDL - SWANSEA', stock: 45 },
{ name: 'ALDI - SHEFFIELD', stock: 80 }
];

const activeJobs = {};

function getStockStatus(stock) {
if (stock <= 30) return 'LOW';
if (stock <= 60) return 'MEDIUM';
return 'HIGH';
}

function generateJobId() {
return 'J-' + Math.floor(Math.random() * 100000);
}

client.once(Events.ClientReady, (readyClient) => {
console.log('Bot online: ' + readyClient.user.tag);
});

client.on(Events.InteractionCreate, async (interaction) => {
try {
if (interaction.isChatInputCommand()) {
if (interaction.commandName === 'job') {
if (activeJobs[interaction.user.id]) {
await interaction.reply({
content: 'You already have an active delivery job.',
ephemeral: true
});
return;
}

```
    const sortedStores = [...stores].sort((a, b) => a.stock - b.stock);
    const selectedStore = sortedStores[0];

    const jobId = generateJobId();

    activeJobs[interaction.user.id] = {
      id: jobId,
      store: selectedStore.name
    };

    const embed = new EmbedBuilder()
      .setTitle('JC LOGISTICS DISPATCH')
      .setDescription(
        'JOB ID: ' + jobId + '\n\n' +
        'STORE: ' + selectedStore.name + '\n\n' +
        'STOCK STATUS: ' + getStockStatus(selectedStore.stock) + ' (' + selectedStore.stock + '%)\n\n' +
        'STATUS: ACTIVE DELIVERY'
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('complete_delivery')
        .setLabel('COMPLETE DELIVERY')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });

    return;
  }
}

if (interaction.isButton()) {
  if (interaction.customId === 'complete_delivery') {
    delete activeJobs[interaction.user.id];

    await interaction.update({
      content: 'DELIVERY COMPLETED',
      embeds: [],
      components: []
    });

    return;
  }
}
```

} catch (error) {
console.log(error);
}
});

client.login(process.env.TOKEN);
