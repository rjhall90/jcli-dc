import { loadConfig, type JcliConfig } from "./config.js";

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export class JiraClient {
  private config: JcliConfig;

  constructor(config?: JcliConfig) {
    this.config = config ?? loadConfig();
  }

  private buildUrl(
    endpoint: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    const url = new URL(`${base}/rest/${endpoint}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, query } = options;
    const url = this.buildUrl(endpoint, query);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const fetchOptions: RequestInit = { method, headers };
    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      throw new Error(
        `Jira API error ${response.status} ${response.statusText}: ${errorBody}`
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  // Core API v2
  async getIssue(
    issueIdOrKey: string,
    fields?: string,
    expand?: string
  ): Promise<JiraIssue> {
    return this.request<JiraIssue>(`api/2/issue/${issueIdOrKey}`, {
      query: { fields, expand },
    });
  }

  async searchIssues(
    jql: string,
    opts: {
      fields?: string;
      maxResults?: number;
      startAt?: number;
      expand?: string;
    } = {}
  ): Promise<SearchResults> {
    return this.request<SearchResults>("api/2/search", {
      method: "POST",
      body: {
        jql,
        fields: opts.fields?.split(",") ?? [
          "summary",
          "status",
          "assignee",
          "priority",
          "issuetype",
          "created",
          "updated",
          "fixVersions",
          "resolution",
          "labels",
          "comment",
        ],
        maxResults: opts.maxResults ?? 50,
        startAt: opts.startAt ?? 0,
        expand: opts.expand,
      },
    });
  }

  async getMyself(): Promise<JiraUser> {
    return this.request<JiraUser>("api/2/myself");
  }

  async addComment(issueIdOrKey: string, body: string): Promise<unknown> {
    return this.request(`api/2/issue/${issueIdOrKey}/comment`, {
      method: "POST",
      body: { body },
    });
  }

  async transitionIssue(
    issueIdOrKey: string,
    transitionId: string
  ): Promise<void> {
    return this.request(`api/2/issue/${issueIdOrKey}/transitions`, {
      method: "POST",
      body: { transition: { id: transitionId } },
    });
  }

  async getTransitions(
    issueIdOrKey: string
  ): Promise<{ transitions: JiraTransition[] }> {
    return this.request(`api/2/issue/${issueIdOrKey}/transitions`);
  }

  async assignIssue(
    issueIdOrKey: string,
    username: string
  ): Promise<void> {
    return this.request(`api/2/issue/${issueIdOrKey}/assignee`, {
      method: "PUT",
      body: { name: username },
    });
  }

  // Version / Release API
  async getProjectVersions(
    projectKey: string,
    opts: { orderBy?: string; maxResults?: number; startAt?: number } = {}
  ): Promise<ProjectVersionPage> {
    return this.request<ProjectVersionPage>(`api/2/project/${projectKey}/version`, {
      query: {
        orderBy: opts.orderBy,
        maxResults: opts.maxResults ?? 50,
        startAt: opts.startAt ?? 0,
      },
    });
  }

  async getVersion(versionId: string): Promise<JiraVersion> {
    return this.request<JiraVersion>(`api/2/version/${versionId}`);
  }

  async getVersionRelatedIssueCounts(versionId: string): Promise<VersionIssueCounts> {
    return this.request<VersionIssueCounts>(`api/2/version/${versionId}/relatedIssueCounts`);
  }

  async getVersionUnresolvedIssueCount(versionId: string): Promise<VersionUnresolvedCounts> {
    return this.request<VersionUnresolvedCounts>(`api/2/version/${versionId}/unresolvedIssueCount`);
  }

  // Status API
  async getAllStatuses(): Promise<JiraStatus[]> {
    return this.request<JiraStatus[]>("api/2/status");
  }

  async getStatus(idOrName: string): Promise<JiraStatus> {
    return this.request<JiraStatus>(`api/2/status/${encodeURIComponent(idOrName)}`);
  }

  async getStatusCategories(): Promise<JiraStatusCategory[]> {
    return this.request<JiraStatusCategory[]>("api/2/statuscategory");
  }

  // Agile API
  async getBoards(
    opts: { name?: string; maxResults?: number; startAt?: number } = {}
  ): Promise<PaginatedResponse<JiraBoard>> {
    return this.request("agile/1.0/board", {
      query: {
        name: opts.name,
        maxResults: opts.maxResults ?? 50,
        startAt: opts.startAt ?? 0,
      },
    });
  }

  async getBoardSprints(
    boardId: number,
    opts: { state?: string; maxResults?: number; startAt?: number } = {}
  ): Promise<PaginatedResponse<JiraSprint>> {
    return this.request(`agile/1.0/board/${boardId}/sprint`, {
      query: {
        state: opts.state,
        maxResults: opts.maxResults ?? 50,
        startAt: opts.startAt ?? 0,
      },
    });
  }

  async getSprintIssues(
    sprintId: number,
    opts: { fields?: string; maxResults?: number; startAt?: number } = {}
  ): Promise<SprintIssuesResponse> {
    return this.request(`agile/1.0/sprint/${sprintId}/issue`, {
      query: {
        fields: opts.fields,
        maxResults: opts.maxResults ?? 50,
        startAt: opts.startAt ?? 0,
      },
    });
  }
}

// --- Types ---

export interface JiraUser {
  self: string;
  key: string;
  name: string;
  emailAddress: string;
  displayName: string;
  active: boolean;
  timeZone: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: Record<string, unknown> & {
    summary?: string;
    status?: {
      name: string;
      id: string;
      statusCategory?: JiraStatusCategory;
    };
    assignee?: { displayName: string; name: string } | null;
    reporter?: { displayName: string; name: string } | null;
    priority?: { name: string; id: string };
    issuetype?: { name: string; id: string };
    created?: string;
    updated?: string;
    description?: string;
    resolution?: { name: string; id: string } | null;
    labels?: string[];
    fixVersions?: Array<{
      id: string;
      name: string;
      description?: string;
      released: boolean;
      archived: boolean;
      releaseDate?: string;
    }>;
    comment?: {
      maxResults?: number;
      total?: number;
      startAt?: number;
      comments: Array<{
        id: string;
        author: { displayName: string };
        body: string;
        created: string;
        updated: string;
      }>;
    };
  };
}

export interface SearchResults {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

export interface JiraTransition {
  id: string;
  name: string;
  to: { name: string; id: string };
}

export interface JiraVersion {
  id: string;
  name: string;
  description?: string;
  project?: string;
  projectId?: number;
  archived: boolean;
  released: boolean;
  overdue?: boolean;
  startDate?: string;
  releaseDate?: string;
  userStartDate?: string;
  userReleaseDate?: string;
  self: string;
}

export interface ProjectVersionPage {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: JiraVersion[];
}

export interface VersionIssueCounts {
  self: string;
  issuesFixedCount: number;
  issuesAffectedCount: number;
  issueCountWithCustomFieldsShowingVersion: number;
}

export interface VersionUnresolvedCounts {
  self: string;
  issuesUnresolvedCount: number;
}

export interface JiraStatus {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  statusCategory?: JiraStatusCategory;
  self: string;
}

export interface JiraStatusCategory {
  id: number;
  key: string;
  name: string;
  colorName: string;
  self?: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
  self: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId: number;
  goal?: string;
}

export interface PaginatedResponse<T> {
  maxResults: number;
  startAt: number;
  total?: number;
  isLast: boolean;
  values: T[];
}

export interface SprintIssuesResponse {
  maxResults: number;
  startAt: number;
  total: number;
  issues: JiraIssue[];
}
