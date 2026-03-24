require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// Load commands
for (const folder of ['admin', 'owner']) {
  const dir = path.join(__dirname, 'commands', folder);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(dir, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

// Load events
const eventsDir = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsDir, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.login(process.env.DISCORD_TOKEN);
