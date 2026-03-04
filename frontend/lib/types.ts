export interface NodeStatus {
  node_id: string;
  role: "leader" | "follower" | "candidate";
  current_term: number;
  leader_id: string | null;
  commit_index: number;
  last_applied: number;
  log_length: number;
  alive: boolean;
}

export interface StoreReadResponse {
  key: string;
  value: string | null;
}

export interface StoreWriteResponse {
  key: string;
  value: string;
  committed: boolean;
}

export interface StoreDataResponse {
  data: Record<string, string>;
}

export interface ActivityEvent {
  id: string;
  timestamp: number;
  message: string;
  type: "election" | "role_change" | "death" | "restart" | "write" | "info";
}
