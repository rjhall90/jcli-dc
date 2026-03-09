#!/usr/bin/env node

import { Command } from "commander";
import { registerConfigCommands } from "./commands/config.js";
import { registerIssueCommands } from "./commands/issue.js";
import { registerSprintCommands } from "./commands/sprint.js";
import { registerReleaseCommands } from "./commands/release.js";
import { registerStatusCommands } from "./commands/status.js";

const program = new Command();

program
  .name("jcli")
  .description("Jira Data Center CLI — lightweight issue management via PAT auth.\nAll output is JSON for easy scripting and LLM consumption.")
  .version("1.0.0")
  .addHelpText(
    "after",
    `
Getting started:
  $ jcli config set --url https://jira.example.com --token YOUR_PAT
  $ jcli config test
  $ jcli issue mine

Examples:
  $ jcli issue get PROJ-123                          # full detail with comments
  $ jcli issue search "status = 'In Progress' AND project = PROJ"
  $ jcli issue transition PROJ-123 "In Progress"    # transition by name
  $ jcli sprint boards --name "My Board"
  $ jcli release list PROJ                           # project versions/releases
  $ jcli status list                                 # all workflow statuses

All output is JSON. Pipe to jq for filtering:
  $ jcli issue mine | jq '.issues[].key'
`
  );

registerConfigCommands(program);
registerIssueCommands(program);
registerSprintCommands(program);
registerReleaseCommands(program);
registerStatusCommands(program);

program.parseAsync(process.argv).catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
