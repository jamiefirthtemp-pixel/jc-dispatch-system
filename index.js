require("dotenv").config();

const fs = require("fs");

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
// CHANNELS
// ======================================================

const JOB_CHANNEL_ID = "1497716778791342120";
const STOCK_CHANNEL_ID = "1497749476234760342";
const ACTIVE_JOBS_CHANNEL_ID = "1497756268847304734";
const LEADERBOARD_CHANNEL_ID = "1497941626260295803";
const ALERTS_CHANNEL_ID = "1497948012603904000";

// ======================================================
// SAVE FILES
// ======================================================

const DRIVER_STATS_FILE = "./driverStats.json";
const ACTIVE_DRIVERS_FILE = "./activeDrivers.json";
const ACTIVE_JOBS_FILE = "./activeJobs.json";

// ======================================================
// SAVE / LOAD
// ======================================================

function loadData(file, fallback) {

  try {

    if (fs.existsSync(file)) {

      return JSON.parse(
        fs.readFileSync(file)
      );

    }

    return fallback;

  } catch {

    return fallback;

  }

}

function saveData(file, data) {

  fs.writeFileSync(
    file,
    JSON.stringify(
      data,
      null,
      2
    )
  );

}

// ======================================================
// DATA
// ======================================================

let selectedRdc = {};

let activeDrivers =
  loadData(
    ACTIVE_DRIVERS_FILE,
    {}
  );

let activeJobs =
  loadData(
    ACTIVE_JOBS_FILE,
    []
  );

let driverStats =
  loadData(
    DRIVER_STATS_FILE,
    {}
  );

let activeEmergency =
  null;

// ======================================================
// JOB TYPES
// ======================================================

const jobTypes = [

  {
    name:
      "📦 Standard Delivery",

    stockBoost: 25,

    points: 1,

    priority:
      "STANDARD"

  },

  {
    name:
      "🚨 Emergency Restock",

    stockBoost: 40,

    points: 3,

    priority:
      "CRITICAL"

  },

  {
    name:
      "❄ Refrigerated Goods",

    stockBoost: 30,

    points: 2,

    priority:
      "HIGH"

  },

  {
    name:
      "⚡ Critical Supply Transfer",

    stockBoost: 50,

    points: 4,

    priority:
      "SEVERE"

  }

];

// ======================================================
// RDCS
// ======================================================

const rdcs = [

  "DHL - Ullapool",
  "DHL - Oban",
  "DHL - Aberdeen",
  "DHL - Newport",
  "DHL - Portsmouth",

  "DSV - Newry",
  "DSV - Wexford",
  "DSV - Waterford",
  "DSV - Newport",

  "XPO Logistics - London",
  "XPO Logistics - Dover",

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

  { name: "Tesco - Dublin", stock: 70, region: "Ireland", company: "Tesco" },
  { name: "Tesco - Belfast", stock: 70, region: "Northern Ireland", company: "Tesco" },
  { name: "Tesco - Antrim", stock: 70, region: "Northern Ireland", company: "Tesco" },
  { name: "Tesco - Dumfries", stock: 70, region: "Scotland", company: "Tesco" },
  { name: "Tesco - Holyhead", stock: 70, region: "Wales", company: "Tesco" },
  { name: "Tesco - Porthmadog", stock: 70, region: "Wales", company: "Tesco" },
  { name: "Tesco - Aberystwyth", stock: 70, region: "Wales", company: "Tesco" },
  { name: "Tesco - Folkestone", stock: 70, region: "South England", company: "Tesco" },
  { name: "Tesco - London", stock: 70, region: "South England", company: "Tesco" },
  { name: "Tesco - Chelmsford", stock: 70, region: "South England", company: "Tesco" },
  { name: "Tesco - Norwich", stock: 70, region: "South England", company: "Tesco" },
  { name: "Tesco - Ullapool", stock: 70, region: "Scotland", company: "Tesco" },
  { name: "Tesco - Stornoway", stock: 70, region: "Scotland", company: "Tesco" },

  { name: "Aldi - Porthmadog", stock: 70, region: "Wales", company: "Aldi" },
  { name: "Aldi - Waterford", stock: 70, region: "Ireland", company: "Aldi" },
  { name: "Aldi - Sheffield", stock: 70, region: "North England", company: "Aldi" },
  { name: "Aldi - Newcastle", stock: 70, region: "North England", company: "Aldi" },
  { name: "Aldi - London", stock: 70, region: "South England", company: "Aldi" },

  { name: "Lidl - Perth", stock: 70, region: "Scotland", company: "Lidl" },
  { name: "Lidl - Edinburgh", stock: 70, region: "Scotland", company: "Lidl" },
  { name: "Lidl - Waterford", stock: 70, region: "Ireland", company: "Lidl" },
  { name: "Lidl - Swansea", stock: 70, region: "Wales", company: "Lidl" },
  { name: "Lidl - Southampton", stock: 70, region: "South England", company: "Lidl" },
  { name: "Lidl - Canterbury", stock: 70, region: "South England", company: "Lidl" },
  { name: "Lidl - Antrim", stock: 70, region: "Northern Ireland", company: "Lidl" },

  { name: "Sainsbury's - Exeter", stock: 70, region: "South England", company: "Sainsbury's" },
  { name: "Sainsbury's - Newport", stock: 70, region: "Wales", company: "Sainsbury's" },
  { name: "Sainsbury's - Lisburn", stock: 70, region: "Northern Ireland", company: "Sainsbury's" },

  { name: "IKEA - Croydon", stock: 70, region: "South England", company: "IKEA" },
  { name: "IKEA - Douglas", stock: 70, region: "Isle of Man", company: "IKEA" },
  { name: "IKEA - Dublin", stock: 70, region: "Ireland", company: "IKEA" },

  { name: "Dreams - Exeter", stock: 70, region: "South England", company: "Dreams" },

  { name: "Homebase - Exeter", stock: 70, region: "South England", company: "Homebase" },
  { name: "Homebase - Plymouth", stock: 70, region: "South England", company: "Homebase" },

  { name: "McDonald's - London", stock: 70, region: "South England", company: "McDonald's" },

  { name: "Hawes Marketplace - Hawes", stock: 70, region: "North England", company: "Hawes Marketplace" }

];

// ======================================================
// HELPERS
// ======================================================

function getStatus(stock) {

  if (stock <= 30) return "🔴";

  if (stock <= 60) return "🟡";

  return "🟢";

}

function getJobType(emergency) {

  if (emergency) {

    return jobTypes.find(
      j =>
        j.name ===
        "🚨 Emergency Restock"
    );

  }

  return jobTypes[
    Math.floor(
      Math.random() *
      jobTypes.length
    )
  ];

}

function getRdcRegion(rdc) {

  if (
    rdc.includes("Aberdeen") ||
    rdc.includes("Ullapool") ||
    rdc.includes("Oban") ||
    rdc.includes("Fort William")
  ) return "Scotland";

  if (
    rdc.includes("Newry") ||
    rdc.includes("Ballymena")
  ) return "Northern Ireland";

  if (
    rdc.includes("Wexford") ||
    rdc.includes("Waterford") ||
    rdc.includes("Sligo")
  ) return "Ireland";

  if (
    rdc.includes("Swansea")
  ) return "Wales";

  return "South England";

}

function groupStores() {

  const grouped = {};

  stores.forEach(store => {

    if (!grouped[store.company]) {

      grouped[store.company] = [];

    }

    grouped[store.company].push(store);

  });

  return grouped;

}

function getSmartStore(rdc) {

  if (activeEmergency) {

    return activeEmergency.store;

  }

  const region =
    getRdcRegion(rdc);

  let regionalStores =
    stores.filter(
      store =>
        store.region === region
    );

  if (
    regionalStores.length === 0
  ) {

    regionalStores =
      [...stores];

  }

  regionalStores.sort(
    (a, b) =>
      a.stock - b.stock
  );

  return regionalStores[0];

}

// ======================================================
// ALERTS
// ======================================================

async function sendAlert(message) {

  try {

    const channel =
      await client.channels.fetch(
        ALERTS_CHANNEL_ID
      );

    if (!channel) return;

    await channel.send(message);

  } catch (error) {

    console.error(error);

  }

}

// ======================================================
// EMERGENCY EVENTS
// ======================================================

async function triggerEmergencyEvent() {

  if (activeEmergency) return;

  const store =
    stores[
      Math.floor(
        Math.random() *
        stores.length
      )
    ];

  const events = [

    "Demand Surge",
    "Port Delay",
    "Supply Chain Failure",
    "Weather Disruption",
    "Panic Buying"

  ];

  const event =
    events[
      Math.floor(
        Math.random() *
        events.length
      )
    ];

  store.stock =
    Math.max(
      0,
      store.stock - 35
    );

  activeEmergency = {

    event,
    store

  };

  await sendAlert(

`🚨 SUPPLY CHAIN ALERT

⚠ EVENT:
${event}

🏪 STORE:
${store.name}

🌍 REGION:
${store.region}

📦 STOCK:
${store.stock}%

🚛 PRIORITY RESTOCK REQUIRED`

  );

}

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

    const grouped =
      groupStores();

    let content =
`╔════════════════════════╗
      JC LOGISTICS
        STOCK BOARD
╚════════════════════════╝

`;

    if (activeEmergency) {

      content +=
`🚨 ACTIVE EMERGENCY
${activeEmergency.store.name}
${activeEmergency.event}

`;

    }

    Object.keys(grouped)
      .forEach(company => {

        content +=
`\n📦 ${company}
━━━━━━━━━━━━━━━━━━
`;

        grouped[company]

          .sort(
            (a, b) =>
              a.stock - b.stock
          )

          .forEach(store => {

            const short =
              store.name.split(
                " - "
              )[1];

            content +=
`${getStatus(store.stock)} ${short} — ${store.stock}%
`;

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

      await existing.edit(content);

    } else {

      await channel.send(content);

    }

  } catch (error) {

    console.error(error);

  }

}

// ======================================================
// LEADERBOARD
// ======================================================

async function updateLeaderboard() {

  try {

    const channel =
      await client.channels.fetch(
        LEADERBOARD_CHANNEL_ID
      );

    if (!channel) return;

    const sorted =
      Object.entries(driverStats)

        .sort(
          (a, b) =>
            b[1] - a[1]
        );

    let content =
`🏆 JC LOGISTICS LEADERBOARD

`;

    if (sorted.length === 0) {

      content +=
`No deliveries completed.`;

    } else {

      sorted.forEach(
        (
          [userId, count],
          index
        ) => {

          let medal = "▫️";

          if (index === 0)
            medal = "🥇";

          if (index === 1)
            medal = "🥈";

          if (index === 2)
            medal = "🥉";

          content +=
`${medal} <@${userId}> — ${count} points
`;

        }
      );

    }

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

      await existing.edit(content);

    } else {

      await channel.send(content);

    }

  } catch (error) {

    console.error(error);

  }

}

// ======================================================
// TERMINAL
// ======================================================

async function createDispatchTerminal() {

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

  const content =
`┌──────────────────────────────┐
     JC LOGISTICS TERMINAL
└──────────────────────────────┘

Select RDC below
then generate dispatch.
`;

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

}

// ======================================================
// STOCK DRAIN
// ======================================================

setInterval(async () => {

  stores.forEach(store => {

    let drain =
      Math.floor(
        Math.random() * 10
      ) + 5;

    if (
      store.name.includes(
        "London"
      )
    ) {

      drain += 8;

    }

    store.stock =
      Math.max(
        0,
        store.stock - drain
      );

  });

  if (Math.random() < 0.3) {

    await triggerEmergencyEvent();

  }

  await updateStockBoard();

}, 86400000);

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {

  console.log(
    `Bot online: ${client.user.tag}`
  );

  await createDispatchTerminal();

  await updateStockBoard();

  await updateLeaderboard();

});

// ======================================================
// INTERACTIONS
// ======================================================

client.on(
  "interactionCreate",

  async interaction => {

    try {

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

      if (
        interaction.isButton()
      ) {

        // ==================================================
        // GENERATE JOB
        // ==================================================

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

          const store =
            getSmartStore(rdc);

          const emergency =
            activeEmergency &&
            store.name ===
            activeEmergency.store.name;

          const jobType =
            getJobType(
              emergency
            );

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
              store.name,

            stockBoost:
              jobType.stockBoost,

            points:
              jobType.points

          });

          saveData(
            ACTIVE_DRIVERS_FILE,
            activeDrivers
          );

          saveData(
            ACTIVE_JOBS_FILE,
            activeJobs
          );

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

          const activeChannel =
            await client.channels.fetch(
              ACTIVE_JOBS_CHANNEL_ID
            );

          const content =
`┌──────────────────────────────┐
      ACTIVE DISPATCH
└──────────────────────────────┘

👤 DRIVER:
<@${interaction.user.id}>

🚚 JOB ID:
${jobId}

📦 JOB TYPE:
${jobType.name}

🏭 RDC:
${rdc}

🌍 REGION:
${store.region}

🏪 STORE:
${store.name}

⚠ PRIORITY:
${jobType.priority}

📈 STOCK IMPACT:
+${jobType.stockBoost}%

🏆 REWARD:
${jobType.points} points

📋 STATUS:
IN TRANSIT
`;

          await activeChannel.send({

            content,

            components: [row]

          });

          await interaction.reply({

            content:
              "✅ Dispatch generated.",

            ephemeral: true

          });

        }

        // ==================================================
        // COMPLETE DELIVERY
        // ==================================================

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
              j =>
                j.id === jobId
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

          store.stock =
            Math.min(
              100,
              store.stock +
              job.stockBoost
            );

          delete activeDrivers[
            job.user
          ];

          activeJobs =
            activeJobs.filter(
              j =>
                j.id !== jobId
            );

          if (
            !driverStats[
              job.user
            ]
          ) {

            driverStats[
              job.user
            ] = 0;

          }

          driverStats[
            job.user
          ] +=
            job.points;

          saveData(
            DRIVER_STATS_FILE,
            driverStats
          );

          saveData(
            ACTIVE_DRIVERS_FILE,
            activeDrivers
          );

          saveData(
            ACTIVE_JOBS_FILE,
            activeJobs
          );

          if (
            activeEmergency &&
            activeEmergency.store.name ===
            store.name
          ) {

            await sendAlert(

`✅ EMERGENCY RESOLVED

🏪 STORE:
${store.name}

📦 STOCK:
${store.stock}%

Priority restock completed.`

            );

            activeEmergency =
              null;

          }

          await updateStockBoard();

          await updateLeaderboard();

          const disabledRow =
            new ActionRowBuilder()

              .addComponents(

                new ButtonBuilder()

                  .setCustomId(
                    `complete_${jobId}`
                  )

                  .setLabel(
                    "Delivery Complete"
                  )

                  .setStyle(
                    ButtonStyle.Secondary
                  )

                  .setDisabled(true)

              );

          await interaction.update({

            content:
`✅ DELIVERY COMPLETE

🚚 JOB ID:
${jobId}

🏪 STORE:
${store.name}

📦 UPDATED STOCK:
${store.stock}%

🏆 DRIVER POINTS:
${driverStats[job.user]}
`,

            components: [
              disabledRow
            ]

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

client.login(
  process.env.TOKEN
);