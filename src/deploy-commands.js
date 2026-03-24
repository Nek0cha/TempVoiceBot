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
    const clientId = process.env.CLIENT_ID;
    const guildId = process.env.GUILD_ID;

    if (guildId) {
      // ギルドに登録し、グローバルコマンドをクリア（重複防止）
      console.log(`🔄 Registering ${commands.length} guild commands (guild: ${guildId})...`);
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log('🧹 Clearing global commands...');
      await rest.put(Routes.applicationCommands(clientId), { body: [] });
    } else {
      // グローバルに登録し、ギルドコマンドをクリア（登録済みギルドは不明なため手動対応が必要）
      console.log(`🔄 Registering ${commands.length} global commands...`);
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('ℹ️  Note: Guild-scoped commands (if any) must be cleared manually per guild.');
    }

    console.log('✅ Commands registered successfully!');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
