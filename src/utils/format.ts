import type { JiraIssue, JiraVersion, JiraStatus, JiraStatusCategory } from "./client.js";

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function formatIssueList(issues: JiraIssue[]): string {
  return formatJson(
    issues.map((issue) => {
      const entry: Record<string, unknown> = {
        key: issue.key,
        type: issue.fields.issuetype?.name ?? "",
        summary: issue.fields.summary ?? "",
        status: issue.fields.status?.name ?? "",
        statusCategory: issue.fields.status?.statusCategory?.name ?? "",
        assignee: issue.fields.assignee?.displayName ?? "Unassigned",
        priority: issue.fields.priority?.name ?? "",
        resolution: issue.fields.resolution?.name ?? null,
        updated: issue.fields.updated ?? "",
      };

      if (issue.fields.fixVersions?.length) {
        entry.fixVersions = issue.fields.fixVersions.map((v) => v.name);
      }

      if (issue.fields.labels?.length) {
        entry.labels = issue.fields.labels;
      }

      const comment = issue.fields.comment;
      entry.commentCount = comment?.total ?? comment?.comments?.length ?? 0;

      return entry;
    })
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
    statusCategory: fields.status?.statusCategory?.name ?? "",
    assignee: fields.assignee?.displayName ?? "Unassigned",
    reporter: fields.reporter?.displayName ?? "Unknown",
    priority: fields.priority?.name ?? "",
    resolution: fields.resolution?.name ?? null,
    created: fields.created ?? "",
    updated: fields.updated ?? "",
    description: fields.description ?? "",
  };

  if (fields.fixVersions?.length) {
    detail.fixVersions = fields.fixVersions.map((v) => ({
      name: v.name,
      releaseDate: v.releaseDate ?? null,
      released: v.released,
      description: v.description ?? null,
    }));
  }

  if (fields.labels?.length) {
    detail.labels = fields.labels;
  }

  if (comment?.comments?.length) {
    detail.commentCount = comment.total ?? comment.comments.length;
    detail.comments = comment.comments.map((c) => ({
      author: c.author.displayName,
      body: c.body,
      created: c.created,
    }));
  }

  return formatJson(detail);
}

export function formatVersionList(versions: JiraVersion[]): string {
  return formatJson(
    versions.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description ?? null,
      released: v.released,
      archived: v.archived,
      overdue: v.overdue ?? null,
      startDate: v.startDate ?? null,
      releaseDate: v.releaseDate ?? null,
    }))
  );
}

export function formatVersionDetail(v: JiraVersion): string {
  return formatJson({
    id: v.id,
    name: v.name,
    description: v.description ?? null,
    project: v.project ?? null,
    released: v.released,
    archived: v.archived,
    overdue: v.overdue ?? null,
    startDate: v.startDate ?? null,
    releaseDate: v.releaseDate ?? null,
    self: v.self,
  });
}

export function formatStatusList(statuses: JiraStatus[]): string {
  return formatJson(
    statuses.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      category: s.statusCategory?.name ?? "",
      categoryKey: s.statusCategory?.key ?? "",
      categoryColor: s.statusCategory?.colorName ?? "",
    }))
  );
}

export function formatStatusCategoryList(categories: JiraStatusCategory[]): string {
  return formatJson(
    categories.map((c) => ({
      id: c.id,
      key: c.key,
      name: c.name,
      colorName: c.colorName,
    }))
  );
}
