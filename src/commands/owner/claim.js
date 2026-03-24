const { SlashCommandBuilder } = require('discord.js');
const { tempChannels } = require('../../database');
const { syncTextChannel } = require('../../utils/permissions');
const { config, format } = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('オーナーが退出した一時チャンネルの所有権を取得します'),

  async execute(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({ content: config.messages.claimNotInVC, ephemeral: true });
    }
    const voiceChannelId = member.voice.channel.id;
    const tempRecord = tempChannels.getByChannel.get(voiceChannelId);
    if (!tempRecord) {
      return interaction.reply({ content: config.messages.claimNotTempVC, ephemeral: true });
    }
    if (tempRecord.owner_id === interaction.user.id) {
      return interaction.reply({ content: config.messages.claimAlreadyOwner, ephemeral: true });
    }
    if (member.voice.channel.members.has(tempRecord.owner_id)) {
      return interaction.reply({ content: config.messages.claimOwnerPresent, ephemeral: true });
    }
    tempChannels.updateOwner.run(interaction.user.id, voiceChannelId);
    const textChannel = interaction.guild.channels.cache.get(tempRecord.text_channel_id);
    if (textChannel) {
      await syncTextChannel(member.voice.channel, textChannel, interaction.user.id).catch(() => {});
    }
    return interaction.reply({
      content: format(config.messages.claimAnnounce, { user: interaction.user.id }),
    });
  },
};

