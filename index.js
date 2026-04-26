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
// CHANNEL CONFIG
// ======================================================

const JOB_CHANNEL_ID = "1497716778791342120";

const STOCK_CHANNEL_ID = "1497749476234760342";

const ACTIVE_JOBS_CHANNEL_ID = "1497756268847304734";

const LEADERBOARD_CHANNEL_ID = "1497941626260295803";

const ALERTS_CHANNEL_ID = "1497948012603904000";

// ======================================================
// SAVE FILES
// ======================================================

const DRIVER_STATS_FILE =
  "./driverStats.json";

const ACTIVE_DRIVERS_FILE =
  "./activeDrivers.json";

const ACTIVE_JOBS_FILE =
  "./activeJobs.json";

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
// SAVE / LOAD
// ======================================================

function loadData(
  file,
  fallback
) {

  try {

    if (
      fs.existsSync(file)
    ) {

      return JSON.parse(
        fs.readFileSync(file)
      );

    }

    return fallback;

  } catch {

    return fallback;

  }

}

function saveData(
  file,
  data
) {

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
// LOAD DATA
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

// ======================================================
// EMERGENCY
// ======================================================

let activeEmergency =
  null;

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

  // ======================================================
  // TESCO
  // ======================================================

  {
    name: "Tesco - Dublin",
    stock: 70,
    region: "Ireland",
    company: "Tesco"
  },

  {
    name: "Tesco - Belfast",
    stock: 70,
    region: "Northern Ireland",
    company: "Tesco"
  },

  {
    name: "Tesco - Antrim",
    stock: 70,
    region: "Northern Ireland",
    company: "Tesco"
  },

  {
    name: "Tesco - Dumfries",
    stock: 70,
    region: "Scotland",
    company: "Tesco"
  },

  {
    name: "Tesco - Holyhead",
    stock: 70,
    region: "Wales",
    company: "Tesco"
  },

  {
    name: "Tesco - Porthmadog",
    stock: 70,
    region: "Wales",
    company: "Tesco"
  },

  {
    name: "Tesco - Aberystwyth",
    stock: 70,
    region: "Wales",
    company: "Tesco"
  },

  {
    name: "Tesco - Folkestone",
    stock: 70,
    region: "South England",
    company: "Tesco"
  },

  {
    name: "Tesco - London",
    stock: 70,
    region: "South England",
    company: "Tesco"
  },

  {
    name: "Tesco - Chelmsford",
    stock: 70,
    region: "South England",
    company: "Tesco"
  },

  {
    name: "Tesco - Norwich",
    stock: 70,
    region: "South England",
    company: "Tesco"
  },

  {
    name: "Tesco - Ullapool",
    stock: 70,
    region: "Scotland",
    company: "Tesco"
  },

  {
    name: "Tesco - Stornoway",
    stock: 70,
    region: "Scotland",
    company: "Tesco"
  },

  // ======================================================
  // ALDI
  // ======================================================

  {
    name: "Aldi - Porthmadog",
    stock: 70,
    region: "Wales",
    company: "Aldi"
  },

  {
    name: "Aldi - Waterford",
    stock: 70,
    region: "Ireland",
    company: "Aldi"
  },

  {
    name: "Aldi - Sheffield",
    stock: 70,
    region: "North England",
    company: "Aldi"
  },

  {
    name: "Aldi - Newcastle",
    stock: 70,
    region: "North England",
    company: "Aldi"
  },

  {
    name: "Aldi - London",
    stock: 70,
    region: "South England",
    company: "Aldi"
  },

  // ======================================================
  // LIDL
  // ======================================================

  {
    name: "Lidl - Perth",
    stock: 70,
    region: "Scotland",
    company: "Lidl"
  },

  {
    name: "Lidl - Edinburgh",
    stock: 70,
    region: "Scotland",
    company: "Lidl"
  },

  {
    name: "Lidl - Waterford",
    stock: 70,
    region: "Ireland",
    company: "Lidl"
  },

  {
    name: "Lidl - Swansea",
    stock: 70,
    region: "Wales",
    company: "Lidl"
  },

  {
    name: "Lidl - Southampton",
    stock: 70,
    region: "South England",
    company: "Lidl"
  },

  {
    name: "Lidl - Canterbury",
    stock: 70,
    region: "South England",
    company: "Lidl"
  },

  {
    name: "Lidl - Antrim",
    stock: 70,
    region: "Northern Ireland",
    company: "Lidl"
  },

  // ======================================================
  // SAINSBURY'S
  // ======================================================

  {
    name: "Sainsbury's - Exeter",
    stock: 70,
    region: "South England",
    company: "Sainsbury's"
  },

  {
    name: "Sainsbury's - Newport",
    stock: 70,
    region: "Wales",
    company: "Sainsbury's"
  },

  {
    name: "Sainsbury's - Lisburn",
    stock: 70,
    region: "Northern Ireland",
    company: "Sainsbury's"
  },

  // ======================================================
  // IKEA
  // ======================================================

  {
    name: "IKEA - Croydon",
    stock: 70,
    region: "South England",
    company: "IKEA"
  },

  {
    name: "IKEA - Douglas",
    stock: 70,
    region: "Isle of Man",
    company: "IKEA"
  },

  {
    name: "IKEA - Dublin",
    stock: 70,
    region: "Ireland",
    company: "IKEA"
  },

  // ======================================================
  // DREAMS
  // ======================================================

  {
    name: "Dreams - Exeter",
    stock: 70,
    region: "South England",
    company: "Dreams"
  },

  // ======================================================
  // HOMEBASE
  // ======================================================

  {
    name: "Homebase - Exeter",
    stock: 70,
    region: "South England",
    company: "Homebase"
  },

  {
    name: "Homebase - Plymouth",
    stock: 70,
    region: "South England",
    company: "Homebase"
  },

  // ======================================================
  // MCDONALD'S
  // ======================================================

  {
    name: "McDonald's - London",
    stock: 70,
    region: "South England",
    company: "McDonald's"
  },

  // ======================================================
  // HAWES MARKETPLACE
  // ======================================================

  {
    name: "Hawes Marketplace - Hawes",
    stock: 70,
    region: "North England",
    company: "Hawes Marketplace"
  }

];

// ======================================================
// STATUS
// ======================================================

function getStatus(
  stock
) {

  if (stock <= 30)
    return "🔴";

  if (stock <= 60)
    return "🟡";

  return "🟢";

}

// ======================================================
// REGION
// ======================================================

function getRdcRegion(
  rdc
) {

  if (
    rdc.includes(
      "Aberdeen"
    ) ||
    rdc.includes(
      "Ullapool"
    ) ||
    rdc.includes(
      "Oban"
    ) ||
    rdc.includes(
      "Fort William"
    )
  ) {

    return "Scotland";

  }

  if (
    rdc.includes(
      "Newry"
    ) ||
    rdc.includes(
      "Ballymena"
    )
  ) {

    return
      "Northern Ireland";

  }

  if (
    rdc.includes(
      "Wexford"
    ) ||
    rdc.includes(
      "Waterford"
    ) ||
    rdc.includes(
      "Sligo"
    )
  ) {

    return "Ireland";

  }

  if (
    rdc.includes(
      "Swansea"
    )
  ) {

    return "Wales";

  }

  return
    "South England";

}

// ======================================================
// ALERTS
// ======================================================

async function sendAlert(
  message
) {

  try {

    const channel =
      await client.channels.fetch(
        ALERTS_CHANNEL_ID
      );

    if (!channel)
      return;

    await channel.send(
      message
    );

  } catch (
    error
  ) {

    console.error(
      "Alert error:",
      error
    );

  }

}

// ======================================================
// SMART DISPATCH
// ======================================================

function getSmartStore(
  rdc
) {

  if (
    activeEmergency
  ) {

    return activeEmergency.store;

  }

  const region =
    getRdcRegion(
      rdc
    );

  let regionalStores =
    stores.filter(
      store =>
        store.region ===
        region
    );

  if (
    regionalStores.length === 0
  ) {

    regionalStores =
      [...stores];

  }

  regionalStores.sort(
    (a, b) =>
      a.stock -
      b.stock
  );

  const topPriority =
    regionalStores.slice(
      0,
      3
    );

  return topPriority[
    Math.floor(
      Math.random() *
      topPriority.length
    )
  ];

}

// ======================================================
// GROUP STORES
// ======================================================

function groupStores() {

  const grouped = {};

  stores.forEach(
    store => {

      if (
        !grouped[
          store.company
        ]
      ) {

        grouped[
          store.company
        ] = [];

      }

      grouped[
        store.company
      ].push(store);

    }
  );

  return grouped;

}

// ======================================================
// EMERGENCY EVENTS
// ======================================================

async function triggerEmergencyEvent() {

  if (
    activeEmergency
  ) return;

  const randomStore =
    stores[
      Math.floor(
        Math.random() *
        stores.length
      )
    ];

  const events = [

    "Demand Surge",

    "Supply Chain Failure",

    "Port Delay",

    "Weather Disruption",

    "Panic Buying"

  ];

  const impacts = [

    "Critical stock depletion detected.",

    "Regional supply instability reported.",

    "Inbound delivery disruption confirmed.",

    "Emergency replenishment required.",

    "Distribution chain interruption detected."

  ];

  const event =
    events[
      Math.floor(
        Math.random() *
        events.length
      )
    ];

  const impact =
    impacts[
      Math.floor(
        Math.random() *
        impacts.length
      )
    ];

  randomStore.stock =
    Math.max(
      0,
      randomStore.stock -
      35
    );

  activeEmergency = {

    event,
    impact,
    store:
      randomStore

  };

  await sendAlert(

`🚨 SUPPLY CHAIN ALERT
━━━━━━━━━━━━━━━━━━

⚠ EVENT:
${event}

🏪 AFFECTED STORE:
${randomStore.name}

🌍 REGION:
${randomStore.region}

📉 IMPACT:
${impact}

📦 CURRENT STOCK:
${randomStore.stock}%

🚛 ACTION REQUIRED:
Priority restock dispatch recommended.

━━━━━━━━━━━━━━━━━━`

  );

}