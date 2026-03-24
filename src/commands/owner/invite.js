const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('一時チャンネルにユーザーを招待します')
    .addUserOption(opt =>
      opt.setName('user').setDescription('招待するユーザー').setRequired(true),
    ),

  async execute(interaction) {
    const tempRecord = getOwnedTempChannel(interaction.guildId, interaction.user.id);
    if (!tempRecord) {
      return interaction.reply({ content: '❌ あなたが所有する一時チャンネルが見つかりません。', ephemeral: true });
    }

    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: '❌ ユーザーが見つかりません。', ephemeral: true });

    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: '❌ チャンネルが見つかりません。', ephemeral: true });

    await voiceChannel.permissionOverwrites.edit(target.id, { Connect: true, ViewChannel: true });

    try {
      await target.send(
        `📩 <@${interaction.user.id}> からボイスチャンネル **${voiceChannel.name}** に招待されました！`,
      );
    } catch {}

    return interaction.reply({ content: `✅ <@${target.id}> を招待しました。`, ephemeral: true });
  },
};
