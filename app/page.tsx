"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase-browser";
import {
  MessageCircle,
  Trophy,
  UserCircle,
  ShieldCheck,
  LogOut,
  Users,
  Send,
  Check,
  X,
  Plus,
  Pencil
} from "lucide-react";
import type { Profile, Tournament, Message } from "../lib/types";

const supabase = createClient();

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState("chat");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    loadProfile();
  }, [session]);

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    setProfile(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="auth">
        <div className="muted">Loading Golden Dawn eFC...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!profile) {
    return (
      <div className="auth">
        <div className="error">
          Profile could not be loaded.
        </div>
      </div>
    );
  }

  if (profile.status !== "approved") {
    return (
      <Pending
        profile={profile}
        onLogout={() => supabase.auth.signOut()}
      />
    );
  }

  const staff =
    profile.role === "admin" ||
    profile.role === "owner";

  const nav: any[] = [
    ["chat", "Chat", MessageCircle],
    ["tournaments", "Tournaments", Trophy],
    ["profile", "Profile", UserCircle]
  ];

  if (staff) {
    nav.push([
      "admin",
      "Admin Panel",
      ShieldCheck
    ]);
  }

  return (
    <div className="shell">

      <header className="topbar">

        <div className="brand">

          <div className="brandmark">
            <img
              src="/logo-placeholder.svg"
              alt="Golden Dawn"
            />
          </div>

          <div>
            GOLDEN DAWN{" "}
            <span className="muted">
              eFC
            </span>
          </div>

        </div>

        <button
          className="btn secondary"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut size={16} />
          Logout
        </button>

      </header>

      <div className="layout">

        <aside className="sidebar">

          <div className="nav">

            {nav.map(
              ([key, label, Icon]) => (
                <button
                  key={key}
                  className={
                    view === key
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setView(key)
                  }
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              )
            )}

          </div>

        </aside>

        <main className="main">

          {view === "chat" && (
            <Chat profile={profile} />
          )}

          {view === "tournaments" && (
            <Tournaments profile={profile} />
          )}

          {view === "profile" && (
            <ProfileView
              profile={profile}
              setProfile={setProfile}
            />
          )}

          {view === "admin" && staff && (
            <AdminPanel profile={profile} />
          )}

        </main>

      </div>

    </div>
  );
}


/* =========================
   AUTH
========================= */

function Auth() {

  const [mode, setMode] =
    useState<"login" | "signup">("login");

  const [form, setForm] =
    useState({
      email: "",
      password: "",
      name: "",
      username: "",
      phone: "",
      efootball_id: ""
    });

  const [msg, setMsg] =
    useState("");

  async function submit(e: any) {

    e.preventDefault();

    setMsg("");

    if (mode === "login") {

      const { error } =
        await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });

      if (error) {
        setMsg(error.message);
      }

    } else {

      const { error } =
        await supabase.auth.signUp({
          email: form.email,
          password: form.password,

          options: {
            data: {
              name: form.name,
              username: form.username,
              phone: form.phone,
              efootball_id:
                form.efootball_id
            }
          }
        });

      if (error) {

        setMsg(error.message);

      } else {

        setMsg(
          "Account created. Your application is pending admin approval."
        );

      }
    }
  }

  return (

    <div className="auth">

      <div className="authbox">

        <div className="brand">

          <div className="brandmark">

            <img
              src="/logo-placeholder.svg"
              alt=""
            />

          </div>

          <div>
            GOLDEN DAWN eFC
          </div>

        </div>

        <h1>
          {mode === "login"
            ? "Welcome back"
            : "Join the club"}
        </h1>

        <p className="muted">

          {mode === "login"
            ? "Enter your club account."
            : "Create your player account. Approval is required before entering the club."}

        </p>

        <form onSubmit={submit}>

          {mode === "signup" && (

            <>

              <div className="field">

                <label>
                  Full name
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value
                    })
                  }
                />

              </div>

              <div className="field">

                <label>
                  Username
                </label>

                <input
                  required
                  value={form.username}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      username:
                        e.target.value
                    })
                  }
                />

              </div>

              <div className="field">

                <label>
                  Phone number
                </label>

                <input
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone:
                        e.target.value
                    })
                  }
                />

              </div>

              <div className="field">

                <label>
                  eFootball User ID
                </label>

                <input
                  required
                  value={
                    form.efootball_id
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      efootball_id:
                        e.target.value
                    })
                  }
                />

              </div>

            </>

          )}

          <div className="field">

            <label>
              Email
            </label>

            <input
              required
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value
                })
              }
            />

          </div>

          <div className="field">

            <label>
              Password
            </label>

            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password:
                    e.target.value
                })
              }
            />

          </div>

          {msg && (
            <p
              className={
                msg.includes("created")
                  ? "success"
                  : "error"
              }
            >
              {msg}
            </p>
          )}

          <button
            className="btn"
            style={{ width: "100%" }}
          >
            {mode === "login"
              ? "Login"
              : "Create account"}
          </button>

        </form>

        <button
          className="btn secondary"
          style={{
            width: "100%",
            marginTop: 10
          }}
          onClick={() => {
            setMode(
              mode === "login"
                ? "signup"
                : "login"
            );

            setMsg("");
          }}
        >

          {mode === "login"
            ? "Create a new account"
            : "I already have an account"}

        </button>

      </div>

    </div>

  );
}


/* =========================
   PENDING
========================= */

function Pending({
  profile,
  onLogout
}: {
  profile: Profile;
  onLogout: () => void;
}) {

  return (

    <div className="auth">

      <div
        className="authbox"
        style={{
          textAlign: "center"
        }}
      >

        <ShieldCheck
          size={48}
          color="#5ce1ff"
        />

        <h1>
          Application pending
        </h1>

        <p className="muted">

          Hi{" "}
          {profile.name ||
            profile.username}
          . Your Golden Dawn eFC
          membership request is
          waiting for an admin to
          review.

        </p>

        <div className="notice">

          Status:{" "}
          {profile.status.toUpperCase()}

        </div>

        <button
          className="btn secondary"
          style={{
            marginTop: 18
          }}
          onClick={onLogout}
        >

          <LogOut size={16} />

          Logout

        </button>

      </div>

    </div>

  );
}


/* =========================
   CHAT
========================= */

function Chat({
  profile
}: {
  profile: Profile;
}) {

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [text, setText] =
    useState("");

  useEffect(() => {

    loadMessages();

    const channel =
      supabase
        .channel("club-chat")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages"
          },
          async (payload) => {

            const message =
              payload.new as Message;

            const { data } =
              await supabase
                .from("profiles")
                .select(
                  "name,username,avatar_url"
                )
                .eq(
                  "id",
                  message.sender_id
                )
                .single();

            setMessages(
              (previous) => [
                ...previous,
                {
                  ...message,
                  sender: data
                }
              ]
            );

          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);

  async function loadMessages() {

    const { data } =
      await supabase
        .from("messages")
        .select(
          "*,sender:profiles(name,username,avatar_url)"
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        )
        .limit(200);

    setMessages(
      (data || []) as any
    );
  }

  async function send(
    e: any
  ) {

    e.preventDefault();

    if (!text.trim()) {
      return;
    }

    const body =
      text.trim();

    setText("");

    await supabase
      .from("messages")
      .insert({
        sender_id:
          profile.id,
        body
      });

  }

  return (

    <>

      <div className="hero">

        <div className="eyebrow">
          Club chat
        </div>

        <h1>
          Golden Dawn Comms
        </h1>

        <p>
          Talk with approved
          Golden Dawn eFC players,
          share match updates and
          coordinate tournaments.
        </p>

      </div>

      <div className="card chat">

        <div className="messages">

          {messages.length ? (

            messages.map(
              (message) => (

                <div
                  key={message.id}
                  className={
                    "bubble " +
                    (
                      message.sender_id ===
                      profile.id
                        ? "mine"
                        : ""
                    )
                  }
                >

                  <small>

                    {message.sender
                      ?.name ||
                      "Player"}

                    {" · @"}

                    {message.sender
                      ?.username ||
                      ""}

                  </small>

                  {message.body}

                </div>

              )
            )

          ) : (

            <div className="empty">

              No messages yet.
              Start the conversation.

            </div>

          )}

        </div>

        <form
          className="composer"
          onSubmit={send}
        >

          <input
            placeholder="Write a message..."
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            maxLength={2000}
          />

          <button className="btn">

            <Send size={17} />

          </button>

        </form>

      </div>

    </>

  );
}


/* =========================
   TOURNAMENTS
========================= */

function Tournaments({
  profile
}: {
  profile: Profile;
}) {

  const [items, setItems] =
    useState<Tournament[]>([]);

  const [joined, setJoined] =
    useState<string[]>([]);

  useEffect(() => {

    loadTournaments();

  }, []);

  async function loadTournaments() {

    const { data } =
      await supabase
        .from("tournaments")
        .select("*")
        .order(
          "start_at",
          {
            ascending: true
          }
        );

    setItems(data || []);

    const { data: joinedData } =
      await supabase
        .from("tournament_players")
        .select("tournament_id")
        .eq(
          "player_id",
          profile.id
        );

    setJoined(
      (joinedData || []).map(
        (item) =>
          item.tournament_id
      )
    );
  }

  async function join(
    tournamentId: string
  ) {

    const { error } =
      await supabase
        .from("tournament_players")
        .insert({
          tournament_id:
            tournamentId,
          player_id:
            profile.id
        });

    if (!error) {

      setJoined(
        (current) => [
          ...current,
          tournamentId
        ]
      );

    }

  }

  return (

    <>

      <div className="hero">

        <div className="eyebrow">
          Competition hub
        </div>

        <h1>
          Tournaments
        </h1>

        <p>

          Club tournaments,
          brackets and match events
          will live here. Admins can
          create and manage events
          from the Admin Panel.

        </p>

      </div>

      <div className="grid">

        {items.map(
          (tournament) => (

            <div
              className="card"
              key={tournament.id}
            >

              <div className="row">

                <span className="pill">

                  {tournament.status}

                </span>

                <Trophy size={20} />

              </div>

              <h3>
                {tournament.title}
              </h3>

              <p className="muted">

                {tournament.description ||
                  "Golden Dawn eFC tournament."}

              </p>

              <p className="muted">

                {new Date(
                  tournament.start_at
                ).toLocaleString()}

              </p>

              {tournament.status ===
                "open" && (

                <button
                  className="btn"
                  disabled={joined.includes(
                    tournament.id
                  )}
                  onClick={() =>
                    join(
                      tournament.id
                    )
                  }
                >

                  {joined.includes(
                    tournament.id
                  )
                    ? "Joined"
                    : "Join tournament"}

                </button>

              )}

            </div>

          )
        )}

      </div>

      {!items.length && (

        <div className="empty">

          No tournaments have
          been published yet.

        </div>

      )}

    </>

  );
}


/* =========================
   PROFILE
========================= */

function ProfileView({
  profile,
  setProfile
}: {
  profile: Profile;
  setProfile: (
    profile: Profile
  ) => void;
}) {

  const [form, setForm] =
    useState({
      name: profile.name,
      username:
        profile.username,
      avatar_url:
        profile.avatar_url || "",
      phone: profile.phone,
      efootball_id:
        profile.efootball_id
    });

  const [msg, setMsg] =
    useState("");

  async function save(
    e: any
  ) {

    e.preventDefault();

    setMsg("");

    const { data, error } =
      await supabase
        .from("profiles")
        .update(form)
        .eq(
          "id",
          profile.id
        )
        .select()
        .single();

    if (error) {

      setMsg(
        error.message
      );

    } else {

      setProfile(data);

      setMsg(
        "Profile updated."
      );

    }

  }

  return (

    <>

      <div className="hero">

        <div className="eyebrow">
          Player profile
        </div>

        <h1>
          My Profile
        </h1>

        <p>
          Update your club identity
          and player information.
        </p>

      </div>

      <div className="card">

        <form onSubmit={save}>

          <div className="field">

            <label>
              Name
            </label>

            <input
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value
                })
              }
            />

          </div>

          <div className="field">

            <label>
              Username
            </label>

            <input
              value={
                form.username
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  username:
                    e.target.value
                })
              }
            />

          </div>

          <div className="field">

            <label>
              Profile picture URL
            </label>

            <input
              placeholder="https://..."
              value={
                form.avatar_url
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  avatar_url:
                    e.target.value
                })
              }
            />

          </div>

          <div className="field">

            <label>
              Phone
            </label>

            <input
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone:
                    e.target.value
                })
              }
            />

          </div>

          <div className="field">

            <label>
              eFootball User ID
            </label>

            <input
              value={
                form.efootball_id
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  efootball_id:
                    e.target.value
                })
              }
            />

          </div>

          {msg && (

            <p
              className={
                msg ===
                "Profile updated."
                  ? "success"
                  : "error"
              }
            >
              {msg}
            </p>

          )}

          <button className="btn">

            <Pencil size={16} />

            Save changes

          </button>

        </form>

      </div>

    </>

  );
}


/* =========================
   ADMIN PANEL
========================= */

function AdminPanel({
  profile
}: {
  profile: Profile;
}) {

  const [tab, setTab] =
    useState<
      "members" |
      "tournaments"
    >("members");

  const [members, setMembers] =
    useState<Profile[]>([]);

  const [
    tournaments,
    setTournaments
  ] = useState<Tournament[]>([]);

  const [form, setForm] =
    useState({
      title: "",
      description: "",
      start_at: "",
      max_players: "32"
    });

  const [msg, setMsg] =
    useState("");

  useEffect(() => {

    load();

  }, []);

  async function load() {

    const { data } =
      await supabase
        .from("profiles")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    setMembers(
      data || []
    );

    const { data: tournamentData } =
      await supabase
        .from("tournaments")
        .select("*")
        .order(
          "start_at",
          {
            ascending: true
          }
        );

    setTournaments(
      tournamentData || []
    );

  }

  async function status(
    id: string,
    newStatus:
      | "approved"
      | "rejected"
  ) {

    const { error } =
      await supabase
        .from("profiles")
        .update({
          status:
            newStatus
        })
        .eq(
          "id",
          id
        );

    if (error) {

      setMsg(
        error.message
      );

    } else {

      load();

    }

  }

  async function createTournament(
    e: any
  ) {

    e.preventDefault();

    setMsg("");

    const { error } =
      await supabase
        .from("tournaments")
        .insert({
          title:
            form.title,
          description:
            form.description,
          start_at:
            new Date(
              form.start_at
            ).toISOString(),
          max_players:
            Number(
              form.max_players
            ),
          status:
            "open",
          created_by:
            profile.id
        });

    if (error) {

      setMsg(
        error.message
      );

    } else {

      setMsg(
        "Tournament created."
      );

      setForm({
        title: "",
        description: "",
        start_at: "",
        max_players: "32"
      });

      load();

    }

  }

  return (

    <>

      <div className="hero">

        <div className="eyebrow">
          Staff only
        </div>

        <h1>
          Admin Panel
        </h1>

        <p>

          Approve members,
          manage the club roster
          and publish tournaments.

        </p>

      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16
        }}
      >

        <button
          className={
            "btn " +
            (
              tab === "members"
                ? ""
                : "secondary"
            )
          }
          onClick={() =>
            setTab("members")
          }
        >

          <Users size={16} />

          Members

        </button>

        <button
          className={
            "btn " +
            (
              tab ===
              "tournaments"
                ? ""
                : "secondary"
            )
          }
          onClick={() =>
            setTab(
              "tournaments"
            )
          }
        >

          <Trophy size={16} />

          Tournaments

        </button>

      </div>

      {tab === "members" && (

        <div className="card">

          <div className="table-wrap">

            <table className="table">

              <thead>

                <tr>

                  <th>
                    Player
                  </th>

                  <th>
                    eFootball ID
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {members.map(
                  (member) => (

                    <tr
                      key={
                        member.id
                      }
                    >

                      <td>

                        <b>
                          {member.name ||
                            "—"}
                        </b>

                        <br />

                        <span className="muted">
                          @
                          {
                            member.username
                          }
                        </span>

                      </td>

                      <td>
                        {
                          member.efootball_id
                        }
                      </td>

                      <td>

                        <span className="pill">
                          {
                            member.status
                          }
                        </span>

                      </td>

                      <td>
                        {member.role}
                      </td>

                      <td>

                        {member.id ===
                        profile.id ? (

                          "Owner"

                        ) : (

                          <>

                            {member.status !==
                              "approved" && (

                              <button
                                className="btn"
                                style={{
                                  marginRight: 6
                                }}
                                onClick={() =>
                                  status(
                                    member.id,
                                    "approved"
                                  )
                                }
                              >

                                <Check
                                  size={15}
                                />

                              </button>

                            )}

                            {member.status !==
                              "rejected" && (

                              <button
                                className="btn danger"
                                onClick={() =>
                                  status(
                                    member.id,
                                    "rejected"
                                  )
                                }
                              >

                                <X
                                  size={15}
                                />

                              </button>

                            )}

                          </>

                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {tab === "tournaments" && (

        <div className="grid">

          <div className="card">

            <h3>
              Create tournament
            </h3>

            <form
              onSubmit={
                createTournament
              }
            >

              <div className="field">

                <label>
                  Title
                </label>

                <input
                  required
                  value={
                    form.title
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title:
                        e.target.value
                    })
                  }
                />

              </div>

              <div className="field">

                <label>
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value
                    })
                  }
                />

              </div>

              <div className="field">

                <label>
                  Start
                </label>

                <input
                  required
                  type="datetime-local"
                  value={
                    form.start_at
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      start_at:
                        e.target.value
                    })
                  }
                />

              </div>

              <div className="field">

                <label>
                  Max players
                </label>

                <input
                  required
                  type="number"
                  min="2"
                  value={
                    form.max_players
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_players:
                        e.target.value
                    })
                  }
                />

              </div>

              {msg && (

                <p
                  className={
                    msg.includes(
                      "created"
                    )
                      ? "success"
                      : "error"
                  }
                >
                  {msg}
                </p>

              )}

              <button className="btn">

                <Plus size={16} />

                Publish tournament

              </button>

            </form>

          </div>

          <div className="card">

            <h3>
              Published events
            </h3>

            {tournaments.map(
              (tournament) => (

                <div
                  key={
                    tournament.id
                  }
                  style={{
                    padding:
                      "12px 0",
                    borderBottom:
                      "1px solid rgba(255,255,255,.07)"
                  }}
                >

                  <b>
                    {
                      tournament.title
                    }
                  </b>

                  <div className="muted">

                    {
                      tournament.status
                    }

                    {" · "}

                    {new Date(
                      tournament.start_at
                    ).toLocaleString()}

                  </div>

                </div>

              )
            )}

            {!tournaments.length && (

              <div className="empty">

                No tournaments.

              </div>

            )}

          </div>

        </div>

      )}

    </>

  );
}
