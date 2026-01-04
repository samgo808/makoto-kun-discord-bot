const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
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
      GatewayIntentBits.DirectMessages,
    ],
  });

  // Bot ready event
  client.once('clientReady', () => {
    console.log(`✅ Makoto-kun is online as ${client.user.tag}!`);
  });

  // Message handler
  client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    console.log(`📩 Received message from ${message.author.tag}: ${message.content}`);

    // Only respond to messages that mention the bot or are DMs
    const isMentioned = message.mentions.has(client.user);
    const isDM = message.channel.type === ChannelType.DM;

    if (!isMentioned && !isDM) {
      console.log('❌ Message ignored - not a mention or DM');
      return;
    }

    console.log('✅ Processing message...');

    // Show typing indicator
    await message.channel.sendTyping();

    try {
      // Extract the message content (remove bot mention if present)
      let userMessage = message.content;
      if (isMentioned) {
        userMessage = userMessage.replace(`<@${client.user.id}>`, '').trim();
      }

      console.log(`📤 Sending to n8n: ${userMessage}`);

      // Send message to n8n webhook
      const response = await axios.post(N8N_WEBHOOK_URL, {
        chatInput: userMessage,
        sessionId: message.author.id,
      });

      console.log(`📥 Received from n8n: ${response.data}`);

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

      console.log('✅ Response sent successfully');
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      await message.reply('Sorry, I encountered an error. Please try again!');
    }
  });

  // Login to Discord
  client.login(DISCORD_TOKEN);
