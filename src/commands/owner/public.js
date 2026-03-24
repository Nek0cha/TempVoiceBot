const { SlashCommandBuilder } = require('discord.js');
const { tempChannels } = require('../../database');
const { getOwnedTempChannel } = require('../../utils/checks');
const { applyVCPermissions } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('public')
    .setDescription('一時チャンネルを公開状態にします'),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: '❌ あなたが所有する一時チャンネルが見つかりません。', ephemeral: true });
    }

    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: '❌ チャンネルが見つかりません。', ephemeral: true });

    tempChannels.updatePrivate.run(0, tempRecord.channel_id);
    const updated = tempChannels.getByChannel.get(tempRecord.channel_id);
    await applyVCPermissions(voiceChannel, interaction.guild, updated);
    return interaction.reply({ content: '🌐 チャンネルを公開しました。', ephemeral: true });
  },
};
