const { SlashCommandBuilder } = require('discord.js');
const { tempChannels } = require('../../database');
const { getOwnedTempChannel } = require('../../utils/checks');
const { syncTextChannel } = require('../../utils/permissions');

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
      return interaction.reply({ content: '❌ あなたが所有する一時チャンネルが見つかりません。', ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ ユーザーが見つかりません。', ephemeral: true });
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ 自分自身には譲渡できません。', ephemeral: true });
    }

    tempChannels.updateOwner.run(target.id, tempRecord.channel_id);

    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    const textChannel  = interaction.guild.channels.cache.get(tempRecord.text_channel_id);
    if (voiceChannel && textChannel) {
      await syncTextChannel(voiceChannel, textChannel, target.id).catch(() => {});
    }

    return interaction.reply({
      content: `✅ <@${target.id}> にチャンネルの所有権を譲渡しました。`,
      ephemeral: true,
    });
  },
};
