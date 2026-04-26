require("dotenv").config();

const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits
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

let activeEmergency = null;

let lastCompanyDispatched = null;

// ======================================================
// TEMP REPLY
// ======================================================

async function tempReply(
  interaction,
  content,
  time = 3000
) {

  await interaction.reply({

    content,
    ephemeral: true

  });

  setTimeout(async () => {

    try {

      await interaction.deleteReply();

    } catch {}

  }, time);

}

// ======================================================
// CONTRACTS
// ======================================================

const contracts = [

  {
    company: "Tesco",
    bonusPoints: 1,
    priorityChance: 0.35
  },

  {
    company: "Aldi",
    bonusPoints: 1,
    priorityChance: 0.20
  },

  {
    company: "Lidl",
    bonusPoints: 1,
    priorityChance: 0.20
  },

  {
    company: "Sainsbury's",
    bonusPoints: 2,
    priorityChance: 0.15
  },

  {
    company: "IKEA",
    bonusPoints: 2,
    priorityChance: 0.10
  }

];

// ======================================================
// INCIDENT SEVERITY
// ======================================================

const severityLevels = [

  {
    name: "MINOR",
    stockLoss: 15
  },

  {
    name: "MAJOR",
    stockLoss: 30
  },

  {
    name: "CRITICAL",
    stockLoss: 50
  },

  {
    name: "NATIONAL SUPPLY CRISIS",
    stockLoss: 70
  }

];

// ======================================================
// ALERT SCENARIOS
// ======================================================

const alertScenarios = [

  {
    title: "Ferry Cancellation",
    impact:
      "Irish freight crossings suspended due to severe weather.",
    action:
      "Emergency rerouting required."
  },

  {
    title: "Power Failure",
    impact:
      "Store refrigeration systems offline.",
    action:
      "Priority chilled goods delivery required."
  },

  {
    title: "Warehouse Conveyor Failure",
    impact:
      "Distribution processing delays confirmed.",
    action:
      "Backup RDC dispatching recommended."
  },

  {
    title: "Port Congestion",
    impact:
      "Inbound container shipments delayed.",
    action:
      "Critical stock protection procedures active."
  },

  {
    title: "Motorway Closure",
    impact:
      "Primary freight routes blocked by collision incident.",
    action:
      "Regional dispatch rerouting required."
  },

  {
    title: "Unexpected Demand Surge",
    impact:
      "Store experiencing rapid stock depletion.",
    action:
      "Immediate replenishment dispatch required."
  },

  {
    title: "Cold Storage Failure",
    impact:
      "Temperature-sensitive goods at risk.",
    action:
      "Emergency refrigerated transport needed."
  },

  {
    title: "Driver Shortage",
    impact:
      "Regional delivery capacity reduced.",
    action:
      "Priority dispatch allocation active."
  }

];

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

  // multi-stage incident escalation

  if (
    activeEmergency &&
    Math.random() < 0.25
  ) {

    const nearbyStores =
      stores.filter(
        store =>
          store.region ===
          activeEmergency.store.region &&
          store.name !==
          activeEmergency.store.name
      );

    nearbyStores.forEach(store => {

      store.stock = Math.max(
        0,
        store.stock - 10
      );

    });

  }

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

  let filtered = regionalStores;

  if (lastCompanyDispatched) {

    const withoutLastCompany =
      regionalStores.filter(
        store =>
          store.company !==
          lastCompanyDispatched
      );

    if (
      withoutLastCompany.length > 0
    ) {

      filtered =
        withoutLastCompany;

    }

  }

  const topChoices =
    filtered.slice(0, 5);

  const weightedChoices =
    topChoices.sort(
      (a, b) => {

        const aContract =
          contracts.find(
            c =>
              c.company ===
              a.company
          );

        const bContract =
          contracts.find(
            c =>
              c.company ===
              b.company
          );

        const aWeight =
          a.stock -
          ((aContract?.priorityChance || 0) * 100);

        const bWeight =
          b.stock -
          ((bContract?.priorityChance || 0) * 100);

        return aWeight - bWeight;

      }
    );

  const chosen =
    weightedChoices[
      Math.floor(
        Math.random() *
        weightedChoices.length
      )
    ];

  lastCompanyDispatched =
    chosen.company;

  return chosen;

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

  const scenario =
    alertScenarios[
      Math.floor(
        Math.random() *
        alertScenarios.length
      )
    ];

  const severity =
    severityLevels[
      Math.floor(
        Math.random() *
        severityLevels.length
      )
    ];

  store.stock =
    Math.max(
      0,
      store.stock -
      severity.stockLoss
    );

  activeEmergency = {

    event:
      scenario.title,

    store

  };

  await sendAlert(
`🚨 SUPPLY CHAIN ALERT

⚠ INCIDENT:
${scenario.title}

🏪 STORE:
${store.name}

🌍 REGION:
${store.region}

🚨 SEVERITY:
${severity.name}

📉 IMPACT:
${scenario.impact}

🚛 RESPONSE:
${scenario.action}

📦 CURRENT STOCK:
${store.stock}%`
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
`
🚨 ACTIVE INCIDENT
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
        ([userId, count], index) => {

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
// READY
// ======================================================

client.once("ready", async () => {

  console.log(
    `Bot online: ${client.user.tag}`
  );

  await client.application.commands.create(
    new SlashCommandBuilder()
      .setName("alert")
      .setDescription(
        "Trigger a supply chain incident"
      )
      .setDefaultMemberPermissions(
        PermissionFlagsBits.Administrator)
      .toJSON()
  );

  await createDispatchTerminal();

  await updateStockBoard();

  await updateLeaderboard();

});

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
// INTERACTIONS
// ======================================================

client.on(
  "interactionCreate",
  async interaction => {

    try {

      // ================================================
      // ALERT COMMAND
      // ================================================

      if (
        interaction.isChatInputCommand()
      ) {

        if (
          interaction.commandName ===
          "alert"
        ) {

          await triggerEmergencyEvent();

          return await tempReply(
            interaction,
            "🚨 Alert triggered."
          );

        }

      }

      // ================================================
      // SELECT MENU
      // ================================================

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

          return await tempReply(
            interaction,
`✅ RDC Selected

${interaction.values[0]}`
          );

        }

      }

      // ================================================
      // BUTTONS
      // ================================================

      if (
        interaction.isButton()
      ) {

        // ============================================
        // GENERATE JOB
        // ============================================

        if (
          interaction.customId ===
          "generate_job"
        ) {

          if (
            activeDrivers[
              interaction.user.id
            ]
          ) {

            return await tempReply(
              interaction,
              "❌ You already have an active job."
            );

          }

          const rdc =
            selectedRdc[
              interaction.user.id
            ];

          if (!rdc) {

            return await tempReply(
              interaction,
              "❌ Select an RDC first."
            );

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
              jobType.points +
              (
                contracts.find(
                  c =>
                    c.company ===
                    store.company
                )?.bonusPoints || 0
              )

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

          await tempReply(
            interaction,
            "✅ Dispatch generated."
          );

        }

        // ============================================
        // COMPLETE DELIVERY
        // ============================================

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

            return await tempReply(
              interaction,
              "❌ Job not found."
            );

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
`✅ INCIDENT RESOLVED

🏪 STORE:
${store.name}

📦 STOCK:
${store.stock}%

Priority delivery completed.`
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
${driverStats[job.user]}`,

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

// ======================================================
// LOGIN
// ======================================================

client.login(
  process.env.TOKEN
);