// npm i   — then run with: node --env-file=.env slack-claude.js
const { App } = require('@slack/bolt');
const { execFile } = require('node:child_process');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,     // xoxb-...
  appToken: process.env.SLACK_APP_TOKEN,  // xapp-...
  socketMode: true,
});

const ME = process.env.MY_SLACK_USER_ID;  // only answer the owner
const sessions = {};                       // thread_ts -> claude session id

app.event('app_mention', async ({ event, say }) => {
  if (ME && event.user !== ME) return;
  const thread = event.thread_ts || event.ts;
  const prompt = event.text.replace(/<@[^>]+>/g, '').trim();

  const args = ['-p', prompt, '--output-format', 'json'];
  if (sessions[thread]) args.push('--resume', sessions[thread]);

  execFile('claude', args,
    { cwd: process.env.CLAUDE_CWD || process.cwd(), maxBuffer: 10 << 20 },
    async (err, stdout) => {
      if (err) return void say({ thread_ts: thread, text: `error: ${err.message}` });
      const res = JSON.parse(stdout);
      sessions[thread] = res.session_id;
      await say({ thread_ts: thread, text: res.result || '(no output)' });
    });
});

(async () => { await app.start(); console.log('bridge up'); })();
