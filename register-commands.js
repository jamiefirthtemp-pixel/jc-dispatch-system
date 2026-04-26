require("dotenv").config();

const { REST, Routes } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// EMPTY COMMAND ARRAY = DELETE ALL COMMANDS

(async () => {

  try {

    console.log("Removing slash commands...");

    await rest.put(

      Routes.applicationCommands("1497676061083697313"),

      { body: [] }

    );

    console.log("Slash commands removed.");

  } catch (error) {

    console.error(error);

  }

})();