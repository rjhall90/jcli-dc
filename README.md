# jcli-dc

Lightweight CLI for **Jira Data Center** — search issues, manage sprints, and interact with your on-prem Jira instance from the terminal. All output is JSON, making it ideal for scripting and LLM-assisted workflows.

> **Note:** This tool targets Jira Data Center (Server) REST API v2 and Agile API v1. It is _not_ intended for Jira Cloud.

## Install

```bash
npm install -g jcli-dc
```

Requires Node.js >= 18.

## Quick Start

```bash
# Configure your Jira connection
jcli config set --url https://jira.example.com --token YOUR_PERSONAL_ACCESS_TOKEN

# Verify connectivity
jcli config test

# Get your assigned issues
jcli issue mine
```

## Authentication

`jcli` uses **Personal Access Tokens (PAT)** — the recommended auth method for Jira Data Center 8.14+.

To create a PAT: Jira → Profile → Personal Access Tokens → Create token.

Your config is stored at `~/.jcli/config.json`.

## Commands

### Config

| Command                                                       | Description                           |
| ------------------------------------------------------------- | ------------------------------------- |
| `jcli config set --url <url> --token <pat> [--email <email>]` | Save connection details               |
| `jcli config show`                                            | Display current config (token masked) |
| `jcli config test`                                            | Test connectivity                     |

### Issues

| Command                                                   | Description                |
| --------------------------------------------------------- | -------------------------- |
| `jcli issue mine`                                         | Issues assigned to you     |
| `jcli issue mine --status "In Progress"`                  | Filter by status           |
| `jcli issue mine --project PROJ`                          | Filter by project key      |
| `jcli issue mine --max 20`                                | Limit results              |
| `jcli issue get PROJ-123`                                 | Get full issue detail      |
| `jcli issue get PROJ-123 --comments`                      | Include comments           |
| `jcli issue search "project = PROJ AND status = 'To Do'"` | Raw JQL query              |
| `jcli issue comment PROJ-123 "Fixed the thing"`           | Add a comment              |
| `jcli issue transitions PROJ-123`                         | List available transitions |
| `jcli issue transition PROJ-123 31`                       | Transition an issue        |
| `jcli issue assign PROJ-123 jane.doe`                     | Assign to a user           |

### Sprints & Boards

| Command                                     | Description              |
| ------------------------------------------- | ------------------------ |
| `jcli sprint boards`                        | List all boards          |
| `jcli sprint boards --name "My Board"`      | Search boards by name    |
| `jcli sprint list <boardId>`                | List sprints for a board |
| `jcli sprint list <boardId> --state active` | Filter by state          |
| `jcli sprint issues <sprintId>`             | List issues in a sprint  |

## Output

All output is JSON. Pipe to `jq` for filtering:

```bash
# Get just issue keys
jcli issue mine | jq '.issues[].key'

# Count by status
jcli issue mine --max 100 | jq '.issues | group_by(.status) | map({status: .[0].status, count: length})'
```

## License

MIT
