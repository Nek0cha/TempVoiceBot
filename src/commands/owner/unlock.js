const { SlashCommandBuilder } = require('discord.js');
const { tempChannels } = require('../../database');
const { getOwnedTempChannel } = require('../../utils/checks');
const { applyVCPermissions } = require('../../utils/permissions');
const { config } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('一時チャンネルのロックを解除します'),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: config.messages.noOwnedChannel, ephemeral: true });
    }
    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: config.messages.channelNotFound, ephemeral: true });

    tempChannels.updateLocked.run(0, tempRecord.channel_id);
    const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
    await applyVCPermissions(voiceChannel, interaction.guild, updated);
    return interaction.reply({ content: config.messages.unlocked, ephemeral: true });
  },
};

