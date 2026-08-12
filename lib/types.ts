export type Profile = {
  id: string;
  email: string;
  name: string;
  username: string;
  phone: string;
  efootball_id: string;
  avatar_url: string | null;
  role: "player" | "admin" | "owner";
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type Tournament = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  status: "draft" | "open" | "ongoing" | "completed" | "cancelled";
  max_players: number;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender?: Pick<
    Profile,
    "name" | "username" | "avatar_url"
  >;
};
