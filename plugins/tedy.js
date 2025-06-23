let teddyM = {}; // Track users who received teddy message

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let handler = async (m, { conn, command }) => {
  try {
    if (!m.chat) {
      console.error('Invalid chat ID (m.chat is undefined)');
      return conn.sendMessage(m.chat, { text: '❌ Something went wrong. Please try again later.' }, { quoted: m });
    }

    // Check command and prevent repeated sending to same user simultaneously
    if (command === 'teddy' && !teddyM[m.sender]) {
      teddyM[m.sender] = true;

      const teddyEmojis = ['❤', '💕', '😻', '🧡', '💛', '💚', '💙', '💜', '🖤', '❣', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥', '💌', '🙂', '🤗', '😌', '😉', '🤗', '😊', '🎊', '🎉', '🎁', '🎈'];

      // Send initial message
      let pingMsg = await conn.sendMessage(m.chat, { text: `(\\_/)\n( •.•)\n/>🤍` }, { quoted: m });

      // Animate emoji changes
      for (const emoji of teddyEmojis) {
        await sleep(500);

        await conn.relayMessage(
          m.chat,
          {
            protocolMessage: {
              key: pingMsg.key,
              type: 14, // Protocol edit message type
              editedMessage: {
                conversation: `(\\_/)\n( •.•)\n/>${emoji}`,
              },
            },
          },
          {}
        );
      }

      // Reset user's teddy state
      delete teddyM[m.sender];
    }
  } catch (error) {
    console.error('Error in teddy module:', error);
    await conn.sendMessage(m.chat, { text: '❌ Something went wrong while sending the teddy emojis. Please try again later.' }, { quoted: m });
  }
};

// Command metadata
handler.help = ['teddy'];
handler.tags = ['fun'];
handler.command = ["teddy"];

export default handler;
