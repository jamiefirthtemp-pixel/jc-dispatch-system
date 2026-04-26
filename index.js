const {
Client,
GatewayIntentBits,
Events,
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

/* CHANNEL IDS */

const DISPATCH_CHANNEL_ID = '1497756268847304734';
const STOCK_CHANNEL_ID = '1497749476234760342';

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

function getEmbedColor(stock) {

if (stock <= 30) {
return 0xff0000;
}

if (stock <= 60) {
return 0xffcc00;
}

return 0x00cc66;

}

function generateJobId() {
return 'J-' + Math.floor(Math.random() * 100000);
}

function getBestJob() {

const sortedStores =
[...stores].sort(
(a, b) => a.stock - b.stock
);

const store = sortedStores[0];

let bestRdc = rdcs[0];

let shortestDistance = 999999;

rdcs.forEach(rdc => {

const key =
  rdc.location +
  '-' +
  store.location;

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

function increaseStoreStock(
storeName,
location
) {

const store = stores.find(
s =>
s.name === storeName &&
s.location === location
);

if (!store) return;

store.stock += 20;

if (store.stock > 100) {
store.stock = 100;
}

}

async function updateStockBoard() {

const channel =
await client.channels.fetch(
STOCK_CHANNEL_ID
);

if (!channel) return;

const embed =
new EmbedBuilder()

  .setTitle(
    '📦 LIVE STOCK CONTROL BOARD'
  )

  .setColor(0x0099ff)

  .setTimestamp();

stores.forEach(store => {

embed.addFields({

  name:
    store.name +
    ' - ' +
    store.location,

  value:
    getTrafficLight(
      store.stock
    ) +

    ' (' +
    store.stock +
    '%)',

  inline: false

});

});

const messages =
await channel.messages.fetch({
limit: 10
});

const existing =
messages.find(
m =>
m.author.id ===
client.user.id
);

if (existing) {

await existing.edit({
  embeds: [embed]
});

} else {

await channel.send({
  embeds: [embed]
});

}

}

client.once(
Events.ClientReady,
async (readyClient) => {

console.log(
  'Bot online: ' +
  readyClient.user.tag
);

const commands = [

  {
    name: 'job',
    description:
      'Generate a delivery job'
  },

  {
    name: 'stock',
    description:
      'View stock levels'
  },

  {
    name: 'stats',
    description:
      'View driver stats'
  }

];

const rest = new REST({
  version: '10'
}).setToken(
  process.env.TOKEN
);

await rest.put(

  Routes.applicationCommands(
    readyClient.user.id
  ),

  { body: commands }

);

console.log(
  'Commands registered'
);

updateStockBoard();

}

);

client.on(
Events.InteractionCreate,
async (interaction) => {

try {

  if (
    interaction.isChatInputCommand()
  ) {

    /* JOB */

    if (
      interaction.commandName ===
      'job'
    ) {

      if (
        activeJobs[
          interaction.user.id
        ]
      ) {

        await interaction.reply({

          content:
            '❌ Active delivery already assigned.',

          ephemeral: true

        });

        return;

      }

      const result =
        getBestJob();

      const store =
        result.store;

      const rdc =
        result.rdc;

      const jobId =
        generateJobId();

      activeJobs[
        interaction.user.id
      ] = {

        jobId,

        storeName:
          store.name,

        storeLocation:
          store.location

      };

      const embed =
        new EmbedBuilder()

          .setTitle(
            '🚛 JC LOGISTICS DISPATCH SYSTEM'
          )

          .setColor(
            getEmbedColor(
              store.stock
            )
          )

          .addFields(

            {

              name:
                '📦 JOB ID',

              value:
                jobId,

              inline: true

            },

            {

              name:
                '🏭 RDC',

              value:

                rdc.company +
                '\n' +
                rdc.location,

              inline: true

            },

            {

              name:
                '🏪 DELIVERY STORE',

              value:

                store.name +
                '\n' +
                store.location,

              inline: false

            },

            {

              name:
                '📊 STOCK STATUS',

              value:

                getTrafficLight(
                  store.stock
                ) +

                '\n' +

                store.stock +
                '%',

              inline: true

            },

            {

              name:
                '🛣 ROUTE DISTANCE',

              value:
                result.distance +
                ' km',

              inline: true

            }

          )

          .setFooter({

            text:
              'JC Logistics Freight Operations'

          })

          .setTimestamp();

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

        embeds: [embed],

        components: [row]

      });

      const dispatchChannel =
        await client.channels.fetch(
          DISPATCH_CHANNEL_ID
        );

      if (dispatchChannel) {

        await dispatchChannel.send({

          content:

            '🚛 ACTIVE DELIVERY\n\n' +

            interaction.user.username +

            ' assigned to ' +

            store.name +

            ' - ' +

            store.location

        });

      }

      return;

    }

    /* STOCK */

    if (
      interaction.commandName ===
      'stock'
    ) {

      await updateStockBoard();

      await interaction.reply({

        content:
          '📦 Stock board updated.',

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

      const embed =
        new EmbedBuilder()

          .setTitle(
            '📊 DRIVER PERFORMANCE'
          )

          .setColor(
            0x00cc66
          )

          .addFields(

            {

              name:
                '👤 DRIVER',

              value:
                interaction.user.username,

              inline: false

            },

            {

              name:
                '✅ COMPLETED JOBS',

              value:
                String(
                  completed
                ),

              inline: false

            }

          );

      await interaction.reply({

        embeds: [embed],

        ephemeral: true

      });

      return;

    }

  }

  /* BUTTONS */

  if (
    interaction.isButton()
  ) {

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

      updateStockBoard();

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

client.login(
process.env.TOKEN
);