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
  PermissionFlagsBits,
  REST,
  Routes
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

const JOB_CHANNEL_ID = "1497716778791342120";
const STOCK_CHANNEL_ID = "1497749476234760342";
const ACTIVE_JOBS_CHANNEL_ID = "1497756268847304734";
const DRIVER_STATS_CHANNEL_ID = "1497749336321429534";
const LEADERBOARD_CHANNEL_ID = "1497941626260295803";
const ALERTS_CHANNEL_ID = "1497948012603904000";

const DATA_FILE = "./state.json";

const MAX_ACTIVE_INCIDENTS = 3;
const INCIDENT_EXPIRY_MS = 1000 * 60 * 30;
const INCIDENT_COOLDOWN_MS = 1000 * 60 * 5;

// ======================================================
// STATE
// ======================================================

const defaultState = {
  activeCompanyEvent: null,
  lastCompanyEventAt: 0,
  selectedRdc: {},
  activeDrivers: {},
  driverStats: {},
  driverRanks: {},
  driverProfiles: {},
  companyReputation: {
    Tesco: 100,
    Aldi: 100,
    Lidl: 100,
    "Sainsbury's": 100,
    IKEA: 100,
    Homebase: 100,
    Dreams: 100,
    "McDonald's": 100
  },
  dispatches: [],
  incidents: [],
  lastIncidentAt: 0,
  lastCompanyDispatched: null,
  stores: [
    { id: 1, name: "Tesco - London", company: "Tesco", region: "South England", stock: 55 },
    { id: 2, name: "Tesco - Aberdeen", company: "Tesco", region: "Scotland", stock: 65 },
    { id: 3, name: "Tesco - Belfast", company: "Tesco", region: "Northern Ireland", stock: 65 },
    { id: 4, name: "Tesco - Antrim", company: "Tesco", region: "Northern Ireland", stock: 70 },
    { id: 5, name: "Tesco - Dumfries", company: "Tesco", region: "Scotland", stock: 45 },
    { id: 6, name: "Tesco - Holyhead", company: "Tesco", region: "Wales", stock: 70 },
    { id: 7, name: "Tesco - Porthmadog", company: "Tesco", region: "Wales", stock: 70 },
    { id: 8, name: "Tesco - Folkestone", company: "Tesco", region: "South England", stock: 70 },
    { id: 9, name: "Tesco - Chelmsford", company: "Tesco", region: "South England", stock: 35 },
    { id: 10, name: "Tesco - Norwich", company: "Tesco", region: "South England", stock: 70 },
    { id: 11, name: "Tesco - Ullapool", company: "Tesco", region: "Scotland", stock: 70 },
    { id: 12, name: "Aldi - Newcastle", company: "Aldi", region: "North England", stock: 45 },
    { id: 13, name: "Aldi - London", company: "Aldi", region: "South England", stock: 70 },
    { id: 14, name: "Aldi - Waterford", company: "Aldi", region: "Ireland", stock: 70 },
    { id: 15, name: "Aldi - Sheffield", company: "Aldi", region: "North England", stock: 55 },
    { id: 16, name: "Lidl - Swansea", company: "Lidl", region: "Wales", stock: 70 },
    { id: 17, name: "Lidl - Edinburgh", company: "Lidl", region: "Scotland", stock: 55 },
    { id: 18, name: "Lidl - Southampton", company: "Lidl", region: "South England", stock: 35 },
    { id: 19, name: "Lidl - Canterbury", company: "Lidl", region: "South England", stock: 70 },
    { id: 20, name: "Sainsbury's - Exeter", company: "Sainsbury's", region: "South England", stock: 70 },
    { id: 21, name: "Sainsbury's - Newport", company: "Sainsbury's", region: "Wales", stock: 65 },
    { id: 22, name: "IKEA - Croydon", company: "IKEA", region: "South England", stock: 70 },
    { id: 23, name: "IKEA - Dublin", company: "IKEA", region: "Ireland", stock: 70 },
    { id: 24, name: "Homebase - Plymouth", company: "Homebase", region: "South England", stock: 70 },
    { id: 25, name: "Dreams - Exeter", company: "Dreams", region: "South England", stock: 70 },
    { id: 26, name: "McDonald's - London", company: "McDonald's", region: "South England", stock: 70 }
  ]
};

function loadState() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2));
      return structuredClone(defaultState);
    }

    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return structuredClone(defaultState);
  }
}

let state = loadState();

function saveState() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// ======================================================
// DATA
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

const jobTypes = [
  {
    name: "📦 Standard Delivery",
    boost: 25,
    points: 1,
    priority: "STANDARD"
  },
  {
    name: "❄ Refrigerated Goods",
    boost: 35,
    points: 3,
    priority: "HIGH"
  },
  {
    name: "⚡ Critical Supply Transfer",
    boost: 50,
    points: 5,
    priority: "CRITICAL"
  }
];

const incidentScenarios = [
  {
    title: "Missed Delivery",
    description: "Culina Sub Contract",
    severity: "MAJOR",
    points: 5,
    stockLoss: 25
  },
  {
    title: "Missed Delivery",
    description: "McCloud Logistics Sub Contract",
    severity: "CRITICAL",
    points: 8,
    stockLoss: 40
  },
  {
    title: "Missed Delivery",
    description: "Dez Hartley Sub Contract",
    severity: "MINOR",
    points: 3,
    stockLoss: 15
  },
  {
    title: "Missed Delivery",
    description: "SNT Transport Sub Contract",
    severity: "MAJOR",
    points: 5,
    stockLoss: 30
  }
];

const companyEvents = [
  {
    company: "Tesco",
    title: "Tesco Emergency Week",
    multiplier: 2
  },
  {
    company: "Aldi",
    title: "Aldi Supply Surge",
    multiplier: 2
  },
  {
    company: "Lidl",
    title: "Lidl Recovery Operation",
    multiplier: 2
  }
];

// ======================================================
// HELPERS
// ======================================================

function makeId(prefix) {
  return `${prefix}-${Math.floor(Math.random() * 999999)}`;
}

function getDriverRank(points) {
  if (points >= 200) return "🏆 Operations Specialist";
  if (points >= 120) return "🚛 Senior Driver";
  if (points >= 60) return "🚚 Class 1 Driver";
  if (points >= 25) return "🚐 Class 2 Driver";
  return "🟢 Trainee Driver";
}

function getAchievements(profile) {
  const achievements = [];

  if (profile.deliveries >= 500) {
    achievements.push("👑 Supply Chain Legend");
  } else if (profile.deliveries >= 250) {
    achievements.push("🏆 Network Carrier");
  } else if (profile.deliveries >= 100) {
    achievements.push("🚛 Logistics Veteran");
  } else if (profile.deliveries >= 50) {
    achievements.push("🚚 Freight Operator");
  } else if (profile.deliveries >= 10) {
    achievements.push("📦 Delivery Runner");
  }

  if (profile.urgentContracts >= 100) {
    achievements.push("☢ Network Stabilizer");
  } else if (profile.urgentContracts >= 50) {
    achievements.push("🔥 Emergency Specialist");
  } else if (profile.urgentContracts >= 25) {
    achievements.push("⚠ Crisis Handler");
  } else if (profile.urgentContracts >= 5) {
    achievements.push("🚨 First Responder");
  }

  if (profile.failedRecoveries >= 25) {
    achievements.push("🏥 Infrastructure Protector");
  } else if (profile.failedRecoveries >= 10) {
    achievements.push("🩺 Regional Recovery Unit");
  } else if (profile.failedRecoveries >= 1) {
    achievements.push("💀 Store Saver");
  }

  for (const [company, amount] of Object.entries(profile.companies)) {
    if (amount >= 100) {
      achievements.push(`👑 ${company} Elite Operator`);
    } else if (amount >= 50) {
      achievements.push(`🏢 ${company} Specialist`);
    } else if (amount >= 25) {
      achievements.push(`📦 ${company} Support Driver`);
    }
  }

  return achievements;
}

function getStatus(stock) {
  if (stock <= 30) return "🔴";
  if (stock <= 60) return "🟡";
  return "🟢";
}

function getRegionFromRdc(rdc) {
  if (rdc.includes("Aberdeen")) return "Scotland";
  if (rdc.includes("Waterford")) return "Ireland";
  if (rdc.includes("Swansea")) return "Wales";
  return "South England";
}

function getWeightedStore(rdc) {
  const region = getRegionFromRdc(rdc);

  let stores = state.stores.filter(s => s.region === region);

  if (!stores.length) {
    stores = [...state.stores];
  }

  stores.sort((a, b) => a.stock - b.stock);

  const filtered = stores.filter(
    s => s.company !== state.lastCompanyDispatched
  );

  const usable = filtered.length ? filtered : stores;
  const top = usable.slice(0, 4);

  const selected = top[
    Math.floor(Math.random() * top.length)
  ];

  state.lastCompanyDispatched = selected.company;

  return selected;
}

async function tempReply(interaction, content) {
  await interaction.reply({
    content,
    ephemeral: true
  });

  setTimeout(async () => {
    try {
      await interaction.deleteReply();
    } catch {}
  }, 3000);
}

function activeIncidentCount() {
  return state.incidents.filter(
    i => i.status === "OPEN"
  ).length;
}

// ======================================================
// COMMANDS
// ======================================================

async function registerCommands() {
  const commands = [

    new SlashCommandBuilder()
      .setName("alert")
      .setDescription("Trigger urgent contract")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
      .setName("event")
      .setDescription("Trigger company event")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands("1497676061083697313"),
    { body: commands }
  );
}

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {
  console.log(`Online: ${client.user.tag}`);

  await registerCommands();
});

// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async interaction => {
  try {

    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "alert") {
        await createIncident(true);

        return tempReply(
          interaction,
          "🚨 Urgent contract triggered."
        );
      }

      if (interaction.commandName === "event") {

        state.activeCompanyEvent =
          companyEvents[
            Math.floor(Math.random() * companyEvents.length)
          ];

        saveState();

        return tempReply(
          interaction,
          `🏢 Company event triggered:\n\n${state.activeCompanyEvent.title}`
        );
      }
    }

  } catch (error) {
    console.error(error);
  }
});

// ======================================================
// LOGIN
// ======================================================

client.login(process.env.TOKEN);

