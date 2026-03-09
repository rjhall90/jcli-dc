import { Command } from "commander";
import { JiraClient } from "../utils/client.js";
import { formatVersionList, formatVersionDetail, formatJson } from "../utils/format.js";

export function registerReleaseCommands(program: Command): void {
  const release = program
    .command("release")
    .alias("r")
    .description("List and inspect project versions (releases)")
    .addHelpText(
      "after",
      `
Examples:
  $ jcli release list SL                              # all versions for project SL
  $ jcli release list SL --order releaseDate           # ordered by release date
  $ jcli release get 86839                             # full version detail
  $ jcli release issues 86839                          # related & unresolved issue counts
`
    );

  release
    .command("list <projectKey>")
    .alias("l")
    .description("List versions for a project, e.g. jcli release list SL")
    .option("--order <orderBy>", "Order by: sequence, name, startDate, releaseDate")
    .option("--max <n>", "Max results per page (default: 50)", "50")
    .option("--start <n>", "Pagination offset (default: 0)", "0")
    .action(async (projectKey: string, opts: { order?: string; max: string; start: string }) => {
      try {
        const client = new JiraClient();
        const result = await client.getProjectVersions(projectKey, {
          orderBy: opts.order,
          maxResults: parseInt(opts.max, 10),
          startAt: parseInt(opts.start, 10),
        });
        console.log(
          JSON.stringify(
            {
              total: result.total,
              startAt: result.startAt,
              maxResults: result.maxResults,
              isLast: result.isLast,
              versions: JSON.parse(formatVersionList(result.values)),
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

  release
    .command("get <versionId>")
    .alias("g")
    .description("Get full detail for a version/release by ID")
    .action(async (versionId: string) => {
      try {
        const client = new JiraClient();
        const version = await client.getVersion(versionId);
        console.log(formatVersionDetail(version));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  release
    .command("issues <versionId>")
    .alias("is")
    .description("Show related and unresolved issue counts for a version/release")
    .action(async (versionId: string) => {
      try {
        const client = new JiraClient();
        const [related, unresolved] = await Promise.all([
          client.getVersionRelatedIssueCounts(versionId),
          client.getVersionUnresolvedIssueCount(versionId),
        ]);
        console.log(
          formatJson({
            versionId,
            issuesFixedCount: related.issuesFixedCount,
            issuesAffectedCount: related.issuesAffectedCount,
            issueCountWithCustomFieldsShowingVersion: related.issueCountWithCustomFieldsShowingVersion,
            issuesUnresolvedCount: unresolved.issuesUnresolvedCount,
          })
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
