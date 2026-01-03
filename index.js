  const { Client, GatewayIntentBits } = require('discord.js');
  const axios = require('axios');

  // Environment variables
  const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

  // Create Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // Bot ready event
  client.once('ready', () => {
    console.log(`✅ Makoto-kun is online as ${client.user.tag}!`);
  });

  // Message handler
  client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Only respond to messages that mention the bot or are DMs
    const isMentioned = message.mentions.has(client.user);
    const isDM = message.channel.type === 'DM';

    if (!isMentioned && !isDM) return;

    // Show typing indicator
    await message.channel.sendTyping();

    try {
      // Extract the message content (remove bot mention if present)
      let userMessage = message.content;
      if (isMentioned) {
        userMessage = userMessage.replace(`<@${client.user.id}>`, '').trim();
      }

      // Send message to n8n webhook
      const response = await axios.post(N8N_WEBHOOK_URL, {
        chatInput: userMessage,
        sessionId: message.author.id, // Use user ID for session continuity
      });

      // Get response from n8n
      const botReply = response.data;

      // Split long messages (Discord has 2000 char limit)
      if (botReply.length > 2000) {
        const chunks = botReply.match(/[\s\S]{1,2000}/g) || [];
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      } else {
        await message.reply(botReply);
      }
    } catch (error) {
      console.error('Error:', error);
      await message.reply('Sorry, I encountered an error. Please try again!');
    }
  });

  // Login to Discord
  client.login(DISCORD_TOKEN);
