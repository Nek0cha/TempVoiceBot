const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');
const { config, format } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limit')
    .setDescription('一時チャンネルの人数制限を設定します（0で無制限）')
    .addIntegerOption(opt =>
      opt.setName('number').setDescription('人数制限 (0〜99)').setRequired(true).setMinValue(0).setMaxValue(99),
    ),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: config.messages.noOwnedChannel, ephemeral: true });
    }
    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: config.messages.channelNotFound, ephemeral: true });

    const n = interaction.options.getInteger('number');
    await voiceChannel.setUserLimit(n);
    return interaction.reply({
      content: format(config.messages.limitSet, { limit: n === 0 ? '無制限' : `${n}人` }),
      ephemeral: true,
    });
  },
};

