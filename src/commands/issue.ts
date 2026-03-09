import { Command } from "commander";
import { JiraClient } from "../utils/client.js";
import { formatIssueList, formatIssueDetail, formatJson } from "../utils/format.js";

const DEFAULT_DETAIL_FIELDS = [
  "summary", "status", "assignee", "reporter", "priority", "issuetype",
  "created", "updated", "description", "comment", "fixVersions",
  "resolution", "labels",
].join(",");

export function registerIssueCommands(program: Command): void {
  const issue = program
    .command("issue")
    .alias("i")
    .description("Find, view, search, comment on, and transition Jira issues")
    .addHelpText(
      "after",
      `
Examples:
  $ jcli issue mine                                       # your assigned issues
  $ jcli issue mine --status "In Progress" --project PROJ  # filtered
  $ jcli issue get PROJ-123                                # full detail with comments
  $ jcli issue get PROJ-123 --no-comments                  # without comments
  $ jcli issue search "project = PROJ AND type = Bug"      # raw JQL
  $ jcli issue comment PROJ-123 "On it"                    # add a comment
  $ jcli issue transitions PROJ-123                        # list available moves
  $ jcli issue transition PROJ-123 "In Progress"           # transition by name
  $ jcli issue transition PROJ-123 31                      # transition by ID
`
    );

  issue
    .command("get <issueKey>")
    .alias("g")
    .description("Get full detail for an issue by key, e.g. jcli issue get PROJ-123")
    .option("--fields <fields>", "Comma-separated list of fields to return")
    .option("--expand <expand>", "Expand additional data (renderedFields, changelog, etc.)")
    .option("--no-comments", "Exclude comments from output")
    .action(async (issueKey: string, opts: { fields?: string; expand?: string; comments: boolean }) => {
      try {
        const client = new JiraClient();
        let fields = opts.fields ?? DEFAULT_DETAIL_FIELDS;
        if (!opts.comments) {
          fields = fields.split(",").filter((f) => f !== "comment").join(",");
        }
        const issue = await client.getIssue(issueKey, fields, opts.expand);
        console.log(formatIssueDetail(issue));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  issue
    .command("search <jql>")
    .alias("s")
    .description("Search issues with a JQL query")
    .option("--fields <fields>", "Comma-separated fields to return")
    .option("--max <n>", "Max results per page (default: 50)", "50")
    .option("--start <n>", "Pagination offset (default: 0)", "0")
    .action(async (jql: string, opts: { fields?: string; max: string; start: string }) => {
      try {
        const client = new JiraClient();
        const results = await client.searchIssues(jql, {
          fields: opts.fields,
          maxResults: parseInt(opts.max, 10),
          startAt: parseInt(opts.start, 10),
        });
        console.log(
          JSON.stringify(
            {
              total: results.total,
              startAt: results.startAt,
              maxResults: results.maxResults,
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

  issue
    .command("mine")
    .alias("m")
    .description("List issues assigned to you, sorted by last updated")
    .option("--status <status>", "Filter by status, e.g. 'In Progress', 'To Do'")
    .option("--max <n>", "Max results per page (default: 50)", "50")
    .option("--project <key>", "Filter by project key, e.g. SL")
    .action(async (opts: { status?: string; max: string; project?: string }) => {
      try {
        const client = new JiraClient();
        const conditions: string[] = ["assignee = currentUser()"];

        if (opts.status) {
          conditions.push(`status = "${opts.status}"`);
        }
        if (opts.project) {
          conditions.push(`project = "${opts.project}"`);
        }

        const jql = conditions.join(" AND ") + " ORDER BY updated DESC";

        const results = await client.searchIssues(jql, {
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

  issue
    .command("comment <issueKey> <body>")
    .alias("c")
    .description("Add a comment to an issue, e.g. jcli issue comment PROJ-123 \"Fixed it\"")
    .action(async (issueKey: string, body: string) => {
      try {
        const client = new JiraClient();
        await client.addComment(issueKey, body);
        console.log(formatJson({ status: "ok", message: `Comment added to ${issueKey}` }));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  issue
    .command("transitions <issueKey>")
    .alias("tr")
    .description("List available workflow transitions for an issue")
    .action(async (issueKey: string) => {
      try {
        const client = new JiraClient();
        const result = await client.getTransitions(issueKey);
        console.log(
          formatJson(
            result.transitions.map((t) => ({
              id: t.id,
              name: t.name,
              to: t.to.name,
            }))
          )
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  issue
    .command("transition <issueKey> <nameOrId>")
    .description("Move an issue to a new status by transition name or ID")
    .action(async (issueKey: string, nameOrId: string) => {
      try {
        const client = new JiraClient();
        let transitionId = nameOrId;

        if (!/^\d+$/.test(nameOrId)) {
          const result = await client.getTransitions(issueKey);
          const match = result.transitions.find(
            (t) => t.name.toLowerCase() === nameOrId.toLowerCase()
          );
          if (!match) {
            const available = result.transitions.map((t) => `${t.id}: ${t.name}`).join(", ");
            throw new Error(
              `No transition named "${nameOrId}" for ${issueKey}. Available: ${available}`
            );
          }
          transitionId = match.id;
        }

        await client.transitionIssue(issueKey, transitionId);
        console.log(formatJson({ status: "ok", message: `Transitioned ${issueKey}` }));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  issue
    .command("assign <issueKey> <username>")
    .alias("a")
    .description("Assign an issue to a user by Jira username")
    .action(async (issueKey: string, username: string) => {
      try {
        const client = new JiraClient();
        await client.assignIssue(issueKey, username);
        console.log(formatJson({ status: "ok", message: `Assigned ${issueKey} to ${username}` }));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
