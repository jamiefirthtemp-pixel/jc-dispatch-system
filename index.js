const { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

/* =========================
STORE DATA
========================= */

const stores = [
{ name: 'TESCO - LONDON', stock: 20 },
{ name: 'LIDL - SWANSEA', stock: 45 },
{ name: 'ALDI - SHEFFIELD', stock: 80 }
];

/* =========================
ACTIVE JOBS
========================= */

const activeJobs = {};

/* =========================
FUNCTIONS
========================= */

function getStockStatus(stock) {

if (stock <= 30) {
return '🔴 LOW';
}

if (stock <= 60) {
return '🟡 MEDIUM';
}

return '🟢 HIGH';

}

function generateJobId() {
return 'J-' + Math.floor(Math.random() * 100000);
}

/* =========================
READY
========================= */

client.once(Events.ClientReady, (clientReady) => {

console.log('Bot online: ' + clientReady.user.tag);

});

/* =========================
INTERACTIONS
========================= */

client.on(Events.InteractionCreate, async (interaction) => {

try {

```
/* =====================
   SLASH COMMAND
===================== */

if (interaction.isChatInputCommand()) {

  if (interaction.commandName === 'job') {

    /* =====================
       ACTIVE JOB CHECK
    ===================== */

    if (activeJobs[interaction.user.id]) {

      return await interaction.reply({
        content: '❌ You already have an active delivery job.',
        ephemeral: true
      });

    }

    /* =====================
       PRIORITY STORE
    ===================== */

    const sortedStores = [...stores].sort((a, b) => a.stock - b.stock);

    const selectedStore = sortedStores[0];

    const jobId = generateJobId();

    /* =====================
       SAVE JOB
    ===================== */

    activeJobs[interaction.user.id] = {
      id: jobId,
      store: selectedStore.name
    };

    /* =====================
       JOB EMBED
    ===================== */

    const embed = new EmbedBuilder()
      .setTitle('🚛 JC LOGISTICS DISPATCH')
      .setDescription(

        '📦 JOB ID: ' + jobId + '\n\n' +

        '🏪 STORE:\n' +
        selectedStore.name + '\n\n' +

        '📊 STOCK STATUS:\n' +
        getStockStatus(selectedStore.stock) +
        ' (' + selectedStore.stock + '%)\n\n' +

        '📡 STATUS:\nACTIVE DELIVERY'

      );

    /* =====================
       COMPLETE BUTTON
    ===================== */

    const row = new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId('complete_delivery')
          .setLabel('COMPLETE DELIVERY')
          .setStyle(ButtonStyle.Success)

      );

    /* =====================
       SEND JOB
    ===================== */

    await interaction.reply({

      embeds: [embed],
      components: [row]

    });

  }

}

/* =====================
   BUTTONS
===================== */

if (interaction.isButton()) {

  if (interaction.customId === 'complete_delivery') {

    delete activeJobs[interaction.user.id];

    await interaction.update({

      content: '✅ DELIVERY COMPLETED',
      embeds: [],
      components: []

    });

  }

}
```

} catch (error) {

```
console.log(error);
```

}

});

client.login(process.env.TOKEN);
