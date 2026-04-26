require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");

// ======================================================
// CLIENT
// ======================================================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ======================================================
// CONFIG
// ======================================================

const CLIENT_ID = "1497676061083697313";

const JOB_CHANNEL_ID = "1497716778791342120";

const STOCK_CHANNEL_ID = "1497749476234760342";

const ACTIVE_JOBS_CHANNEL_ID = "1497756268847304734";

// ======================================================
// RDCS
// ======================================================

const rdcs = [

  // DHL

  "DHL - Ullapool",
  "DHL - Oban",
  "DHL - Aberdeen",
  "DHL - Newport",
  "DHL - Portsmouth",

  // DSV

  "DSV - Newry",
  "DSV - Wexford",
  "DSV - Waterford",
  "DSV - Newport",

  // XPO

  "XPO Logistics - London",
  "XPO Logistics - Dover",

  // STOBART / CULINA

  "Stobart/Culina - Sligo",
  "Stobart/Culina - Ballymena",
  "Stobart/Culina - Fort William",
  "Stobart/Culina - Carlisle",
  "Stobart/Culina - Ullapool",
  "Stobart/Culina - Swansea",
  "Stobart/Culina - Croydon",
  "Stobart/Culina - Portsmouth"

];

// ======================================================
// STORES
// ======================================================

const stores = [

  // TESCO

  { name: "Tesco - Dublin", stock: 70 },
  { name: "Tesco - Belfast", stock: 70 },
  { name: "Tesco - Antrim", stock: 70 },
  { name: "Tesco - Dumfries", stock: 70 },
  { name: "Tesco - Holyhead", stock: 70 },
  { name: "Tesco - Porthmadog", stock: 70 },
  { name: "Tesco - Aberystwyth", stock: 70 },
  { name: "Tesco - Folkestone", stock: 70 },
  { name: "Tesco - London", stock: 70 },
  { name: "Tesco - Chelmsford", stock: 70 },
  { name: "Tesco - Norwich", stock: 70 },
  { name: "Tesco - Ullapool", stock: 70 },
  { name: "Tesco - Stornoway", stock: 70 },

  // ALDI

  { name: "Aldi - Porthmadog", stock: 70 },
  { name: "Aldi - Waterford", stock: 70 },
  { name: "Aldi - Sheffield", stock: 70 },
  { name: "Aldi - Newcastle", stock: 70 },
  { name: "Aldi - London", stock: 70 },

  // LIDL

  { name: "Lidl - Perth", stock: 70 },
  { name: "Lidl - Edinburgh", stock: 70 },
  { name: "Lidl - Waterford", stock: 70 },
  { name: "Lidl - Swansea", stock: 70 },
  { name: "Lidl - Southampton", stock: 70 },
  { name: "Lidl - Canterbury", stock: 70 },
  { name: "Lidl - Antrim", stock: 70 },

  // SAINSBURY'S

  { name: "Sainsbury's - Exeter", stock: 70 },
  { name: "Sainsbury's - Newport", stock: 70 },
  { name: "Sainsbury's - Lisburn", stock: 70 },

  // IKEA

  { name: "IKEA - Croydon", stock: 70 },
  { name: "IKEA - Douglas", stock: 70 },
  { name: "IKEA - Dublin", stock: 70 },

  // DREAMS

  { name: "Dreams - Exeter", stock: 70 },

  // HOMEBASE

  { name: "Homebase - Exeter", stock: 70 },
  { name: "Homebase - Plymouth", stock: 70 },

  // MCDONALDS

  { name: "McDonald's - London", stock: 70 },

  // HAWES MARKETPLACE

  { name: "Hawes Marketplace - Hawes", stock: 70 }

];

// ======================================================
// DATA
// ======================================================

let selectedRdc = {};
let activeDrivers = {};
let activeJobs = [];
let driverStats = {};

// ======================================================
// STATUS
// ======================================================

function getStatus(stock) {

  if (stock <= 30) return "🔴 CRITICAL";

  if (stock <= 60) return "🟡 LOW";

  return "🟢 HEALTHY";

}

// ======================================================
// DAILY STOCK DEPLETION
// ======================================================

setInterval(() => {

  stores.forEach(store => {

    store.stock = Math.max(
      0,
      Math.floor(store.stock * 0.86)
    );

  });

  updateStockBoard();

  console.log(
    "14% stock depletion complete."
  );

}, 86400000);

// ======================================================
// STOCK BOARD
// ======================================================

async function updateStockBoard() {

  try {

    const channel =
      await client.channels.fetch(
        STOCK_CHANNEL_ID
      );

    if (!channel) return;

    const sorted =
      [...stores].sort(
        (a, b) => a.stock - b.stock
      );

    let content =
`📦 JC LOGISTICS STOCK BOARD

`;

    sorted.forEach(store => {

      content +=
`${getStatus(store.stock)} | ${store.name} | ${store.stock}%\n`;

    });

    const messages =
      await channel.messages.fetch({
        limit: 1
      });

    const lastMessage =
      messages.first();

    if (
      lastMessage &&
      lastMessage.author.id ===
      client.user.id
    ) {

      await lastMessage.edit(content);

    } else {

      await channel.send(content);

    }

  } catch (error) {

    console.error(
      "Stock board error:",
      error
    );

  }

}

// ======================================================
// DISPATCH TERMINAL
// ======================================================

async function createDispatchTerminal() {

  try {

    const channel =
      await client.channels.fetch(
        JOB_CHANNEL_ID
      );

    if (!channel) return;

    const menu =
      new StringSelectMenuBuilder()

        .setCustomId("rdc_select")

        .setPlaceholder(
          "Select RDC"
        )

        .addOptions(

          rdcs.map(rdc => ({

            label: rdc,

            value: rdc

          }))

        );

    const row1 =
      new ActionRowBuilder()
        .addComponents(menu);

    const row2 =
      new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()

            .setCustomId(
              "generate_job"
            )

            .setLabel(
              "Generate Dispatch"
            )

            .setStyle(
              ButtonStyle.Primary
            )

        );

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

    const content =
`┌──────────────────────────────┐
     JC LOGISTICS TERMINAL
└──────────────────────────────┘

Select RDC below
then generate dispatch.
`;

    if (existing) {

      await existing.edit({

        content,

        components: [
          row1,
          row2
        ]

      });

    } else {

      await channel.send({

        content,

        components: [
          row1,
          row2
        ]

      });

    }

  } catch (error) {

    console.error(
      "Dispatch terminal error:",
      error
    );

  }

}

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {

  console.log(
    `Bot online: ${client.user.tag}`
  );

  await createDispatchTerminal();

  await updateStockBoard();

});

// ======================================================
// INTERACTIONS
// ======================================================

client.on(
  "interactionCreate",
  async interaction => {

    try {

      // ==================================================
      // RDC SELECT
      // ==================================================

      if (
        interaction.isStringSelectMenu()
      ) {

        if (
          interaction.customId ===
          "rdc_select"
        ) {

          selectedRdc[
            interaction.user.id
          ] =
            interaction.values[0];

          return await interaction.reply({

            content:
`✅ RDC Selected

${interaction.values[0]}`,

            ephemeral: true

          });

        }

      }

      // ==================================================
      // BUTTONS
      // ==================================================

      if (
        interaction.isButton()
      ) {

        // ==============================================
        // GENERATE JOB
        // ==============================================

        if (
          interaction.customId ===
          "generate_job"
        ) {

          if (
            activeDrivers[
              interaction.user.id
            ]
          ) {

            return await interaction.reply({

              content:
                "❌ You already have an active job.",

              ephemeral: true

            });

          }

          const rdc =
            selectedRdc[
              interaction.user.id
            ];

          if (!rdc) {

            return await interaction.reply({

              content:
                "❌ Select an RDC first.",

              ephemeral: true

            });

          }

          // LOWEST STOCK STORE

          const sorted =
            [...stores].sort(
              (a, b) =>
                a.stock - b.stock
            );

          const store =
            sorted[0];

          const jobId =
            "J-" +
            Math.floor(
              Math.random() *
              100000
            );

          activeDrivers[
            interaction.user.id
          ] = true;

          activeJobs.push({

            id: jobId,

            user:
              interaction.user.id,

            store:
              store.name

          });

          const row =
            new ActionRowBuilder()

              .addComponents(

                new ButtonBuilder()

                  .setCustomId(
                    `complete_${jobId}`
                  )

                  .setLabel(
                    "Complete Delivery"
                  )

                  .setStyle(
                    ButtonStyle.Success
                  )

              );

          const content =
`┌──────────────────────────────┐
     JC LOGISTICS DISPATCH
└──────────────────────────────┘

🚚 JOB ID:
${jobId}

🏭 RDC:
${rdc}

🏪 STORE:
${store.name}

📊 PRIORITY:
${getStatus(store.stock)}

📦 STOCK:
${store.stock}%

📋 STATUS:
IN TRANSIT
`;

          await interaction.reply({

            content,

            components: [row]

          });

          // ACTIVE JOB CHANNEL

          const activeChannel =
            await client.channels.fetch(
              ACTIVE_JOBS_CHANNEL_ID
            );

          if (activeChannel) {

            await activeChannel.send(
`🚚 ACTIVE JOB

Driver:
<@${interaction.user.id}>

JOB ID:
${jobId}

STORE:
${store.name}`
            );

          }

        }

        // ==============================================
        // COMPLETE DELIVERY
        // ==============================================

        if (
          interaction.customId.startsWith(
            "complete_"
          )
        ) {

          const jobId =
            interaction.customId.split(
              "_"
            )[1];

          const job =
            activeJobs.find(
              j => j.id === jobId
            );

          if (!job) {

            return await interaction.reply({

              content:
                "❌ Job not found.",

              ephemeral: true

            });

          }

          const store =
            stores.find(
              s =>
                s.name ===
                job.store
            );

          // RESTOCK

          store.stock =
            Math.min(
              100,
              store.stock + 25
            );

          delete activeDrivers[
            interaction.user.id
          ];

          // DRIVER STATS

          if (
            !driverStats[
              interaction.user.id
            ]
          ) {

            driverStats[
              interaction.user.id
            ] = 0;

          }

          driverStats[
            interaction.user.id
          ]++;

          await updateStockBoard();

          await interaction.update({

            content:
`✅ DELIVERY COMPLETED

🏪 STORE:
${store.name}

📦 UPDATED STOCK:
${store.stock}%

📈 DRIVER JOBS COMPLETED:
${driverStats[
  interaction.user.id
]}
`,

            components: []

          });

        }

      }

    } catch (error) {

      console.error(
        "INTERACTION ERROR:",
        error
      );

    }

  }
);

// ======================================================
// LOGIN
// ======================================================

client.login(process.env.TOKEN);