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
    { id: 1, name: "Tesco - London", company: "Tesco", region: "South England", stock: 70 },
    { id: 2, name: "Tesco - Aberdeen", company: "Tesco", region: "Scotland", stock: 70 },
    { id: 3, name: "Tesco - Belfast", company: "Tesco", region: "Northern Ireland", stock: 70 },
    { id: 4, name: "Tesco - Antrim", company: "Tesco", region: "Northern Ireland", stock: 70 },
    { id: 5, name: "Tesco - Dumfries", company: "Tesco", region: "Scotland", stock: 70 },
    { id: 6, name: "Tesco - Holyhead", company: "Tesco", region: "Wales", stock: 70 },
    { id: 7, name: "Tesco - Porthmadog", company: "Tesco", region: "Wales", stock: 70 },
    { id: 8, name: "Tesco - Folkestone", company: "Tesco", region: "South England", stock: 70 },
    { id: 9, name: "Tesco - Chelmsford", company: "Tesco", region: "South England", stock: 70 },
    { id: 10, name: "Tesco - Norwich", company: "Tesco", region: "South England", stock: 70 },
    { id: 11, name: "Tesco - Ullapool", company: "Tesco", region: "Scotland", stock: 70 },
    { id: 12, name: "Aldi - Newcastle", company: "Aldi", region: "North England", stock: 70 },
    { id: 13, name: "Aldi - London", company: "Aldi", region: "South England", stock: 70 },
    { id: 14, name: "Aldi - Waterford", company: "Aldi", region: "Ireland", stock: 70 },
    { id: 15, name: "Aldi - Sheffield", company: "Aldi", region: "North England", stock: 70 },
    { id: 16, name: "Lidl - Swansea", company: "Lidl", region: "Wales", stock: 70 },
    { id: 17, name: "Lidl - Edinburgh", company: "Lidl", region: "Scotland", stock: 70 },
    { id: 18, name: "Lidl - Southampton", company: "Lidl", region: "South England", stock: 70 },
    { id: 19, name: "Lidl - Canterbury", company: "Lidl", region: "South England", stock: 70 },
    { id: 20, name: "Sainsbury's - Exeter", company: "Sainsbury's", region: "South England", stock: 70 },
    { id: 21, name: "Sainsbury's - Newport", company: "Sainsbury's", region: "Wales", stock: 70 },
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

    return JSON.parse(fs.readFileSync(DATA_FILE));
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

  if (profile.deliveries >= 25) {
    achievements.push("📦 Delivery Runner");
  }

  if (profile.deliveries >= 100) {
    achievements.push("🚛 Logistics Veteran");
  }

  if (profile.urgentContracts >= 10) {
    achievements.push("🚨 Emergency Responder");
  }

  if (profile.failedRecoveries >= 3) {
    achievements.push("💀 Failed Store Savior");
  }

  if (profile.favoriteCompany === "Tesco") {
    achievements.push("🏢 Tesco Specialist");
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
// BOARDS
// ======================================================

async function updateStockBoard() {
  const channel = await client.channels.fetch(STOCK_CHANNEL_ID);
  if (!channel) return;

  const grouped = {};

  for (const store of state.stores) {
    if (!grouped[store.company]) {
      grouped[store.company] = [];
    }

    grouped[store.company].push(store);
  }

  const criticalCount = state.stores.filter(s => s.stock <= 30).length;
  const lowCount = state.stores.filter(s => s.stock > 30 && s.stock <= 60).length;
  const healthyCount = state.stores.filter(s => s.stock > 60).length;
  const failedStores = state.stores.filter(s => s.failure).length;

  let content = `╔════════════════════════════╗\n      JC LOGISTICS\n       LIVE STOCK BOARD\n╚════════════════════════════╝\n\n🔴 Critical Amount: ${criticalCount}\n🟡 Low Amount: ${lowCount}\n🟢 Healthy Amount: ${healthyCount}\n💀 Failed Stores: ${failedStores}\n`;

  content += `\n🏢 COMPANY REPUTATION\n\n`;

  for (const [company, rep] of Object.entries(state.companyReputation)) {
    content += `${company} — ${rep}%\n`;
  }

  if (state.activeCompanyEvent) {
    content += `\n🏢 COMPANY EVENT ACTIVE\n`;
    content += `${state.activeCompanyEvent.title}\n`;
  }

  for (const company of Object.keys(grouped).sort()) {
    content += `\n📦 ${company}\n━━━━━━━━━━━━━━━━\n`;

    grouped[company]
      .sort((a, b) => a.stock - b.stock)
      .forEach(store => {
        const location = store.name.split(" - ")[1];

        content += `${getStatus(store.stock)} ${location}\n`;
        content += `Stock: ${store.stock}%\n\n`;
      });
  }

  const messages = await channel.messages.fetch({ limit: 10 });

  const existing = messages.find(
    m => m.author.id === client.user.id
  );

  if (existing) {
    await existing.edit(content);
  } else {
    await channel.send(content);
  }
}

async function updateLeaderboard() {
  const channel = await client.channels.fetch(LEADERBOARD_CHANNEL_ID);
  if (!channel) return;

  const sorted = Object.entries(state.driverStats)
    .sort((a, b) => b[1] - a[1]);

  let content = `🏆 JC LOGISTICS DRIVER RANKINGS\n\n`;

  if (!sorted.length) {
    content += "No deliveries completed.";
  }

  sorted.forEach(([id, points], index) => {
    const medals = ["🥇", "🥈", "🥉"];

    content += `${medals[index] || "▫️"} <@${id}>\n`;
    content += `${getDriverRank(points)}\n`;
    content += `Points: ${points}\n\n`;
  });

  const messages = await channel.messages.fetch({ limit: 10 });

  const existing = messages.find(
    m => m.author.id === client.user.id
  );

  if (existing) {
    await existing.edit(content);
  } else {
    await channel.send(content);
  }
}

async function updateDriverProfile(userId) {
  const channel = await client.channels.fetch(DRIVER_STATS_CHANNEL_ID);
  if (!channel) return;

  if (!state.driverProfiles[userId]) {
    state.driverProfiles[userId] = {
      deliveries: 0,
      urgentContracts: 0,
      failedRecoveries: 0,
      companies: {},
      favoriteCompany: "Unknown",
      messageId: null
    };
  }

  const profile = state.driverProfiles[userId];
  const points = state.driverStats[userId] || 0;

  const favorite = Object.entries(profile.companies)
    .sort((a, b) => b[1] - a[1])[0];

  if (favorite) {
    profile.favoriteCompany = favorite[0];
  }

  const achievements = getAchievements(profile);

  const content =
`╔════ DRIVER PROFILE ════╗

👤 <@${userId}>

🏆 Rank:
${getDriverRank(points)}

⭐ Points:
${points}

📦 Deliveries:
${profile.deliveries}

🚨 Urgent Contracts:
${profile.urgentContracts}

🏢 Favorite Company:
${profile.favoriteCompany}

🎖 Achievements:
${achievements.length ? achievements.join("\n") : "None"}

╚═══════════════════════╝`;

  if (profile.messageId) {
    try {
      const message = await channel.messages.fetch(profile.messageId);
      await message.edit(content);
      return;
    } catch {}
  }

  const newMessage = await channel.send(content);
  profile.messageId = newMessage.id;

  saveState();
}

// ======================================================
// TERMINAL
// ======================================================

async function createDispatchTerminal() {
  const channel = await client.channels.fetch(JOB_CHANNEL_ID);
  if (!channel) return;

  const menu = new StringSelectMenuBuilder()
    .setCustomId("rdc_select")
    .setPlaceholder("Select RDC")
    .addOptions(rdcs.map(rdc => ({
      label: rdc,
      value: rdc
    })));

  const row1 = new ActionRowBuilder().addComponents(menu);

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("generate_dispatch")
      .setLabel("Generate Dispatch")
      .setStyle(ButtonStyle.Primary)
  );

  const content = `JC LOGISTICS TERMINAL\n\nSelect RDC then generate dispatch.`;

  const messages = await channel.messages.fetch({ limit: 10 });

  const existing = messages.find(
    m => m.author.id === client.user.id
  );

  if (existing) {
    await existing.edit({
      content,
      components: [row1, row2]
    });
  } else {
    await channel.send({
      content,
      components: [row1, row2]
    });
  }
}

// ======================================================
// DISPATCHES
// ======================================================

async function createDispatch({
  userId,
  store,
  jobType,
  incidentId = null
}) {
  const dispatchId = makeId("DSP");

  const dispatch = {
    id: dispatchId,
    userId,
    storeId: store.id,
    incidentId,
    stockBoost: jobType.boost,
    points: jobType.points,
    type: jobType.name,
    status: "ACTIVE",
    createdAt: Date.now()
  };

  state.dispatches.push(dispatch);
  state.activeDrivers[userId] = dispatchId;

  saveState();

  const channel = await client.channels.fetch(ACTIVE_JOBS_CHANNEL_ID);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`complete_${dispatchId}`)
      .setLabel("Complete Delivery")
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({
    content:
`╔════ ACTIVE DISPATCH ════╗

🚚 Dispatch: ${dispatchId}
👤 Driver: <@${userId}>

📦 Pickup RDC:
${incidentId ? state.incidents.find(i => i.id === incidentId)?.pickupRdc || "Unknown RDC" : "Standard Network RDC"}

🏪 Destination:
${store.name}

📦 Cargo:
${jobType.name}

⚠ Priority:
${jobType.priority}

📈 Recovery Impact:
+${jobType.boost}% Stock

🏆 Reward:
${jobType.points} Points

📌 STATUS: IN TRANSIT

╚═════════════════════════╝`,
    components: [row]
  });
}

async function completeDispatch(dispatchId, interaction) {
  const dispatch = state.dispatches.find(d => d.id === dispatchId);

  if (!dispatch || dispatch.status !== "ACTIVE") {
    return tempReply(interaction, "❌ Dispatch unavailable.");
  }

  dispatch.status = "COMPLETED";

  const store = state.stores.find(s => s.id === dispatch.storeId);

  if (state.companyReputation[store.company]) {
    state.companyReputation[store.company] = Math.min(
      100,
      state.companyReputation[store.company] + 1
    );
  }

  store.stock = Math.min(100, store.stock + dispatch.stockBoost);

  delete state.activeDrivers[dispatch.userId];

  if (!state.driverStats[dispatch.userId]) {
    state.driverStats[dispatch.userId] = 0;
  }

  state.driverStats[dispatch.userId] += dispatch.points;
  state.driverRanks[dispatch.userId] = getDriverRank(state.driverStats[dispatch.userId]);

  if (!state.driverProfiles[dispatch.userId]) {
    state.driverProfiles[dispatch.userId] = {
      deliveries: 0,
      urgentContracts: 0,
      failedRecoveries: 0,
      companies: {},
      favoriteCompany: "Unknown",
      messageId: null
    };
  }

  const profile = state.driverProfiles[dispatch.userId];

  profile.deliveries++;

  if (dispatch.incidentId) {
    profile.urgentContracts++;
  }

  if (!profile.companies[store.company]) {
    profile.companies[store.company] = 0;
  }

  profile.companies[store.company]++;

  if (store.failure) {
    profile.failedRecoveries++;
    store.failure = false;
  }

  if (dispatch.incidentId) {
    const incident = state.incidents.find(i => i.id === dispatch.incidentId);

    if (incident) {
      incident.status = "RESOLVED";
      incident.resolvedAt = Date.now();

      if (incident.channelId && incident.messageId) {
        try {
          const alertChannel = await client.channels.fetch(incident.channelId);
          const alertMessage = await alertChannel.messages.fetch(incident.messageId);

          await alertMessage.edit({
            content:
`╔════════ CONTRACT COMPLETE ════════╗

✅ ${incident.title}
📦 Pickup RDC: ${incident.pickupRdc}
🏪 ${store.name}

👤 Resolved By:
<@${dispatch.userId}>

📦 Stock Restored To:
${store.stock}%

🏆 Reward Delivered:
${incident.points} Points

📌 STATUS: COMPLETED
🆔 ${incident.id}

╚══════════════════════════════════╝`,
            components: []
          });
        } catch {}
      }
    }
  }

  saveState();

  await updateStockBoard();
  await updateLeaderboard();
  await updateDriverProfile(dispatch.userId);

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`done_${dispatchId}`)
      .setLabel("Delivery Complete")
      .setDisabled(true)
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({
    content:
`╔════ DELIVERY COMPLETE ════╗

👤 Driver:
<@${dispatch.userId}>

🆔 Dispatch:
${dispatchId}

🏪 Store:
${store.name}

📦 Updated Stock:
${store.stock}%

🏆 Reward Delivered:
${dispatch.points} Points

╚══════════════════════════╝`,
    components: [disabledRow]
  });
}

// ======================================================
// INCIDENTS
// ======================================================

async function createIncident(manual = false) {
  if (activeIncidentCount() >= MAX_ACTIVE_INCIDENTS) return;

  const now = Date.now();

  if (!manual && now - state.lastIncidentAt < INCIDENT_COOLDOWN_MS) {
    return;
  }

  const availableScenarios = incidentScenarios;

  const scenario = availableScenarios[
    Math.floor(Math.random() * availableScenarios.length)
  ];

  const store = [...state.stores]
    .sort((a, b) => a.stock - b.stock)[0];

  store.stock = Math.max(0, store.stock - scenario.stockLoss);

  const contractRdc = rdcs[
    Math.floor(Math.random() * rdcs.length)
  ];

  const incident = {
    id: makeId("INC"),
    title: scenario.title,
    description: scenario.description,
    severity: scenario.severity,
    points: scenario.points,
    stockLoss: scenario.stockLoss,
    storeId: store.id,
    status: "OPEN",
    assignedTo: null,
    messageId: null,
    channelId: null,
    pickupRdc: contractRdc,
    createdAt: now,
    expiresAt: now + INCIDENT_EXPIRY_MS
  };

  state.incidents.push(incident);
  state.lastIncidentAt = now;

  saveState();

  await updateStockBoard();

  const channel = await client.channels.fetch(ALERTS_CHANNEL_ID);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`respond_${incident.id}`)
      .setLabel("Accept Urgent Contract")
      .setStyle(ButtonStyle.Danger)
  );

  const sentMessage = await channel.send({
    content:
`╔════════ URGENT CONTRACT ════════╗

🚨 ${scenario.title}
📦 Pickup RDC: ${incident.pickupRdc}
🏪 ${store.name}
🔥 Severity: ${scenario.severity}

📉 ${scenario.description}
📦 Stock Reduced To: ${store.stock}%

🏆 Response Reward: ${scenario.points} Points

📌 STATUS: AVAILABLE
🆔 ${incident.id}

╚══════════════════════════════╝`,
    components: [row]
  });

  incident.messageId = sentMessage.id;
  incident.channelId = sentMessage.channelId;

  saveState();
}

function cleanupIncidents() {
  const now = Date.now();

  for (const incident of state.incidents) {
    if (incident.status === "OPEN" && now > incident.expiresAt) {
      incident.status = "EXPIRED";
    }
  }

  saveState();
}

// ======================================================
// STOCK DRAIN
// ======================================================

setInterval(async () => {
  for (const store of state.stores) {
    let drain = Math.floor(Math.random() * 8) + 3;

    if (
      state.activeCompanyEvent &&
      store.company === state.activeCompanyEvent.company
    ) {
      drain *= state.activeCompanyEvent.multiplier;
    }

    store.stock = Math.max(0, store.stock - drain);

    if (
      store.stock <= 15 &&
      state.companyReputation[store.company]
    ) {
      state.companyReputation[store.company] = Math.max(
        0,
        state.companyReputation[store.company] - 1
      );
    }

    if (store.stock <= 0) {
      store.failure = true;
    }
  }

  if (!state.activeCompanyEvent && Math.random() < 0.25) {
    state.activeCompanyEvent = companyEvents[
      Math.floor(Math.random() * companyEvents.length)
    ];
  }

  if (Math.random() < 0.15) {
    await createIncident(false);
  }

  cleanupIncidents();

  saveState();

  await updateStockBoard();
}, 1000 * 60 * 30);

// ======================================================
// COMMANDS
// ======================================================

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("alert")
      .setDescription("Trigger urgent contract")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
}

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {
  console.log(`Online: ${client.user.tag}`);

  await registerCommands();
  await createDispatchTerminal();
  await updateStockBoard();
  await updateLeaderboard();
});

// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "alert") {
        await createIncident(true);
        return tempReply(interaction, "🚨 Urgent contract triggered.");
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "rdc_select") {
        state.selectedRdc[interaction.user.id] = interaction.values[0];

        saveState();

        return tempReply(
          interaction,
          `✅ RDC Selected\n\n${interaction.values[0]}`
        );
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "generate_dispatch") {
        if (state.activeDrivers[interaction.user.id]) {
          return tempReply(interaction, "❌ You already have an active dispatch.");
        }

        const rdc = state.selectedRdc[interaction.user.id];

        if (!rdc) {
          return tempReply(interaction, "❌ Select an RDC first.");
        }

        const store = getWeightedStore(rdc);

        const jobType = jobTypes[
          Math.floor(Math.random() * jobTypes.length)
        ];

        await createDispatch({
          userId: interaction.user.id,
          store,
          jobType
        });

        return tempReply(interaction, "✅ Dispatch generated.");
      }

      if (interaction.customId.startsWith("respond_")) {
        const incidentId = interaction.customId.replace("respond_", "");

        const incident = state.incidents.find(i => i.id === incidentId);

        if (!incident || incident.status !== "OPEN") {
          return tempReply(interaction, "❌ Urgent contract unavailable.");
        }

        if (state.activeDrivers[interaction.user.id]) {
          return tempReply(interaction, "❌ Complete your active dispatch first.");
        }

        if (incident.assignedTo) {
          return tempReply(interaction, "❌ Urgent contract already assigned.");
        }

        incident.assignedTo = interaction.user.id;
        incident.status = "ASSIGNED";

        const store = state.stores.find(s => s.id === incident.storeId);

        if (incident.channelId && incident.messageId) {
          try {
            const alertChannel = await client.channels.fetch(incident.channelId);
            const alertMessage = await alertChannel.messages.fetch(incident.messageId);

            await alertMessage.edit({
              content:
`╔════════ URGENT CONTRACT ════════╗

🚨 ${incident.title}
🏪 ${store.name}
🔥 Severity: ${incident.severity}

📦 Pickup RDC:
${incident.pickupRdc}

👤 Assigned To:
<@${interaction.user.id}>

🏆 Reward: ${incident.points} Points

📌 STATUS: ASSIGNED DRIVER
🆔 ${incident.id}

╚══════════════════════════════╝`
            });
          } catch {}
        }

        await createDispatch({
          userId: interaction.user.id,
          store,
          incidentId,
          jobType: {
            name: `🚨 ${incident.title}`,
            boost: incident.stockLoss + 10,
            points: incident.points,
            priority: incident.severity
          }
        });

        saveState();

        return tempReply(interaction, "🚨 Urgent contract assigned.");
      }

      if (interaction.customId.startsWith("complete_")) {
        const dispatchId = interaction.customId.replace("complete_", "");

        const dispatch = state.dispatches.find(d => d.id === dispatchId);

        if (!dispatch) {
          return tempReply(interaction, "❌ Dispatch not found.");
        }

        const isOwner = dispatch.userId === interaction.user.id;
        const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);

        if (!isOwner && !isAdmin) {
          return tempReply(
            interaction,
            "❌ Only the assigned driver or an administrator can complete this dispatch."
          );
        }

        return completeDispatch(dispatchId, interaction);
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