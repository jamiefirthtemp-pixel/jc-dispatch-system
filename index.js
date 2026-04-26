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
  presentationVersion: 2,
  selectedRdc: {},
  activeDrivers: {},
  driverStats: {},
  dispatches: [],
  incidents: [],
  lastIncidentAt: 0,
  lastCompanyDispatched: null,
  stores: [
    { id: 1, name: "Tesco - London", company: "Tesco", region: "South England", stock: 70 },
    { id: 2, name: "Tesco - Aberdeen", company: "Tesco", region: "Scotland", stock: 70 },
    { id: 3, name: "Tesco - Belfast", company: "Tesco", region: "Northern Ireland", stock: 70 },
    { id: 4, name: "Aldi - Newcastle", company: "Aldi", region: "North England", stock: 70 },
    { id: 5, name: "Aldi - London", company: "Aldi", region: "South England", stock: 70 },
    { id: 6, name: "Lidl - Swansea", company: "Lidl", region: "Wales", stock: 70 },
    { id: 7, name: "Lidl - Edinburgh", company: "Lidl", region: "Scotland", stock: 70 },
    { id: 8, name: "Sainsbury's - Exeter", company: "Sainsbury's", region: "South England", stock: 70 },
    { id: 9, name: "IKEA - Croydon", company: "IKEA", region: "South England", stock: 70 },
    { id: 10, name: "Homebase - Plymouth", company: "Homebase", region: "South England", stock: 70 },
    { id: 11, name: "Dreams - Exeter", company: "Dreams", region: "South England", stock: 70 },
    { id: 12, name: "McDonald's - London", company: "McDonald's", region: "South England", stock: 70 }
  ]
};

let state = loadState();

// ======================================================
// LOAD / SAVE
// ======================================================

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

function saveState() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// ======================================================
// RDCS
// ======================================================

const rdcs = [
  "DHL - Aberdeen",
  "DHL - Portsmouth",
  "DSV - Waterford",
  "Stobart/Culina - Swansea",
  "XPO Logistics - London"
];

// ======================================================
// JOB TYPES
// ======================================================

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

// ======================================================
// INCIDENT SCENARIOS
// ======================================================

const incidentScenarios = [
  {
    title: "Ferry Cancellation",
    description: "Irish freight crossing suspended due to severe weather.",
    severity: "MAJOR",
    points: 5,
    stockLoss: 25
  },
  {
    title: "Power Outage",
    description: "Store refrigeration systems offline.",
    severity: "CRITICAL",
    points: 8,
    stockLoss: 40
  },
  {
    title: "Motorway Closure",
    description: "Primary freight route blocked by incident.",
    severity: "MINOR",
    points: 3,
    stockLoss: 15
  },
  {
    title: "Port Congestion",
    description: "Inbound containers delayed at port.",
    severity: "MAJOR",
    points: 5,
    stockLoss: 30
  }
];

// ======================================================
// HELPERS
// ======================================================

function makeId(prefix) {
  return `${prefix}-${Math.floor(Math.random() * 999999)}`;
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
  if (!stores.length) stores = [...state.stores];

  stores.sort((a, b) => a.stock - b.stock);

  const filtered = stores.filter(
    s => s.company !== state.lastCompanyDispatched
  );

  const usable = filtered.length ? filtered : stores;
  const top = usable.slice(0, 4);

  const selected = top[Math.floor(Math.random() * top.length)];

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
  return state.incidents.filter(i => i.status === "OPEN").length;
}

// ======================================================
// BOARDS
// ======================================================

async function updateStockBoard() {
  const channel = await client.channels.fetch(STOCK_CHANNEL_ID);
  if (!channel) return;

  const grouped = {};

  for (const store of state.stores) {
    if (!grouped[store.company]) grouped[store.company] = [];
    grouped[store.company].push(store);
  }

  let content = `╔════════════════════════════╗
      JC LOGISTICS
       LIVE STOCK BOARD
╚════════════════════════════╝
`;

  const activeIncidents = state.incidents.filter(i => i.status === "OPEN");

  if (activeIncidents.length) {
    content += `\n🚨 ACTIVE INCIDENTS: ${activeIncidents.length}\n`;
  }

  for (const company of Object.keys(grouped)) {
    content += `\n📦 ${company}\n━━━━━━━━━━━━━━━━\n`;

    grouped[company]
      .sort((a, b) => a.stock - b.stock)
      .forEach(store => {
        content += `${getStatus(store.stock)} ${store.name.split(" - ")[1]} — ${store.stock}%\n`;
      });
  }

  const messages = await channel.messages.fetch({ limit: 10 });

  const existing = messages.find(m => m.author.id === client.user.id);

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

  let content = `🏆 JC LOGISTICS LEADERBOARD\n\n`;

  if (!sorted.length) {
    content += "No deliveries completed.";
  }

  sorted.forEach(([id, points], index) => {
    const medals = ["🥇", "🥈", "🥉"];
    content += `${medals[index] || "▫️"} <@${id}> — ${points} points\n`;
  });

  const messages = await channel.messages.fetch({ limit: 10 });
  const existing = messages.find(m => m.author.id === client.user.id);

  if (existing) {
    await existing.edit(content);
  } else {
    await channel.send(content);
  }
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
  const existing = messages.find(m => m.author.id === client.user.id);

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

  incident.messageId = sentMessage.id;
  incident.channelId = sentMessage.channelId;

  saveState();
}

async function completeDispatch(dispatchId, interaction) {
  const dispatch = state.dispatches.find(d => d.id === dispatchId);

  if (!dispatch || dispatch.status !== "ACTIVE") {
    return tempReply(interaction, "❌ Dispatch unavailable.");
  }

  dispatch.status = "COMPLETED";

  const store = state.stores.find(s => s.id === dispatch.storeId);

  store.stock = Math.min(100, store.stock + dispatch.stockBoost);

  delete state.activeDrivers[dispatch.userId];

  if (!state.driverStats[dispatch.userId]) {
    state.driverStats[dispatch.userId] = 0;
  }

  state.driverStats[dispatch.userId] += dispatch.points;

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
`╔════════ INCIDENT RESOLVED ════════╗

✅ ${incident.title}
🏪 ${store.name}

👤 Resolved By:
<@${dispatch.userId}>

📦 Stock Restored To:
${store.stock}%

🏆 Reward Delivered:
${incident.points} Points

📌 STATUS: RESOLVED
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

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`done_${dispatchId}`)
      .setLabel("Delivery Complete")
      .setDisabled(true)
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({
    content:
`✅ DELIVERY COMPLETE\n\n🆔 ${dispatchId}\n🏪 ${store.name}\n📦 STOCK: ${store.stock}%`,
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

  const scenario = incidentScenarios[
    Math.floor(Math.random() * incidentScenarios.length)
  ];

  const store = [...state.stores]
    .sort((a, b) => a.stock - b.stock)[0];

  store.stock = Math.max(0, store.stock - scenario.stockLoss);

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
    createdAt: now,
    expiresAt: now + INCIDENT_EXPIRY_MS
  };

  state.incidents.push(incident);
  state.lastIncidentAt = now;

  saveState();

  saveState();

  await updateStockBoard();

  const channel = await client.channels.fetch(ALERTS_CHANNEL_ID);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`respond_${incident.id}`)
      .setLabel("Respond To Incident")
      .setStyle(ButtonStyle.Danger)
  );

  const sentMessage = await channel.send({
    content:
`╔════════ INCIDENT ALERT ════════╗

🚨 ${scenario.title}
🏪 ${store.name}
🔥 Severity: ${scenario.severity}

📉 ${scenario.description}
📦 Stock Reduced To: ${store.stock}%

🏆 Response Reward: ${scenario.points} Points

📌 STATUS: OPEN
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
    if (
      incident.status === "OPEN" &&
      now > incident.expiresAt
    ) {
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
    const drain = Math.floor(Math.random() * 8) + 3;
    store.stock = Math.max(0, store.stock - drain);
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
      .setDescription("Trigger a supply chain incident")
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

  try {
    await registerCommands();
    console.log("Commands loaded");
  } catch (e) {
    console.error("COMMAND ERROR", e);
  }

  try {
    await createDispatchTerminal();
    console.log("Terminal loaded");
  } catch (e) {
    console.error("TERMINAL ERROR", e);
  }

  try {
    await updateStockBoard();
    console.log("Stock board loaded");
  } catch (e) {
    console.error("STOCK ERROR", e);
  }

  try {
    await updateLeaderboard();
    console.log("Leaderboard loaded");
  } catch (e) {
    console.error("LEADERBOARD ERROR", e);
  }
});

// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async interaction => {
  try {

    // ================================================
    // COMMANDS
    // ================================================

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "alert") {
        await createIncident(true);
        return tempReply(interaction, "🚨 Incident triggered.");
      }
    }

    // ================================================
    // RDC SELECT
    // ================================================

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

    // ================================================
    // BUTTONS
    // ================================================

    if (interaction.isButton()) {

      // ============================================
      // NORMAL DISPATCH
      // ============================================

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

      // ============================================
      // INCIDENT RESPONSE
      // ============================================

      if (interaction.customId.startsWith("respond_")) {
        const incidentId = interaction.customId.replace("respond_", "");

        const incident = state.incidents.find(i => i.id === incidentId);

        if (!incident || incident.status !== "OPEN") {
          return tempReply(interaction, "❌ Incident unavailable.");
        }

        if (state.activeDrivers[interaction.user.id]) {
          return tempReply(interaction, "❌ Complete your active dispatch first.");
        }

        // atomic claim lock
        if (incident.assignedTo) {
          return tempReply(interaction, "❌ Incident already assigned.");
        }

        incident.assignedTo = interaction.user.id;
        incident.status = "ASSIGNED";

        if (incident.channelId && incident.messageId) {
          try {
            const alertChannel = await client.channels.fetch(incident.channelId);
            const alertMessage = await alertChannel.messages.fetch(incident.messageId);

            const storeData = state.stores.find(s => s.id === incident.storeId);

            await alertMessage.edit({
              content:
`╔════════ INCIDENT ALERT ════════╗

🚨 ${incident.title}
🏪 ${storeData.name}
🔥 Severity: ${incident.severity}

👤 Assigned To:
<@${interaction.user.id}>

🏆 Reward: ${incident.points} Points

📌 STATUS: ASSIGNED
🆔 ${incident.id}

╚══════════════════════════════╝`
            });
          } catch {}
        }

        const store = state.stores.find(s => s.id === incident.storeId);

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

        return tempReply(interaction, "🚨 Incident response assigned.");
      }

      // ============================================
      // COMPLETE DISPATCH
      // ============================================

      if (interaction.customId.startsWith("complete_")) {
        const dispatchId = interaction.customId.replace("complete_", "");
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