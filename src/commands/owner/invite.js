const { SlashCommandBuilder } = require('discord.js');
const { getOwnedTempChannel } = require('../../utils/checks');
const { config, format } = require('../../config');

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
      return interaction.reply({ content: config.messages.noOwnedChannel, ephemeral: true });
    }
    const target = interaction.options.getMember('user');
    if (!target) return interaction.reply({ content: config.messages.userNotFound, ephemeral: true });
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: config.messages.inviteSelf, ephemeral: true });
    }
    const voiceChannel = interaction.guild.channels.cache.get(tempRecord.channel_id);
    if (!voiceChannel) return interaction.reply({ content: config.messages.channelNotFound, ephemeral: true });

    await voiceChannel.permissionOverwrites.edit(target.id, { Connect: true, ViewChannel: true });
    try {
      await target.send(format(config.messages.inviteDm, {
        owner:   interaction.user.displayName,
        channel: voiceChannel.name,
        guild:   interaction.guild.name,
      }));
    } catch {}
    return interaction.reply({
      content: format(config.messages.invited, { user: target.id }),
      ephemeral: true,
    });
  },
};

