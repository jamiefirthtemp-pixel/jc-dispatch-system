const {
Client,
GatewayIntentBits,
Events,
REST,
Routes,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
StringSelectMenuBuilder
} = require('discord.js');

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

/* CHANNELS */

const DISPATCH_CHANNEL_ID = '1497756268847304734';
const STOCK_CHANNEL_ID = '1497749476234760342';

/* RDCS */

const rdcs = [

{ id: 'dhl_ullapool', name: 'DHL', location: 'ULLAPOOL' },
{ id: 'dhl_oban', name: 'DHL', location: 'OBAN' },
{ id: 'dhl_aberdeen', name: 'DHL', location: 'ABERDEEN' },
{ id: 'dhl_newport', name: 'DHL', location: 'NEWPORT' },
{ id: 'dhl_portsmouth', name: 'DHL', location: 'PORTSMOUTH' },

{ id: 'dsv_newry', name: 'DSV', location: 'NEWRY' },
{ id: 'dsv_wexford', name: 'DSV', location: 'WEXFORD' },
{ id: 'dsv_waterford', name: 'DSV', location: 'WATERFORD' },
{ id: 'dsv_newport', name: 'DSV', location: 'NEWPORT' },

{ id: 'xpo_london', name: 'XPO LOGISTICS', location: 'LONDON' },
{ id: 'xpo_dover', name: 'XPO LOGISTICS', location: 'DOVER' },

{ id: 'culina_sligo', name: 'STOBART/CULINA', location: 'SLIGO' },
{ id: 'culina_ballymena', name: 'STOBART/CULINA', location: 'BALLYMENA' },
{ id: 'culina_ftwilliam', name: 'STOBART/CULINA', location: 'FT WILLIAM' },
{ id: 'culina_carlisle', name: 'STOBART/CULINA', location: 'CARLISLE' },
{ id: 'culina_ullapool', name: 'STOBART/CULINA', location: 'ULLAPOOL' },
{ id: 'culina_swansea', name: 'STOBART/CULINA', location: 'SWANSEA' },
{ id: 'culina_croydon', name: 'STOBART/CULINA', location: 'CROYDON' },
{ id: 'culina_portsmouth', name: 'STOBART/CULINA', location: 'PORTSMOUTH' }

];

/* STORES */

const stores = [

{ name: 'ALDI', location: 'PORTHMADOG', stock: 45 },
{ name: 'ALDI', location: 'WATERFORD', stock: 55 },
{ name: 'ALDI', location: 'SHEFFIELD', stock: 70 },
{ name: 'ALDI', location: 'NEWCASTLE', stock: 35 },
{ name: 'ALDI', location: 'LONDON', stock: 20 },

{ name: 'HAWES MARKETPLACE', location: 'HAWES', stock: 60 },

{ name: 'DREAMS', location: 'EXETER', stock: 50 },

{ name: 'HOMEBASE', location: 'EXETER', stock: 40 },
{ name: 'HOMEBASE', location: 'PLYMOUTH', stock: 65 },

{ name: 'IKEA', location: 'CROYDON', stock: 25 },
{ name: 'IKEA', location: 'DOUGLAS', stock: 45 },
{ name: 'IKEA', location: 'DUBLIN', stock: 35 },

{ name: 'LIDL', location: 'PERTH', stock: 60 },
{ name: 'LIDL', location: 'EDINBURGH', stock: 30 },
{ name: 'LIDL', location: 'WATERFORD', stock: 40 },
{ name: 'LIDL', location: 'SWANSEA', stock: 20 },
{ name: 'LIDL', location: 'SOUTHAMPTON', stock: 55 },
{ name: 'LIDL', location: 'CANTERBURY', stock: 45 },
{ name: 'LIDL', location: 'ANTRIM', stock: 25 },

{ name: 'MCDONALDS', location: 'LONDON', stock: 50 },

{ name: 'SAINSBURYS', location: 'EXETER', stock: 35 },
{ name: 'SAINSBURYS', location: 'NEWPORT', stock: 25 },
{ name: 'SAINSBURYS', location: 'LISBURN', stock: 40 },

{ name: 'TESCO', location: 'DUBLIN', stock: 30 },
{ name: 'TESCO', location: 'BELFAST', stock: 45 },
{ name: 'TESCO', location: 'ANTRIM', stock: 20 },
{ name: 'TESCO', location: 'DUMFRIES', stock: 50 },
{ name: 'TESCO', location: 'HOLYHEAD', stock: 35 },
{ name: 'TESCO', location: 'PORTHMADOG', stock: 25 },
{ name: 'TESCO', location: 'ABERYSTWYTH', stock: 40 },
{ name: 'TESCO', location: 'FOLKESTONE', stock: 30 },
{ name: 'TESCO', location: 'LONDON', stock: 15 },
{ name: 'TESCO', location: 'CHELMSFORD', stock: 55 },
{ name: 'TESCO', location: 'NORWICH', stock: 45 },
{ name: 'TESCO', location: 'ULLAPOOL', stock: 20 },
{ name: 'TESCO', location: 'STORNOWAY', stock: 35 }

];

const activeJobs = {};
const driverStats = {};

function getTraffic(stock) {

if (stock <= 30) return '🔴 LOW';
if (stock <= 60) return '🟡 MEDIUM';

return '🟢 HEALTHY';

}

function getColor(stock) {

if (stock <= 30) return 0xff0000;
if (stock <= 60) return 0xffcc00;

return 0x00cc66;

}

function generateJobId() {

return 'J-' +
Math.floor(Math.random() * 100000);

}

function getLowestStockStore() {

return [...stores]
.sort((a, b) => a.stock - b.stock)[0];

}

function increaseStock(name, location) {

const store = stores.find(s =>
s.name === name &&
s.location === location
);

if (!store) return;

store.stock += 20;

if (store.stock > 100) {
store.stock = 100;
}

}

function decreaseStock() {

stores.forEach(store => {

store.stock -= 5;

if (store.stock < 0) {
  store.stock = 0;
}

});

}

async function updateStockBoard() {

const channel =
await client.channels.fetch(
STOCK_CHANNEL_ID
);

if (!channel) return;

const embed = new EmbedBuilder()

.setTitle(
  '📦 JC LOGISTICS STOCK CONTROL'
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
    getTraffic(store.stock) +
    ' (' +
    store.stock +
    '%)',

  inline: false

});

});

await channel.send({
embeds: [embed]
});

}

setInterval(() => {

decreaseStock();

updateStockBoard();

}, 300000);

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
    description: 'Generate delivery job'
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
            '❌ You already have an active job.',

          ephemeral: true

        });

        return;

      }

      const menu =
        new StringSelectMenuBuilder()

          .setCustomId(
            'select_rdc'
          )

          .setPlaceholder(
            'Select RDC'
          )

          .addOptions(

            rdcs.map(rdc => ({

              label:
                rdc.name +
                ' - ' +
                rdc.location,

              value: rdc.id

            }))

          );

      const row =
        new ActionRowBuilder()
          .addComponents(menu);

      await interaction.reply({

        content:
          '🏭 Select RDC',

        components: [row],

        ephemeral: true

      });

      return;

    }

  }

  if (
    interaction.isStringSelectMenu()
  ) {

    if (
      interaction.customId ===
      'select_rdc'
    ) {

      const rdc =
        rdcs.find(
          r =>
            r.id ===
            interaction.values[0]
        );

      const store =
        getLowestStockStore();

      const jobId =
        generateJobId();

      activeJobs[
        interaction.user.id
      ] = {

        jobId,

        storeName:
          store.name,

        storeLocation:
          store.location,

        rdc:
          rdc.location

      };

      const embed =
        new EmbedBuilder()

          .setTitle(
            '🚛 JC LOGISTICS DISPATCH'
          )

          .setColor(
            getColor(
              store.stock
            )
          )

          .addFields(

            {
              name: '📦 JOB ID',
              value: jobId,
              inline: true
            },

            {
              name: '🏭 RDC',
              value:
                rdc.name +
                ' - ' +
                rdc.location,
              inline: true
            },

            {
              name: '🏪 STORE',
              value:
                store.name +
                ' - ' +
                store.location
            },

            {
              name: '📊 PRIORITY',
              value:
                getTraffic(
                  store.stock
                ) +
                ' (' +
                store.stock +
                '%)'
            },

            {
              name: '👤 DRIVER',
              value:
                interaction.user.username
            }

          )

          .setFooter({

            text:
              'JC Logistics Dispatch Network'

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

      await interaction.update({

        embeds: [embed],

        components: [row]

      });

      const dispatch =
        await client.channels.fetch(
          DISPATCH_CHANNEL_ID
        );

      if (dispatch) {

        const activeEmbed =
          new EmbedBuilder()

            .setTitle(
              '🚚 ACTIVE DELIVERY'
            )

            .setColor(0x0099ff)

            .addFields(

              {
                name: '👤 DRIVER',
                value:
                  interaction.user.username,
                inline: true
              },

              {
                name: '📦 JOB ID',
                value: jobId,
                inline: true
              },

              {
                name: '🏭 RDC',
                value:
                  rdc.location
              },

              {
                name: '🏪 DELIVERY',
                value:
                  store.name +
                  ' - ' +
                  store.location
              },

              {
                name: '📊 STATUS',
                value:
                  'IN TRANSIT'
              }

            )

            .setTimestamp();

        await dispatch.send({
          embeds: [activeEmbed]
        });

      }

      return;

    }

  }

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
            'No active job.',

          ephemeral: true

        });

        return;

      }

      increaseStock(

        job.storeName,

        job.storeLocation

      );

      updateStockBoard();

      delete activeJobs[
        interaction.user.id
      ];

      await interaction.reply({

        content:
          '✅ DELIVERY COMPLETED',

        ephemeral: true

      });

      const dispatch =
        await client.channels.fetch(
          DISPATCH_CHANNEL_ID
        );

      if (dispatch) {

        const completedEmbed =
          new EmbedBuilder()

            .setTitle(
              '✅ DELIVERY COMPLETED'
            )

            .setColor(0x00cc66)

            .addFields(

              {
                name: '👤 DRIVER',
                value:
                  interaction.user.username,
                inline: true
              },

              {
                name: '🏪 STORE',
                value:
                  job.storeName +
                  ' - ' +
                  job.storeLocation
              },

              {
                name: '🏭 RDC',
                value:
                  job.rdc
              },

              {
                name: '📊 RESULT',
                value:
                  'Store stock replenished'
              }

            )

            .setTimestamp();

        await dispatch.send({
          embeds: [completedEmbed]
        });

      }

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