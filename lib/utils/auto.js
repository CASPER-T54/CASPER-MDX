import chalk from 'chalk';

import "../settings/config.js"
import "../../set.js"

const getWIBTime = (format = global.appearance.timeFormat || "HH:mm:ss") => {
  return moment().format(format)
}

// Function to get current date in WIB
const getWIBDate = (format = global.appearance.dateFormat || "DD/MM/YYYY") => {
  return moment().format(format)
}

// Function to get full date and time in WIB
const getWIBDateTime = (format = global.appearance.fullDateFormat || "DD/MM/YYYY HH:mm:ss") => {
  return moment().format(format)
}
// === Auto Status View & React ===
export async function handleStatusViewReact(conn, mek) {
  if (mek.key?.remoteJid === "status@broadcast" &&
      global.autoreactstatus === 'true' &&
      global.autoviewstatus === 'true') {
    try {
      const emoji = global.statusemoji || '💜';
      const participant = mek.key.participant || mek.participant;
      const botJid = await conn.decodeJid(conn.user.id);
      const messageId = mek.key.id;

      if (participant && messageId) {
        await conn.sendMessage(
          "status@broadcast",
          {
            react: {
              key: {
                id: messageId,
                remoteJid: mek.key.remoteJid,
                participant,
              },
              text: emoji,
            },
          },
          { statusJidList: [participant, botJid] }
        );
        console.log(chalk.green(`[${getWIBTime()}] ✅ Auto-reacted to status from ${participant.split('@')[0]}`));
      }
    } catch (err) {
      console.log(chalk.red(`[${getWIBTime()}] ❌ Error auto-reacting to status:`), err);
    }
  }
}

// === Auto Read ===
export async function handleAutoRead(conn, m) {
  if (global.autoread === 'true') {
    try {
      await conn.readMessages([m.key]);
    } catch (err) {
      console.log(chalk.red(`[${getWIBTime()}] ❌ Error auto-reading:`), err);
    }
  }
}

// === Anti-call Block ===
export function handleAntiCall(conn) {
  conn.ev.on('call', async (calls) => {
    if (global.anticall !== 'true') return;

    for (let call of calls) {
      if (!call.isGroup && call.status === 'offer') {
        try {
          const reason = call.isVideo ? "video" : "audio";
          await conn.sendTextWithMentions(call.from, `📵 My owner cannot receive ${reason} calls.\n\n@${call.from.split('@')[0]}, CASPER-X is blocking you to avoid disturbance.\n\nIf this was a mistake, contact the owner to get unblocked.`);
          await new Promise(res => setTimeout(res, 8000));
          await conn.updateBlockStatus(call.from, 'block');
          console.log(chalk.red(`[${getWIBTime()}] 🚫 Blocked caller: ${call.from.split('@')[0]} for ${reason} call`));
        } catch (err) {
          console.log(chalk.red(`[${getWIBTime()}] ❌ Error blocking caller:`), err);
        }
      }
    }
  });
}

// === Group Welcome & Goodbye ===
export function handleGroupParticipants(conn) {
  conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (global.welcome !== 'true') return;

    try {
      const groupMetadata = await conn.groupMetadata(id);
      const groupName = groupMetadata.subject;
      const memberCount = groupMetadata.participants.length;

      for (const participant of participants) {
        const userPic = await getProfilePic(conn, participant);
        const message = action === 'add'
          ? getWelcomeMessage(participant, groupName, memberCount)
          : getGoodbyeMessage(participant, groupName, memberCount);

        await conn.sendMessage(id, {
          text: message,
          contextInfo: {
            mentionedJid: [participant],
            externalAdReply: {
              title: global.botname,
              body: global.ownername,
              thumbnail: await (await fetch(userPic)).buffer(),
              previewType: 'PHOTO',
              sourceUrl: global.plink
            }
          }
        });
      }
    } catch (err) {
      console.error(`[${getWIBTime()}] ❌ Group welcome/goodbye error:`, err);
    }
  });
}

// === Helpers ===
async function getProfilePic(conn, jid) {
  try {
    return await conn.profilePictureUrl(jid, 'image');
  } catch {
    return 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
  }
}

function getWelcomeMessage(participant, groupName, memberCount) {
  return `✨ *Welcome to ${groupName}!* ✨ @${participant.split('@')[0]}\nYou're our ${memberCount}th member!\n> ${global.wm}`;
}

function getGoodbyeMessage(participant, groupName, memberCount) {
  return `👋 *Goodbye @${participant.split('@')[0]}!* We'll miss you in ${groupName}.\nWe are now ${memberCount} members.\n> ${global.wm}`;
}
