async function registerCommands() {

  const commands = [
    new SlashCommandBuilder()
      .setName("alert")
      .setDescription("Trigger urgent contract")
      .setDefaultMemberPermissions(
        PermissionFlagsBits.Administrator
      )
  ].map(c => c.toJSON());

  const rest = new REST({ version: "10" })
    .setToken(process.env.TOKEN);

  await rest.put(

    Routes.applicationCommands(
      "1497676061083697313"
    ),

    { body: commands }

  );

}