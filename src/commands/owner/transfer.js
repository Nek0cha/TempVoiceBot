const { SlashCommandBuilder } = require('discord.js');
const { tempChannels } = require('../../database');
const { getOwnedTempChannel } = require('../../utils/checks');
const { syncTextChannel } = require('../../utils/permissions');
const { config, format } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('チャンネルの所有権を他のユーザーに譲渡します')
    .addUserOption(opt =>
      opt.setName('user').setDescription('新しいオーナー').setRequired(true),
    ),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: config.messages.noOwnedChannel, ephemeral: true });
    }
    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: config.messages.userNotFound, ephemeral: true });
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: config.messages.transferSelf, ephemeral: true });
    }
    tempChannels.updateOwner.run(target.id, tempRecord.channel_id);
    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    const textChannel  = interaction.guild.channels.cache.get(tempRecord.text_channel_id);
    if (voiceChannel && textChannel) {
      await syncTextChannel(voiceChannel, textChannel, target.id).catch(() => {});
    }
    return interaction.reply({
      content: format(config.messages.transferred, { user: target.id }),
      ephemeral: true,
    });
  },
};

