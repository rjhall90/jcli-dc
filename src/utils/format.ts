import type { JiraIssue } from "./client.js";

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function formatIssueList(issues: JiraIssue[]): string {
  return formatJson(
    issues.map((issue) => ({
      key: issue.key,
      type: issue.fields.issuetype?.name ?? "",
      summary: issue.fields.summary ?? "",
      status: issue.fields.status?.name ?? "",
      assignee: issue.fields.assignee?.displayName ?? "Unassigned",
      priority: issue.fields.priority?.name ?? "",
      updated: issue.fields.updated ?? "",
    }))
  );
}

export function formatIssueDetail(issue: JiraIssue): string {
  const { fields } = issue;
  const comment = fields.comment;

  const detail: Record<string, unknown> = {
    key: issue.key,
    type: fields.issuetype?.name ?? "",
    summary: fields.summary ?? "",
    status: fields.status?.name ?? "",
    assignee: fields.assignee?.displayName ?? "Unassigned",
    reporter: fields.reporter?.displayName ?? "Unknown",
    priority: fields.priority?.name ?? "",
    created: fields.created ?? "",
    updated: fields.updated ?? "",
    description: fields.description ?? "",
  };

  if (comment?.comments?.length) {
    detail.comments = comment.comments.map((c) => ({
      author: c.author.displayName,
      body: c.body,
      created: c.created,
    }));
  }

  return formatJson(detail);
}
