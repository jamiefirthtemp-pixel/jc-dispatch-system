require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// =========================
// CLIENT
// =========================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =========================
// DATA
// =========================

let jobs = [];
let drivers = {};
let driverStats = {};

// =========================
// STORES
// =========================

let stores = [

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

// =========================
// STATUS FUNCTION
// =========================

function getStatus(stock) {

  if (stock <= 30) return "🔴 LOW";

  if (stock <= 60) return "🟡 MEDIUM";

  return "🟢 HIGH";

}

// =========================
// DAILY STOCK DEPLETION
// =========================

setInterval(() => {

  try {

    stores.forEach(store => {

      store.stock = Math.max(
        0,
        Math.floor(store.stock * 0.9)
      );

    });

    console.log(
      "10% stock depletion completed."
    );

  } catch (error) {

    console.error(
      "Stock depletion error:",
      error
    );

  }

}, 86400000);

// =========================
// REGISTER COMMANDS
// =========================

async function registerCommands() {

  try {

    const commands = [

      new SlashCommandBuilder()

        .setName("job")

        .setDescription(
          "Generate a delivery job"
        ),

      new SlashCommandBuilder()

        .setName("deplete")

        .setDescription(
          "Manually deplete stock"
        )

    ].map(command =>
      command.toJSON()
    );

    const rest = new REST({
      version: "10"
    }).setToken(process.env.TOKEN);

    await rest.put(

      Routes.applicationCommands(
        process.env.CLIENT_ID
      ),

      { body: commands }

    );

    console.log(
      "Slash commands registered."
    );

  } catch (error) {

    console.error(
      "Command registration error:",
      error
    );

  }

}

// =========================
// BOT READY
// =========================

client.once("ready", async () => {

  console.log(
    `Bot online: ${client.user.tag}`
  );

  await registerCommands();

});

// =========================
// INTERACTIONS
// =========================

client.on(
  "interactionCreate",
  async interaction => {

    try {

      // =========================
      // SLASH COMMANDS
      // =========================

      if (
        interaction.isChatInputCommand()
      ) {

        // =========================
        // /JOB
        // =========================

        if (
          interaction.commandName ===
          "job"
        ) {

          // ACTIVE JOB CHECK

          if (
            drivers[
              interaction.user.id
            ]
          ) {

            return await interaction.reply({

              content:
                "❌ You already have an active job.",

              ephemeral: true

            });

          }

          // SORT STORES

          let sortedStores =
            [...stores].sort(
              (a, b) =>
                a.stock - b.stock
            );

          let selectedStore =
            sortedStores[0];

          // JOB ID

          let jobId =
            "J-" +
            Math.floor(
              Math.random() *
              100000
            );

          // SAVE JOB

          jobs.push({

            id: jobId,

            userId:
              interaction.user.id,

            store:
              selectedStore.name

          });

          // LOCK DRIVER

          drivers[
            interaction.user.id
          ] = true;

          // BUTTON

          const row =
            new ActionRowBuilder()

              .addComponents(

                new ButtonBuilder()

                  .setCustomId(
                    `complete_${jobId}`
                  )

                  .setLabel(
                    "Job Completed"
                  )

                  .setStyle(
                    ButtonStyle.Success
                  )

              );

          // SEND JOB

          await interaction.reply({

            content:

`┌──────────────────────────────┐
   JC LOGISTICS DISPATCH
└──────────────────────────────┘

🚚 JOB ID:
${jobId}

🏪 STORE:
${selectedStore.name}

📊 STOCK:
${getStatus(selectedStore.stock)}
(${selectedStore.stock}%)

📦 STATUS:
IN TRANSIT
`,

            components: [row]

          });

        }

        // =========================
        // /DEPLETE
        // =========================

        if (
          interaction.commandName ===
          "deplete"
        ) {

          let randomStore =
            stores[
              Math.floor(
                Math.random() *
                stores.length
              )
            ];

          randomStore.stock =
            Math.max(
              0,
              randomStore.stock - 20
            );

          await interaction.reply({

            content:

`⚠️ MANUAL DEPLETION

🏪 STORE:
${randomStore.name}

📉 NEW STOCK:
${randomStore.stock}%
`,

            ephemeral: true

          });

        }

      }

      // =========================
      // BUTTONS
      // =========================

      if (interaction.isButton()) {

        // COMPLETE JOB

        if (
          interaction.customId.startsWith(
            "complete_"
          )
        ) {

          let jobId =
            interaction.customId.split(
              "_"
            )[1];

          let job =
            jobs.find(
              j => j.id === jobId
            );

          if (!job) {

            return await interaction.reply({

              content:
                "❌ Job not found.",

              ephemeral: true

            });

          }

          let store =
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

          // REMOVE ACTIVE JOB

          delete drivers[
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

          // UPDATE MESSAGE

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

      try {

        if (!interaction.replied) {

          await interaction.reply({

            content:
              "❌ System error occurred.",

            ephemeral: true

          });

        }

      } catch {}

    }

  }
);

// =========================
// ERROR HANDLING
// =========================

process.on(
  "unhandledRejection",
  error => {

    console.error(
      "Unhandled rejection:",
      error
    );

  }
);

process.on(
  "uncaughtException",
  error => {

    console.error(
      "Uncaught exception:",
      error
    );

  }
);

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);