# slack-claude-bridge

Talk to **your own** local Claude Code from any Slack channel — no official Slack integration, no public server, no tunnel.

You `@mention` your bot in Slack → the message runs through `claude -p` on your laptop → the reply comes back in the thread.

## How it works

- A tiny Node script connects to Slack over **Socket Mode** (an outbound WebSocket), so your machine stays behind its firewall — no ngrok, no exposed port.
- When mentioned, the bridge reads the **whole thread** (via `conversations.replies`) and passes it to Claude as context — so Claude sees the full conversation, not just the line that mentioned it.

## One rule for teams: one Slack app per developer

Do **not** share a single Slack app across the team. In Socket Mode, Slack delivers each mention to only **one** connected bridge (load-balancing), so a shared app would send your message to a random teammate's machine.

Give everyone their own app instead. Then `@claude-alice` exists only on Alice's connection, so only Alice's machine can ever answer it. Isolation is automatic.

## Setup (~3 minutes)

### 1. Create your Slack app

1. Go to <https://api.slack.com/apps> → **Create New App → From a manifest**.
2. Pick your workspace, paste [`manifest.yml`](manifest.yml), and change `YOURNAME` to your name.
3. **Basic Information → App-Level Tokens → Generate**, scope `connections:write`. Copy the `xapp-…` token → this is your `SLACK_APP_TOKEN`.
4. **Install App → Install to Workspace**. Copy the *Bot User OAuth Token* `xoxb-…` → this is your `SLACK_BOT_TOKEN`.
5. Your Slack profile → **⋯ More → Copy member ID** → this is your `MY_SLACK_USER_ID`.

> Some workspaces require an admin to approve app installs. If so, get the app type approved once (bot, Socket Mode, scopes `app_mentions:read`, `chat:write`, `channels:history`, `groups:history`), then everyone reuses the manifest.

### Scopes

| Scope | Why |
|---|---|
| `app_mentions:read` | receive the `@mention` that triggers the bot |
| `chat:write` | post the reply |
| `channels:history` | read the thread in **public** channels |
| `groups:history` | read the thread in **private** channels |

Add `im:history` / `mpim:history` to the manifest only if you want to DM the bot.

### 2. Configure and run

Requires [Claude Code](https://claude.com/claude-code) installed and Node.js 20+.

```bash
git clone git@github.com:trco/slack-claude-bridge.git
cd slack-claude-bridge
npm install

cp .env.example .env    # then fill in your tokens + project path
npm start
```

### 3. Use it

Invite your bot to a channel and mention it:

```
@claude-yourname what's failing in the latest test run?
```

Reply in the thread to keep the conversation going.

## Configuration (`.env`)

| Variable | What it is |
|---|---|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (`xoxb-…`) |
| `SLACK_APP_TOKEN` | App-Level Token for Socket Mode (`xapp-…`) |
| `MY_SLACK_USER_ID` | Your Slack member ID — the bridge only answers you |
| `CLAUDE_CWD` | Working directory Claude runs in (your project root) |

## Security

This is remote code execution into your machine, gated by your Slack account. Two guards keep it yours:

- **Routing by identity** — your bot lives only on your Socket Mode connection, so mentions can physically only reach your machine.
- **Owner filter** — `MY_SLACK_USER_ID` means even if a teammate mentions your bot, it ignores everyone but you.

Keep Claude's tool permissions **on**. In `-p` mode Claude won't run approval-gated tools by default, so it mostly reads and answers. Only add `--dangerously-skip-permissions` (in `slack-claude.js`) if you accept handing your machine to your own Slack account.

`.env` is gitignored — never commit your tokens.
