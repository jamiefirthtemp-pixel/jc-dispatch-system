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
// EMERGENCY EVENTS
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
// SMART DISPATCH
// ======================================================

function getSmartStore(
  rdc
) {

  // emergency override

  if (
    activeEmergency
  ) {

    return activeEmergency;

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
// EMERGENCY EVENT SYSTEM
// ======================================================

function triggerEmergencyEvent() {

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

  const event =
    events[
      Math.floor(
        Math.random() *
        events.length
      )
    ];

  randomStore.stock =
    Math.max(
      0,
      randomStore.stock -
      35
    );

  activeEmergency =
    randomStore;

  console.log(
    `EMERGENCY EVENT:
${event}
${randomStore.name}`
  );

  setTimeout(() => {

    activeEmergency =
      null;

    console.log(
      "Emergency cleared."
    );

  }, 3600000);

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

    if (!channel)
      return;

    const grouped =
      groupStores();

    let critical = 0;
    let low = 0;

    stores.forEach(
      store => {

        if (
          store.stock <= 30
        ) {

          critical++;

        } else if (
          store.stock <= 60
        ) {

          low++;

        }

      }
    );

    let content =
`╔════════════════════════╗
      JC LOGISTICS
        STOCK BOARD
╚════════════════════════╝

🔴 Critical Stores: ${critical}
🟡 Low Stock Stores: ${low}

`;

    // emergency banner

    if (
      activeEmergency
    ) {

      content +=
`🚨 ACTIVE EMERGENCY
━━━━━━━━━━━━━━━━━━
${activeEmergency.name}

PRIORITY RESTOCK REQUIRED

`;

    }

    Object.keys(
      grouped
    ).forEach(
      company => {

        content +=
`📦 ${company}
━━━━━━━━━━━━━━━━━━
`;

        const sorted =
          grouped[
            company
          ].sort(
            (
              a,
              b
            ) =>
              a.stock -
              b.stock
          );

        sorted.forEach(
          store => {

            const icon =
              getStatus(
                store.stock
              );

            const short =
              store.name.split(
                " - "
              )[1];

            const dots =
              ".".repeat(
                Math.max(
                  1,
                  18 -
                  short.length
                )
              );

            content +=
`${icon} ${short} ${dots} ${store.stock}%
`;

          }
        );

        content += "\n";

      }
    );

    const messages =
      await channel.messages.fetch(
        {
          limit: 10
        }
      );

    const existing =
      messages.find(
        m =>
          m.author.id ===
          client.user.id
      );

    if (existing) {

      await existing.edit(
        content
      );

    } else {

      await channel.send(
        content
      );

    }

  } catch (
    error
  ) {

    console.error(
      error
    );

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

    if (!channel)
      return;

    const sorted =
      Object.entries(
        driverStats
      ).sort(
        (
          a,
          b
        ) =>
          b[1] - a[1]
      );

    let content =
`🏆 JC LOGISTICS LEADERBOARD

`;

    if (
      sorted.length === 0
    ) {

      content +=
`No completed deliveries yet.`;

    } else {

      sorted.forEach(
        (
          [
            userId,
            count
          ],
          index
        ) => {

          let medal =
            "▫️";

          if (
            index === 0
          )
            medal =
              "🥇";

          if (
            index === 1
          )
            medal =
              "🥈";

          if (
            index === 2
          )
            medal =
              "🥉";

          content +=
`${medal} <@${userId}> — ${count} deliveries
`;

        }
      );

    }

    const messages =
      await channel.messages.fetch(
        {
          limit: 10
        }
      );

    const existing =
      messages.find(
        m =>
          m.author.id ===
          client.user.id
      );

    if (existing) {

      await existing.edit(
        content
      );

    } else {

      await channel.send(
        content
      );

    }

  } catch (
    error
  ) {

    console.error(
      error
    );

  }

}

// ======================================================
// TERMINAL
// ======================================================

async function createDispatchTerminal() {

  try {

    const channel =
      await client.channels.fetch(
        JOB_CHANNEL_ID
      );

    if (!channel)
      return;

    const menu =
      new StringSelectMenuBuilder()

        .setCustomId(
          "rdc_select"
        )

        .setPlaceholder(
          "Select RDC"
        )

        .addOptions(

          rdcs.map(
            rdc => ({

              label:
                rdc,

              value:
                rdc

            })
          )

        );

    const row1 =
      new ActionRowBuilder()
        .addComponents(
          menu
        );

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
      await channel.messages.fetch(
        {
          limit: 10
        }
      );

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

  } catch (
    error
  ) {

    console.error(
      error
    );

  }

}

// ======================================================
// STOCK DRAIN
// ======================================================

setInterval(

  async () => {

    stores.forEach(
      store => {

        let drain =
          Math.floor(
            Math.random() *
            12
          ) + 4;

        // london stores
        // drain faster

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
            store.stock -
            drain
          );

      }
    );

    // 30% chance
    // of emergency

    if (
      Math.random() <
      0.3
    ) {

      triggerEmergencyEvent();

    }

    await updateStockBoard();

  },

  86400000
);

// ======================================================
// READY
// ======================================================

client.once(
  "ready",

  async () => {

    console.log(
      `Bot online: ${client.user.tag}`
    );

    await createDispatchTerminal();

    await updateStockBoard();

    await updateLeaderboard();

  }
);

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

          return await tempReply(

            interaction,

`✅ RDC Selected

${interaction.values[0]}`

          );

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
            getSmartStore(
              rdc
            );

          const emergency =
            activeEmergency &&
            store.name ===
            activeEmergency.name;

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

            id:
              jobId,

            user:
              interaction.user.id,

            store:
              store.name

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

          let priority =
            "STANDARD";

          if (
            emergency
          ) {

            priority =
              "🚨 EMERGENCY";

          }

          const content =
`┌──────────────────────────────┐
      ACTIVE DISPATCH
└──────────────────────────────┘

👤 DRIVER:
<@${interaction.user.id}>

🚚 JOB ID:
${jobId}

🏭 RDC:
${rdc}

🌍 REGION:
${store.region}

🏪 STORE:
${store.name}

⚠ PRIORITY:
${priority}

📦 STOCK:
${store.stock}%

📋 STATUS:
IN TRANSIT
`;

          if (
            activeChannel
          ) {

            await activeChannel.send({

              content,

              components:
                [row]

            });

          }

          await tempReply(

            interaction,

            "✅ Dispatch generated."

          );

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
                j.id ===
                jobId
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
              store.stock + 25
            );

          delete activeDrivers[
            job.user
          ];

          activeJobs =
            activeJobs.filter(
              j =>
                j.id !==
                jobId
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
          ]++;

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

          // clear emergency
          // after delivery

          if (
            activeEmergency &&
            activeEmergency.name ===
            store.name
          ) {

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

                  .setDisabled(
                    true
                  )

              );

          await interaction.update({

            content:
`┌──────────────────────────────┐
      DELIVERY COMPLETE
└──────────────────────────────┘

👤 DRIVER:
<@${job.user}>

🚚 JOB ID:
${jobId}

🏪 STORE:
${store.name}

📦 UPDATED STOCK:
${store.stock}%

📋 STATUS:
COMPLETE

📈 DRIVER COMPLETIONS:
${driverStats[job.user]}
`,

            components: [
              disabledRow
            ]

          });

        }

      }

    } catch (
      error
    ) {

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