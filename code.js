
function generateUID(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
const { 
  Client, GatewayIntentBits, REST, Routes, 
  SlashCommandBuilder, EmbedBuilder, 
  ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType 
} = require('discord.js');
const noblox = require('noblox.js');
const mysql = require('mysql2/promise');
const config = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

let db;
async function initDB() {
  const db = await mysql.createConnection({
    host: "db2.sillydevelopment.co.uk",
    port: 3306,
    user: "u50895_OsRJqiPDWS",
    password: "jM@Ntnr9Iz^nbbtxkssTeh^+",
    database: "s50895_wsp"
  });
  console.log('[Database] Connected to MySQL.');
      await db.query(`
      CREATE TABLE IF NOT EXISTS loas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        uid VARCHAR(10) UNIQUE NOT NULL,
        discord_user VARCHAR(255) NOT NULL,
        roblox_user VARCHAR(255) NOT NULL,
        reason TEXT NOT NULL,
        duration VARCHAR(50) NOT NULL,
        requester VARCHAR(255) NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'Pending'
      )
    `);
    console.log('[Database] LOA table is ready.');


  await db.query(`CREATE TABLE IF NOT EXISTS infractions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(10) UNIQUE NOT NULL,
    discord_user VARCHAR(255) NOT NULL,
    roblox_user VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    note TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    voided BOOLEAN DEFAULT FALSE
  )`);

  console.log('[Database] Infractions table is ready.');

  return db;
}

(async () => {
  db = await initDB();  // <-- assign to outer scoped db variable

  // Now you can use db.query(...) with async/await anywhere

  await client.login(config.token);
})();


client.once('ready', async () => {
  try {
    await noblox.setCookie(config.robloxCookie);
    console.log(`[Bot] Logged in as ${client.user.tag}`);
  } catch (err) {
    console.error('[Bot] Failed to login to Roblox:', err);
  }
});

const rankChoices = [
  { name: 'Customer', value: 1 },
  { name: 'VIP | Alliance Representative', value: 2 },
  { name: 'LR | Trainee', value: 3 },
  { name: 'LR | Wood Worker', value: 4 },
  { name: 'LR | Delivery Driver', value: 5 },
  { name: 'MR | Supervisor', value: 6 },
  { name: 'MR | Assistant Manager', value: 7 },
  { name: 'MR | Director', value: 8 },
  { name: 'HR | Corporate Officer', value: 9 },
  { name: 'HR | Senior Corporate Officer', value: 10 },
  { name: 'HR | Head Corporate Officer', value: 11 },
  { name: 'XX | Game Developer', value: 12 },
  { name: 'SHR | Group Director', value: 13 },
  { name: 'SHR | Chief Executive Officer', value: 14 },
  { name: 'SHR | Board Of Directors', value: 15 }, 
  { name: 'XX | Systems', value: 16 }
];

const commands = [
  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Send a direct message to a user')
    .addUserOption(opt => opt.setName('user').setDescription('The user to DM').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('The message to send').setRequired(true)),

  new SlashCommandBuilder()
    .setName('loa')
    .setDescription('Log a leave of absence')
    .addUserOption(opt => opt.setName('discord_user').setDescription('Discord user').setRequired(true))
    .addStringOption(opt => opt.setName('roblox_user').setDescription('Roblox username').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Duration').setRequired(true)),

  new SlashCommandBuilder()
    .setName('loa-search')
    .setDescription('Search LOA requests')
    .addStringOption(opt => opt.setName('uid').setDescription('UID of the LOA request').setRequired(false))
    .addStringOption(opt => opt.setName('roblox_username').setDescription('Roblox username').setRequired(false)),

  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Fetch Roblox rank')
    .addStringOption(opt => opt.setName('roblox_user').setDescription('Roblox username').setRequired(true)),

  new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Request promotion')
    .addStringOption(opt => opt.setName('roblox_user').setDescription('Roblox username').setRequired(true))
    .addIntegerOption(opt => opt.setName('rankid').setDescription('Rank ID').setRequired(true).addChoices(...rankChoices))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

  new SlashCommandBuilder()
    .setName('demote')
    .setDescription('Request demotion')
    .addStringOption(opt => opt.setName('roblox_user').setDescription('Roblox username').setRequired(true))
    .addIntegerOption(opt => opt.setName('rankid').setDescription('Rank ID').setRequired(true).addChoices(...rankChoices))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

new SlashCommandBuilder()
  .setName('infraction-issue')
  .setDescription('Log an infraction')
  .addUserOption(opt => opt.setName('discord_user').setDescription('Discord user to issue the infraction to').setRequired(true))
  .addStringOption(opt => opt.setName('roblox_user').setDescription('Roblox username').setRequired(true))
  .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true))
  .addStringOption(opt => opt.setName('note').setDescription('Note').setRequired(true))
  .addStringOption(opt => opt.setName('action').setDescription('Action taken').setRequired(true)),


  new SlashCommandBuilder()
    .setName('infraction-list')
    .setDescription('View infractions')
    .addUserOption(opt => opt.setName('discord_user').setDescription('Discord user').setRequired(false))
    .addStringOption(opt => opt.setName('uid').setDescription('Specific Infraction UID').setRequired(false)),
];

const rest = new REST({ version: '10' }).setToken(config.token);
function generateUID() {
  return [...Array(8)].map(() => '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 36))).join('');
};
(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId), 
      { body: commands }
    );
    console.log('[Bot] Slash commands registered.');
  } catch (err) {
    console.error('[Bot] Error registering commands:', err);
  }
})();

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    console.log(`[Command] ${interaction.user.tag} used /${interaction.commandName}`);

    // Staff role check (except for some commands if needed)
if (!interaction.member.roles.cache.some(role => config.staffRoleIds.includes(role.id))) {
  return interaction.reply({ content: "You must be staff to use this command.", ephemeral: true });
}
  }
});

    const { commandName } = interaction;

    // /dm command
    if (commandName === 'dm') {
      const targetUser = interaction.options.getUser('user');
      const message = interaction.options.getString('message');

      try {
        await targetUser.send(message);
        return interaction.reply({ content: `✅ Successfully sent DM to <@${targetUser.id}>.`, ephemeral: true });
      } catch (error) {
        console.error('[DM] Error sending DM:', error);
        return interaction.reply({ content: `❌ Could not send DM to <@${targetUser.id}>. They may have DMs disabled.`, ephemeral: true });
      }
    }

    // /loa-search command
    if (commandName === 'loa-search') {
      const uid = interaction.options.getString('uid');
      const robloxUsername = interaction.options.getString('roblox_username');

      if (!uid && !robloxUsername) {
        return interaction.reply({ content: 'Please provide either a UID or a Roblox username to search.', ephemeral: true });
      }

      let query = 'SELECT * FROM loas WHERE ';
      const params = [];

      if (uid) {
        query += 'uid = ? ';
        params.push(uid);
      }
      if (robloxUsername) {
        if (uid) query += 'AND ';
        query += 'roblox_user = ? ';
        params.push(robloxUsername);
      }

      db.query(query, params, (err, results) => {
        if (err) {
          console.error('DB Error:', err);
          return interaction.reply({ content: 'Database error occurred.', ephemeral: true });
        }
        if (!results.length) {
          return interaction.reply({ content: 'No LOA requests found for the given criteria.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
          .setTitle(`LOA Search Results (${results.length})`)
          .setColor('#8ec227')
          .setTimestamp();

        results.forEach(row => {
          embed.addFields(
            { name: 'UID', value: String(row.uid || 'N/A'), inline: true },
            { name: 'Discord User', value: `<@${row.discord_user || 'Unknown'}>`, inline: true },
            { name: 'Roblox Username', value: String(row.roblox_user || 'Unknown'), inline: true },
            { name: 'Reason', value: String(row.reason || 'None'), inline: false },
            { name: 'Duration', value: String(row.duration || 'N/A'), inline: true },
            { name: 'Status', value: String(row.status || 'N/A'), inline: true },
            { name: 'Requested By', value: String(row.requester || 'Unknown'), inline: true },
            { name: 'Timestamp', value: row.timestamp ? new Date(row.timestamp).toLocaleString() : 'Unknown', inline: false }
          );
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      });

      return;
    }

    // /loa command
    if (commandName === 'loa') {
      const discordUser = interaction.options.getUser('discord_user');
      const robloxUser = interaction.options.getString('roblox_user');
      const reason = interaction.options.getString('reason');
      const duration = interaction.options.getString('duration');

      const uid = generateUID(); // <-- Define this function elsewhere, returns 8 char UID

      const embed = new EmbedBuilder()
        .setTitle('Leave of Absence Request')
        .setColor('#8ec227')
        .addFields(
          { name: 'UID', value: uid, inline: true },
          { name: 'Discord User', value: `<@${discordUser.id}>`, inline: true },
          { name: 'Roblox Username', value: robloxUser, inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Duration', value: duration, inline: true },
          { name: 'Requested By', value: interaction.user.tag, inline: true },
          { name: 'Status', value: 'Pending', inline: true }
        )
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_loa_${uid}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`deny_loa_${uid}`)
          .setLabel('Deny')
          .setStyle(ButtonStyle.Danger)
      );

      db.query(
        'INSERT INTO loas (uid, discord_user, roblox_user, reason, duration, requester, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uid, discordUser.id, robloxUser, reason, duration, interaction.user.tag, 'Pending'],
        (err) => {
          if (err) {
            console.error('DB Insert LOA Error:', err);
            return interaction.reply({ content: 'Failed to log LOA request in the database.', ephemeral: true });
          }

          const channel = client.channels.cache.get(config.loaChannelId);
          if (channel) {
            channel.send({ embeds: [embed], components: [buttons] });
          }

          return interaction.reply({ content: `✅ LOA request logged with UID: ${uid}`, ephemeral: true });
        }
      );

      return;
    }

    // /rank command
    if (commandName === 'rank') {
      const robloxUser = interaction.options.getString('roblox_user');

      try {
        const userId = await noblox.getIdFromUsername(robloxUser);
        const rank = await noblox.getRankInGroup(config.robloxGroupId, userId);
        return interaction.reply({ content: `User ${robloxUser} has rank ID ${rank} in the group.` });
      } catch (err) {
        return interaction.reply({ content: `Error fetching rank: ${err.message}`, ephemeral: true });
      }
    }

    // /promote and /demote commands
    if (commandName === 'promote' || commandName === 'demote') {
      // Manager role check
      const managerRoleIds = config.managerRoleIds || [];
      const isManager = managerRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
      if (!isManager) {
        return interaction.reply({ content: 'You must be a manager to use this.', ephemeral: true });
      }

      const robloxUser = interaction.options.getString('roblox_user');
      const rankId = interaction.options.getInteger('rankid');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      const uid = generateUID();

      const embed = new EmbedBuilder()
        .setTitle(commandName === 'promote' ? 'Promotion Request' : 'Demotion Request')
        .setColor(commandName === 'promote' ? '#2ebd1e' : '#ff0000')
        .addFields(
          { name: 'UID', value: uid, inline: true },
          { name: 'Roblox User', value: robloxUser, inline: true },
          { name: 'Requested Rank ID', value: rankId.toString(), inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Requested By', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();

      // Create approve / deny buttons
      const approveBtn = new ButtonBuilder()
        .setCustomId(`approve_${commandName}_${uid}`)
        .setLabel('Approve')
        .setStyle(ButtonStyle.Success);
      const denyBtn = new ButtonBuilder()
        .setCustomId(`deny_${commandName}_${uid}`)
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(approveBtn, denyBtn);

      // Send to promotion log channel
      const promoChannel = client.channels.cache.get(config.promoLogChannelId);
      if (!promoChannel) {
        return interaction.reply({ content: 'Promotion log channel not found.', ephemeral: true });
      }

      await promoChannel.send({ embeds: [embed], components: [row] });

      return interaction.reply({ content: `✅ Your ${commandName} request has been sent for approval with UID: ${uid}`, ephemeral: true });
    }
 if (commandName === 'infraction-list') {
  console.log('[DEBUG] Command infraction-list triggered');

  const uid = interaction.options.getString('uid');
  const discordUser = interaction.options.getUser('discord_user');

  if (!uid && !discordUser) {
    return interaction.reply({ content: 'Please provide a UID or a Discord user to search for.', ephemeral: true });
  }

  let query = 'SELECT * FROM infractions WHERE voided = FALSE';
  const params = [];

  if (uid) {
    query += ' AND uid = ?';
    params.push(uid.toUpperCase());
  }
  if (discordUser) {
    query += ' AND discord_user = ?';
    params.push(discordUser.id);
  }

  console.log('[DEBUG] Running DB query:', query, params);

  try {
    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return interaction.reply({ content: 'No matching infractions found.', ephemeral: false });
    }

    // Limit to 10 to avoid spam
    const results = rows.slice(0, 10);

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(`Infractions${uid ? ` for UID: ${uid}` : ''}${discordUser ? ` for ${discordUser.tag}` : ''}`)
      .setColor('#ff0000')
      .setTimestamp();

    // Prepare buttons (one per infraction)
    const buttons = new ActionRowBuilder();

    results.forEach(infraction => {
      embed.addFields({
        name: `UID: ${infraction.uid} — Action: ${infraction.action}`,
        value: `Reason: ${infraction.reason}\nNote: ${infraction.note}\nIssued to: <@${infraction.discord_user}>\nTimestamp: ${new Date(infraction.timestamp).toLocaleString()}`,
        inline: false,
      });

      // Add one void button per infraction (use uid as customId suffix)
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`void_infraction_${infraction.uid}`)
          .setLabel(`Void ${infraction.uid}`)
          .setStyle(ButtonStyle.Danger)
      );
    });

    if (rows.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${rows.length} infractions.` });
    }

    // Send public message with embed + buttons
    await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: false });

  } catch (err) {
    console.error('[ERROR] DB Query infraction-list:', err);
    return interaction.reply({ content: 'Failed to fetch infractions from the database.', ephemeral: true });
  }
}

// Button interaction handling (outside command handler, in your interactionCreate event):

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('void_infraction_')) {
    const uid = interaction.customId.replace('void_infraction_', '');
    const member = interaction.member;

    // Check if user has a manager role
    const hasManagerRole = config.managerRoleIds.some(roleId => member.roles.cache.has(roleId));

    if (!hasManagerRole) {
      return interaction.reply({ content: 'You do not have permission to void infractions.', ephemeral: true });
    }

    try {
      // Update DB - mark infraction as voided
      const [result] = await db.query('UPDATE infractions SET voided = TRUE WHERE uid = ? AND voided = FALSE', [uid]);

      if (result.affectedRows === 0) {
        return interaction.reply({ content: `Infraction UID ${uid} was not found or is already voided.`, ephemeral: true });
      }

      // Respond to interaction
      await interaction.reply({ content: `Infraction UID ${uid} has been voided successfully.`, ephemeral: false });

      // Optionally, you could also edit the original message or disable the void button for that UID here
      // But be aware of message caching & permissions, so it's optional

    } catch (err) {
      console.error('[ERROR] DB update void infraction:', err);
      return interaction.reply({ content: 'An error occurred while voiding the infraction.', ephemeral: true });
    }
  }
});

// /infraction-issue command
if (commandName === 'infraction-issue') {
  console.log('[DEBUG] Command infraction-issue triggered');

  const discordUser = interaction.options.getUser('discord_user');
  const robloxUser = interaction.options.getString('roblox_user');
  const reason = interaction.options.getString('reason');
  const uid = generateUID();

  console.log(`[DEBUG] Generated UID: ${uid}`);

  const embed = new EmbedBuilder()
    .setTitle('Pending Infraction')
    .setColor('#FFD700') // Yellow
    .addFields(
      { name: 'UID', value: uid, inline: true },
      { name: 'Discord User', value: `<@${discordUser.id}>`, inline: true },
      { name: 'Roblox Username', value: robloxUser, inline: true },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Issued By', value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`infraction_approve_${uid}`)
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`infraction_deny_${uid}`)
      .setLabel('Deny')
      .setStyle(ButtonStyle.Danger)
  );

  console.log('[DEBUG] Running DB insert query');

  try {
    await db.query(
      'INSERT INTO infractions (uid, discord_user, roblox_user, reason, requester, status) VALUES (?, ?, ?, ?, ?, ?)',
      [uid, discordUser.id, robloxUser, reason, interaction.user.tag, 'pending']
    );

    console.log('[DEBUG] Infraction inserted into DB successfully');

    const logChannel = client.channels.cache.get(config.infractionsLogChannelId);
    if (!logChannel) {
      console.warn('[WARN] Log channel not found or not cached');
    } else {
      console.log('[DEBUG] Sending embed with buttons to log channel');
      await logChannel.send({ embeds: [embed], components: [buttons] });
      console.log('[DEBUG] Message sent to log channel');
    }

    return interaction.reply({ content: `✅ Infraction request logged with UID: ${uid} (awaiting approval)`, ephemeral: true });
  } catch (err) {
    console.error('[ERROR] DB Insert Infraction Error:', err);
    return interaction.reply({ content: 'Failed to log infraction in database.', ephemeral: true });
  }
}

// --------- Button Interaction Handler for Infraction Approve/Deny ---------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const managerRoleIds = config.managerRoleIds || [];
  const memberRoles = interaction.member.roles.cache.map(r => r.id);
  const isManager = memberRoles.some(roleId => managerRoleIds.includes(roleId));

  if (!isManager) {
    return interaction.reply({ content: '❌ You do not have permission to approve or deny infractions.', ephemeral: true });
  }

  const customId = interaction.customId;
  if (!customId.startsWith('infraction_')) return;

  const parts = customId.split('_'); // ['infraction', 'approve', 'UID']
  const action = parts[1]; // 'approve' or 'deny'
  const uid = parts.slice(2).join('_');

  try {
    const [rows] = await db.query('SELECT * FROM infractions WHERE uid = ?', [uid]);
    if (!rows.length) {
      return interaction.reply({ content: '❌ Infraction not found.', ephemeral: true });
    }
    const infraction = rows[0];

    if (infraction.status !== 'pending') {
      return interaction.reply({ content: `⚠️ This infraction has already been ${infraction.status}.`, ephemeral: true });
    }

    const newStatus = action === 'approve' ? 'approved' : 'denied';
    await db.query('UPDATE infractions SET status = ? WHERE uid = ?', [newStatus, uid]);

    // Update embed
    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setColor(action === 'approve' ? '#00FF00' : '#FF0000') // Green or Red
      .setTitle(`Infraction ${action === 'approve' ? 'Approved' : 'Denied'}`)
      .addFields({ name: 'Handled By', value: `<@${interaction.user.id}>`, inline: true });

    const disabledButtons = new ActionRowBuilder().addComponents(
      ...interaction.message.components[0].components.map(button =>
        ButtonBuilder.from(button).setDisabled(true)
      )
    );

    await interaction.message.edit({ embeds: [updatedEmbed], components: [disabledButtons] });

    await interaction.reply({ content: `✅ Infraction ${newStatus}`, ephemeral: true });

    // Only DM the user if approved
    if (action === 'approve') {
      try {
        const user = await client.users.fetch(infraction.discord_user);
        await user.send(`🔔 You have received an infraction.\n**UID:** ${uid}\n**Reason:** ${infraction.reason}`);
        console.log(`[DEBUG] Approved infraction DM sent to ${user.tag}`);
      } catch (dmErr) {
        console.warn(`[WARN] Failed to DM user:`, dmErr.message);
      }
    }

  } catch (error) {
    console.error('[ERROR] Infraction button handler:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ An error occurred while processing this action.', ephemeral: true });
    }
  }
});
console.log(config);
client.login(config.token);
