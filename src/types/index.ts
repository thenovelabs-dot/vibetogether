export type ApplicationStatus = "pending" | "accepted";

export interface Reply {
  id: string;
  parent_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

export interface Comment {
  id: string;
  parent_id: null;
  nickname: string;
  content: string;
  created_at: string;
  replies: Reply[];
}

export interface ProductComment {
  id: string;
  showcase_id: string;
  nickname: string;
  content: string;
  created_at: string;
  replies: Reply[];
}

export interface Application {
  id: string;
  meetup_id: string;
  nickname: string;
  email: string;
  status: ApplicationStatus;
  created_at: string;
}
