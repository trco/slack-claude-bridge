# slack-claude-bridge

Talk to **your own** local Claude Code from any Slack channel.

Mention your bot → it runs `claude` on your machine → the answer lands back in the thread. No public server, no tunnel, no third-party integration.

## How it works

- Connects to Slack over **Socket Mode** — an outbound WebSocket, so your laptop stays behind its firewall.
- On mention, it reads the **whole thread** and passes it to `claude -p` as context, then posts the reply.

## One app per developer

Give each person their own Slack app — never share one. In Socket Mode, Slack sends each mention to only *one* connected bridge, so a shared app would route your message to a random teammate's machine. Separate apps mean `@claude-yourname` can only ever reach **your** bridge.

## Setup (~3 min)

Needs [Claude Code](https://claude.com/claude-code) and Node.js ≥ 20.12.

**1. Create your Slack app**

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App → From a manifest** → paste [`manifest.yml`](manifest.yml) (change `YOURNAME`).
2. **Basic Information → App-Level Tokens** → generate one with `connections:write` → `xapp-…`
3. **Install App** → copy the *Bot User OAuth Token* → `xoxb-…`
4. Your Slack profile → **⋯ → Copy member ID** → `U…`

> Workspace requires admin approval for app installs? Get the app type approved once (bot, Socket Mode, scopes `app_mentions:read`, `chat:write`, `channels:history`, `groups:history`), then everyone reuses the manifest.

**2. Install & configure**

```bash
git clone git@github.com:trco/slack-claude-bridge.git
cd slack-claude-bridge
npm install
npm link                              # adds the `slack-claude` command

cp .env.example ~/.slack-claude.env   # fill in tokens + project path
chmod 600 ~/.slack-claude.env
```

**3. Run**

```bash
slack-claude          # from any directory
```

Invite the bot to a channel and mention it. Keep the terminal open while you use it.

> Using `nvm`? The `slack-claude` command is tied to the Node version you linked under — switch versions, re-run `npm link`.

## Config — `~/.slack-claude.env`

| Variable | What it is |
|---|---|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token (`xoxb-…`) |
| `SLACK_APP_TOKEN` | App-Level Token for Socket Mode (`xapp-…`) |
| `MY_SLACK_USER_ID` | Your member ID — the bot answers **only you** |
| `CLAUDE_CWD` | Folder Claude works in (a project root, or your home dir) |

The command reads this file automatically — don't `source` it into your shell, or a stale export there will override it.

## Security

Each bridge is remote code execution into your machine, gated by your Slack account. `MY_SLACK_USER_ID` restricts triggers to you, and in `-p` mode Claude won't run approval-gated tools by default — so it mostly reads and answers. `.env` is gitignored; never commit your tokens.
