require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

for (const folder of ['admin', 'owner']) {
  const dir = path.join(__dirname, 'commands', folder);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(dir, file));
    if (command.data) {
      commands.push(command.data.toJSON());
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Registering ${commands.length} commands...`);
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    await rest.put(route, { body: commands });
    console.log('✅ Commands registered successfully!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
