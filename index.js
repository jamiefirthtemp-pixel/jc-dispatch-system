require("dotenv").config();
const fs = require("fs");

const {
  Client,
  GatewayIntentBits,
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

const STOCK_CHANNEL_ID = "1497749476234760342";
const ALERTS_CHANNEL_ID = "1497948012603904000";

const DATA_FILE = "./state.json";

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
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(defaultState, null, 2)
      );

      return structuredClone(defaultState);
    }

    return JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

  } catch {

    return structuredClone(defaultState);
  }
}

let state = loadState();

function saveState() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(state, null, 2)
  );
}

// ======================================================
// DATA
// ======================================================

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

function getStatus(stock) {
  if (stock <= 30) return "🔴";
  if (stock <= 60) return "🟡";
  return "🟢";
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

// ======================================================
// INCIDENT SYSTEM
// ======================================================

async function createIncident() {

  const incident =
    incidentScenarios[
      Math.floor(Math.random() * incidentScenarios.length)
    ];

  const newIncident = {
    id: makeId("INC"),
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    points: incident.points,
    stockLoss: incident.stockLoss,
    status: "OPEN",
    createdAt: Date.now()
  };

  state.incidents.push(newIncident);

  saveState();

  const channel = await client.channels.fetch(
    ALERTS_CHANNEL_ID
  );

  if (!channel) return;

  await channel.send(
    `🚨 **URGENT CONTRACT ALERT** 🚨\n\n` +
    `**Severity:** ${incident.severity}\n` +
    `**Contract:** ${incident.description}\n` +
    `**Stock Impact:** -${incident.stockLoss}%\n` +
    `**Incident ID:** ${newIncident.id}`
  );
}

// ======================================================
// STOCK BOARD
// ======================================================

async function updateStockBoard() {

  try {

    const channel = await client.channels.fetch(
      STOCK_CHANNEL_ID
    );

    if (!channel) return;

    const stockText = state.stores
      .map(store =>
        `${getStatus(store.stock)} **${store.name}** — ${store.stock}%`
      )
      .join("\n");

    const content =
      `# 📦 LIVE STOCK BOARD\n\n` +
      `${stockText}\n\n` +
      `Last Updated: <t:${Math.floor(Date.now() / 1000)}:R>`;

    const messages = await channel.messages.fetch({
      limit: 10
    });

    const existing = messages.find(
      m => m.author.id === client.user.id
    );

    if (existing) {
      await existing.edit(content);
    } else {
      await channel.send(content);
    }

  } catch (err) {

    console.error(
      "Stock board update failed:",
      err
    );
  }
}

// ======================================================
// COMMANDS
// ======================================================

async function registerCommands() {

  const commands = [

    new SlashCommandBuilder()
      .setName("alert")
      .setDescription(
        "Trigger urgent contract"
      )
      .setDefaultMemberPermissions(
        PermissionFlagsBits.Administrator
      ),

    new SlashCommandBuilder()
      .setName("event")
      .setDescription(
        "Trigger company event"
      )
      .setDefaultMemberPermissions(
        PermissionFlagsBits.Administrator
      )

  ].map(c => c.toJSON());

  const rest = new REST({
    version: "10"
  }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationCommands(
      "1497676061083697313"
    ),
    { body: commands }
  );
}

// ======================================================
// READY
// ======================================================

client.once("clientReady", async () => {

  console.log(
    `Online: ${client.user.tag}`
  );

  await registerCommands();

  await updateStockBoard();
});

// ======================================================
// INTERACTIONS
// ======================================================

client.on(
  "interactionCreate",
  async interaction => {

    try {

      if (
        !interaction.isChatInputCommand()
      ) return;

      // ==========================================
      // /alert
      // ==========================================

      if (
        interaction.commandName === "alert"
      ) {

        await createIncident();

        return tempReply(
          interaction,
          "🚨 Urgent contract triggered."
        );
      }

      // ==========================================
      // /event
      // ==========================================

      if (
        interaction.commandName === "event"
      ) {

        state.activeCompanyEvent =
          companyEvents[
            Math.floor(
              Math.random() *
              companyEvents.length
            )
          ];

        saveState();

        return tempReply(
          interaction,
          `🏢 Company event triggered:\n\n${state.activeCompanyEvent.title}`
        );
      }

    } catch (error) {

      console.error(error);
    }
  }
);

// ======================================================
// AUTO STOCK UPDATE
// ======================================================

setInterval(async () => {

  await updateStockBoard();

}, 1000 * 60 * 5);

// ======================================================
// LOGIN
// ======================================================

client.login(process.env.TOKEN);