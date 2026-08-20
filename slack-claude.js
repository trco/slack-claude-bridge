#!/usr/bin/env node
// Global:  npm install && npm link, put tokens in ~/.slack-claude.env, then run `slack-claude` anywhere.
// Local:   node --env-file=.env slack-claude.js
const path = require('node:path');
const os = require('node:os');
// Load ~/.slack-claude.env unless the vars are already in the environment. Needs Node >= 20.12.
try { process.loadEnvFile(process.env.SLACK_CLAUDE_ENV || path.join(os.homedir(), '.slack-claude.env')); } catch {}

const { App } = require('@slack/bolt');
const { execFile } = require('node:child_process');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,     // xoxb-...
  appToken: process.env.SLACK_APP_TOKEN,  // xapp-...
  socketMode: true,
});

const ME = process.env.MY_SLACK_USER_ID;  // only answer the owner

app.event('app_mention', async ({ event, client, say }) => {
  if (ME && event.user !== ME) return;
  const thread = event.thread_ts || event.ts;

  // Read the whole thread so Claude sees full context, not just the mention.
  const { messages } = await client.conversations.replies({
    channel: event.channel, ts: thread, limit: 100,
  });
  // ponytail: bot_id present => our own reply; good enough since only this bot posts here.
  const transcript = messages
    .map((m) => `${m.bot_id ? 'Claude' : 'User'}: ${(m.text || '').replace(/<@[^>]+>/g, '').trim()}`)
    .join('\n');

  const prompt =
    `You are replying in a Slack thread. Conversation so far:\n\n${transcript}\n\n` +
    `Reply to the most recent "User" message.`;

  execFile('claude', ['-p', prompt, '--output-format', 'json'],
    { cwd: process.env.CLAUDE_CWD || process.cwd(), maxBuffer: 10 << 20 },
    async (err, stdout) => {
      if (err) return void say({ thread_ts: thread, text: `error: ${err.message}` });
      const res = JSON.parse(stdout);
      await say({ thread_ts: thread, text: res.result || '(no output)' });
    });
});

(async () => { await app.start(); console.log('bridge up'); })();
