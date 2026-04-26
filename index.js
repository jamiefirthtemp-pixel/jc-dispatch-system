const {
Client,
GatewayIntentBits,
Events,
REST,
Routes,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

/* RDCS */

const rdcs = [

{
company: 'DHL',
location: 'ULLAPOOL'
},

{
company: 'DHL',
location: 'ABERDEEN'
},

{
company: 'DSV',
location: 'WATERFORD'
},

{
company: 'XPO LOGISTICS',
location: 'LONDON'
},

{
company: 'STOBART/CULINA',
location: 'CARLISLE'
}

];

/* STORES */

const stores = [

{
name: 'TESCO',
location: 'LONDON',
stock: 20
},

{
name: 'TESCO',
location: 'ULLAPOOL',
stock: 35
},

{
name: 'LIDL',
location: 'SWANSEA',
stock: 45
},

{
name: 'ALDI',
location: 'SHEFFIELD',
stock: 80
},

{
name: 'SAINSBURYS',
location: 'EXETER',
stock: 25
}

];

const activeJobs = {};
const driverStats = {};

/* DISTANCE MAP */

const distanceMap = {

'ULLAPOOL-ULLAPOOL': 5,
'ABERDEEN-ULLAPOOL': 320,
'LONDON-LONDON': 5,
'CARLISLE-SWANSEA': 420,
'WATERFORD-EXETER': 310

};

/* FUNCTIONS */

function getTrafficLight(stock) {

if (stock <= 30) {
return '🔴 LOW';
}

if (stock <= 60) {
return '🟡 MEDIUM';
}

return '🟢 HEALTHY';

}

function generateJobId() {
return 'J-' + Math.floor(Math.random() * 100000);
}

function getBestJob() {

const sortedStores = [...stores]
.sort((a, b) => a.stock - b.stock);

const store = sortedStores[0];

let bestRdc = rdcs[0];

let shortestDistance = 999999;

rdcs.forEach(rdc => {

const key =
  rdc.location + '-' + store.location;

const distance =
  distanceMap[key] || 999999;

if (distance < shortestDistance) {

  shortestDistance = distance;
  bestRdc = rdc;

}

});

return {
store,
rdc: bestRdc,
distance: shortestDistance
};

}

function increaseStoreStock(storeName, location) {

const store = stores.find(s =>
s.name === storeName &&
s.location === location
);

if (!store) return;

store.stock += 20;

if (store.stock > 100) {
store.stock = 100;
}

}

client.once(Events.ClientReady, async (readyClient) => {

console.log('Bot online: ' + readyClient.user.tag);

const commands = [

{
  name: 'job',
  description: 'Generate a delivery job'
},

{
  name: 'stock',
  description: 'View stock levels'
},

{
  name: 'stats',
  description: 'View driver stats'
}

];

const rest = new REST({
version: '10'
}).setToken(process.env.TOKEN);

await rest.put(
Routes.applicationCommands(
readyClient.user.id
),
{ body: commands }
);

console.log('Commands registered');

});

client.on(
Events.InteractionCreate,
async (interaction) => {

try {

  if (interaction.isChatInputCommand()) {

    /* JOB */

    if (interaction.commandName === 'job') {

      if (
        activeJobs[interaction.user.id]
      ) {

        await interaction.reply({
          content:
            'You already have an active job.',
          ephemeral: true
        });

        return;

      }

      const result = getBestJob();

      const store = result.store;
      const rdc = result.rdc;

      const jobId = generateJobId();

      activeJobs[interaction.user.id] = {

        jobId: jobId,

        storeName: store.name,

        storeLocation:
          store.location

      };

      const row =
        new ActionRowBuilder()
          .addComponents(

            new ButtonBuilder()
              .setCustomId(
                'complete_delivery'
              )
              .setLabel(
                'COMPLETE DELIVERY'
              )
              .setStyle(
                ButtonStyle.Success
              )

          );

      await interaction.reply({

        content:

          '🚛 JC LOGISTICS DISPATCH\n\n' +

          'Job ID: ' +
          jobId + '\n\n' +

          'RDC:\n' +
          rdc.company +
          ' - ' +
          rdc.location +

          '\n\nSTORE:\n' +

          store.name +
          ' - ' +
          store.location +

          '\n\nSTOCK:\n' +

          getTrafficLight(
            store.stock
          ) +

          ' (' +
          store.stock +
          '%)' +

          '\n\nDISTANCE:\n' +

          result.distance +
          ' km',

        components: [row]

      });

      return;

    }

    /* STOCK */

    if (
      interaction.commandName ===
      'stock'
    ) {

      let message =
        '📦 STORE STOCK LEVELS\n\n';

      stores.forEach(store => {

        message +=

          store.name +
          ' - ' +
          store.location +

          ' | ' +

          getTrafficLight(
            store.stock
          ) +

          ' (' +
          store.stock +
          '%)\n';

      });

      await interaction.reply({

        content: message,
        ephemeral: true

      });

      return;

    }

    /* STATS */

    if (
      interaction.commandName ===
      'stats'
    ) {

      const stats =
        driverStats[
          interaction.user.id
        ];

      const completed =
        stats
          ? stats.completedJobs
          : 0;

      await interaction.reply({

        content:

          '📊 DRIVER STATS\n\n' +

          'Completed Jobs: ' +
          completed,

        ephemeral: true

      });

      return;

    }

  }

  /* BUTTONS */

  if (interaction.isButton()) {

    if (
      interaction.customId ===
      'complete_delivery'
    ) {

      const job =
        activeJobs[
          interaction.user.id
        ];

      if (!job) {

        await interaction.reply({

          content:
            'No active job found.',

          ephemeral: true

        });

        return;

      }

      increaseStoreStock(
        job.storeName,
        job.storeLocation
      );

      if (
        !driverStats[
          interaction.user.id
        ]
      ) {

        driverStats[
          interaction.user.id
        ] = {

          completedJobs: 0

        };

      }

      driverStats[
        interaction.user.id
      ].completedJobs += 1;

      delete activeJobs[
        interaction.user.id
      ];

      await interaction.reply({

        content:

          '✅ DELIVERY COMPLETED',

        ephemeral: true

      });

      return;

    }

  }

} catch (error) {

  console.log(error);

}

}

);

client.login(process.env.TOKEN);