const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { masterChannels } = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settemplate')
    .setDescription('一時チャンネルの名前テンプレートを設定します（%owner%, %counter% 使用可）')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(opt =>
      opt.setName('master')
        .setDescription('対象のマスターチャンネル')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true),
    )
    .addStringOption(opt =>
      opt.setName('template')
        .setDescription('テンプレート (例: %owner%のチャンネル)')
        .setRequired(true),
    ),

  async execute(interaction) {
    const master   = interaction.options.getChannel('master');
    const template = interaction.options.getString('template');

    const masterRecord = masterChannels.getByChannel.get(master.id);
    if (!masterRecord || masterRecord.guild_id !== interaction.guildId) {
      return interaction.reply({
        content: '❌ 指定したチャンネルはマスターチャンネルではありません。',
        ephemeral: true,
      });
    }

    masterChannels.updateTemplate.run(template, master.id);

    return interaction.reply({
      content: `✅ テンプレートを \`${template}\` に設定しました。`,
      ephemeral: true,
    });
  },
};
