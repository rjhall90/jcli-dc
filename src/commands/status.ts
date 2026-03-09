import { Command } from "commander";
import { JiraClient } from "../utils/client.js";
import { formatStatusList, formatStatusCategoryList, formatJson } from "../utils/format.js";

export function registerStatusCommands(program: Command): void {
  const status = program
    .command("status")
    .alias("st")
    .description("List and inspect workflow statuses and status categories")
    .addHelpText(
      "after",
      `
Examples:
  $ jcli status list                                   # all workflow statuses
  $ jcli status get "In Progress"                      # single status detail
  $ jcli status categories                             # all status categories
`
    );

  status
    .command("list")
    .alias("l")
    .description("List all workflow statuses with their categories")
    .action(async () => {
      try {
        const client = new JiraClient();
        const statuses = await client.getAllStatuses();
        console.log(formatStatusList(statuses));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  status
    .command("get <idOrName>")
    .alias("g")
    .description("Get a single workflow status by ID or name")
    .action(async (idOrName: string) => {
      try {
        const client = new JiraClient();
        const s = await client.getStatus(idOrName);
        console.log(
          formatJson({
            id: s.id,
            name: s.name,
            description: s.description,
            category: s.statusCategory?.name ?? "",
            categoryKey: s.statusCategory?.key ?? "",
            categoryColor: s.statusCategory?.colorName ?? "",
          })
        );
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });

  status
    .command("categories")
    .alias("cat")
    .description("List all status categories (To Do, In Progress, Done, etc.)")
    .action(async () => {
      try {
        const client = new JiraClient();
        const categories = await client.getStatusCategories();
        console.log(formatStatusCategoryList(categories));
      } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
      }
    });
}
