import { Command } from "commander";
import { JiraClient } from "../utils/client.js";
import { formatEpicList, formatEpicDetail, formatIssueList } from "../utils/format.js";

export function registerEpicCommands(program: Command): void {
  const epic = program
    .command("epic")
    .alias("ep")
    .description("Browse epics and their issues")
    .addHelpText(
      "after",
      `
Examples:
  $ jcli epic list 1234                     # epics for board 1234
  $ jcli epic list 1234 --done              # include completed epics
  $ jcli epic get PROJ-100                  # epic detail
  $ jcli epic issues PROJ-100              # issues belonging to an epic
`
    );

  epic
    .command("list <boardId>")
    .alias("l")
    .description("List epics for a board by board ID")
    .option("--done", "Include completed epics", false)
    .option("--max <n>", "Max results per page (default: 50)", "50")
    .option("--start <n>", "Start index for pagination", "0")
    .action(async (boardId: string, opts: { done: boolean; max: string; start: string }) => {
      try {
        const client = new JiraClient();
        const results = await client.getBoardEpics(parseInt(boardId, 10), {
          done: opts.done || undefined,
          maxResults: parseInt(opts.max, 10),
          startAt: parseInt(opts.start, 10),
        });
        console.log(formatEpicList(results.values));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  epic
    .command("get <epicKey>")
    .alias("g")
    .description("Get details for a single epic by key or ID")
    .action(async (epicKey: string) => {
      try {
        const client = new JiraClient();
        const result = await client.getEpic(epicKey);
        console.log(formatEpicDetail(result));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  epic
    .command("issues <epicKey>")
    .alias("i")
    .description("List issues belonging to an epic")
    .option("--jql <jql>", "Additional JQL filter")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .option("--max <n>", "Max results per page (default: 50)", "50")
    .option("--start <n>", "Start index for pagination", "0")
    .action(
      async (
        epicKey: string,
        opts: { jql?: string; fields?: string; max: string; start: string }
      ) => {
        try {
          const client = new JiraClient();
          const results = await client.getEpicIssues(epicKey, {
            jql: opts.jql,
            fields: opts.fields,
            maxResults: parseInt(opts.max, 10),
            startAt: parseInt(opts.start, 10),
          });
          console.log(formatIssueList(results.issues));
        } catch (err) {
          console.error("Error:", (err as Error).message);
          process.exit(1);
        }
      }
    );
}
