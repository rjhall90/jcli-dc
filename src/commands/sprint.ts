import { Command } from "commander";
import { JiraClient } from "../utils/client.js";
import { formatJson, formatIssueList } from "../utils/format.js";

export function registerSprintCommands(program: Command): void {
  const sprint = program
    .command("sprint")
    .alias("sp")
    .description("Browse boards, sprints, and sprint issues")
    .addHelpText(
      "after",
      `
Examples:
  $ jcli sprint boards                       # list all boards
  $ jcli sprint boards --name "My Board"     # search by name
  $ jcli sprint list 1234                    # sprints for board 1234
  $ jcli sprint list 1234 --state active     # only active sprints
  $ jcli sprint issues 5678                  # issues in sprint 5678
`
    );

  sprint
    .command("boards")
    .alias("b")
    .description("List all Jira boards (Scrum and Kanban)")
    .option("--name <name>", "Search boards by name (partial match)")
    .option("--max <n>", "Max results per page (default: 25)", "25")
    .action(async (opts: { name?: string; max: string }) => {
      try {
        const client = new JiraClient();
        const results = await client.getBoards({
          name: opts.name,
          maxResults: parseInt(opts.max, 10),
        });
        console.log(
          formatJson(
            results.values.map((b) => ({
              id: b.id,
              name: b.name,
              type: b.type,
            }))
          )
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  sprint
    .command("list <boardId>")
    .alias("l")
    .description("List sprints for a board by board ID")
    .option("--state <state>", "Filter: active, future, or closed")
    .option("--max <n>", "Max results per page (default: 25)", "25")
    .action(async (boardId: string, opts: { state?: string; max: string }) => {
      try {
        const client = new JiraClient();
        const results = await client.getBoardSprints(parseInt(boardId, 10), {
          state: opts.state,
          maxResults: parseInt(opts.max, 10),
        });
        console.log(
          formatJson(
            results.values.map((s) => ({
              id: s.id,
              name: s.name,
              state: s.state,
              startDate: s.startDate ?? null,
              endDate: s.endDate ?? null,
              goal: s.goal ?? null,
            }))
          )
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  sprint
    .command("issues <sprintId>")
    .alias("is")
    .description("List all issues in a sprint by sprint ID")
    .option("--fields <fields>", "Comma-separated fields to return")
    .option("--max <n>", "Max results per page (default: 50)", "50")
    .action(async (sprintId: string, opts: { fields?: string; max: string }) => {
      try {
        const client = new JiraClient();
        const results = await client.getSprintIssues(parseInt(sprintId, 10), {
          fields: opts.fields,
          maxResults: parseInt(opts.max, 10),
        });
        console.log(
          JSON.stringify(
            {
              total: results.total,
              issues: JSON.parse(formatIssueList(results.issues)),
            },
            null,
            2
          )
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
