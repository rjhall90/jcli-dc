import { Command } from "commander";
import { saveConfig, getConfigPath, loadConfig } from "../utils/config.js";
import { JiraClient } from "../utils/client.js";

export function registerConfigCommands(program: Command): void {
  const config = program
    .command("config")
    .description("Manage jcli configuration (stored in ~/.jcli/config.json)")
    .addHelpText(
      "after",
      `
Examples:
  $ jcli config set --url https://jira.example.com --token YOUR_PAT
  $ jcli config show
  $ jcli config test
`
    );

  config
    .command("set")
    .description("Save Jira Data Center connection details")
    .requiredOption("--url <url>", "Jira base URL, e.g. https://jira.example.com")
    .requiredOption("--token <pat>", "Personal Access Token (Jira → Profile → PATs)")
    .option("--email <email>", "Your email (stored for reference only)")
    .action(
      (opts: { url: string; token: string; email?: string }) => {
        const url = opts.url.replace(/\/+$/, "");
        saveConfig({ baseUrl: url, token: opts.token, email: opts.email ?? "" });
        console.log(`Configuration saved to ${getConfigPath()}`);
      }
    );

  config
    .command("show")
    .description("Display current configuration (token is masked)")
    .action(() => {
      try {
        const cfg = loadConfig();
        console.log(
          JSON.stringify(
            { baseUrl: cfg.baseUrl, email: cfg.email, token: "***" },
            null,
            2
          )
        );
      } catch {
        console.error("No configuration found.");
      }
    });

  config
    .command("test")
    .description("Verify authentication and connectivity to Jira")
    .action(async () => {
      try {
        const client = new JiraClient();
        const user = await client.getMyself();
        console.log(
          JSON.stringify(
            {
              status: "ok",
              user: user.displayName,
              email: user.emailAddress,
              key: user.key,
            },
            null,
            2
          )
        );
      } catch (err) {
        console.error("Connection failed:", (err as Error).message);
        process.exit(1);
      }
    });
}
