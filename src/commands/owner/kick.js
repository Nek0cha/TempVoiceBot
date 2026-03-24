const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');
const { config, format } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('一時チャンネルからユーザーを切断します')
    .addUserOption(opt =>
      opt.setName('user').setDescription('対象ユーザー').setRequired(true),
    ),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: config.messages.noOwnedChannel, ephemeral: true });
    }
    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: config.messages.userNotFound, ephemeral: true });
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: config.messages.kickSelf, ephemeral: true });
    }
    if (target.voice.channelId !== tempRecord.channel_id) {
      return interaction.reply({ content: config.messages.kickNotIn, ephemeral: true });
    }
    await target.voice.disconnect();
    return interaction.reply({
      content: format(config.messages.kicked, { user: target.id }),
      ephemeral: true,
    });
  },
};

