require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

  new SlashCommandBuilder()
    .setName("job")
    .setDescription("Generate a delivery job"),

  new SlashCommandBuilder()
    .setName("deplete")
    .setDescription("Manually deplete store stock")

].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {

  try {

    console.log("Registering slash commands...");

    await rest.put(
  Routes.applicationCommands("1497676061083697313"),
  { body: commands }
);

    console.log("Slash commands registered.");

  } catch (error) {

    console.error(error);

  }

})();