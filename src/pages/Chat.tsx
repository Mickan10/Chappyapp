import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import chappyLogo from "../assets/chappy.png";
import type { User, Message, Channel } from "../types";
import Channels from "./Channels";
import reklamImage from "../assets/reklam.png";
import avatar1 from "../assets/avatar1.png";
import avatar2 from "../assets/avatar2.png";
import avatar3 from "../assets/avatar3.png";
import avatar4 from "../assets/avatar4.png";

export default function Chat() {
  const navigate = useNavigate();

  const [user, setUser] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");

  const avatars = [avatar1, avatar2, avatar3, avatar4];

  function getAvatarForUser(userId: string) {
    const index =
      Math.abs(
        userId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
      ) % avatars.length;
    return avatars[index];
  }

  // Logga ut
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/");
  }

  // Hämta inloggad användare
  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    const id = localStorage.getItem("userId");

    if (!token) {
      navigate("/");
      return;
    }
    setUser(name || "");
    setUserId(id || "");
  }, [navigate]);

  // Hämta alla användare
  useEffect(() => {
    const token = localStorage.getItem("token");
    async function loadUsers() {
      const res = await fetch("/api/users/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data);
    }
    loadUsers();
  }, []);

  // Hämta privata meddelanden
  useEffect(() => {
    if (!selectedUser) return;
    const token = localStorage.getItem("token");
    (async () => {
      const res = await fetch("/api/chats/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Message[] = await res.json();
      const filtered = data.filter(
        (m) =>
          (m.senderId === userId && m.receiverId === selectedUser.PK) ||
          (m.senderId === selectedUser.PK && m.receiverId === userId)
      );
      setMessages(filtered);
    })();
  }, [selectedUser, userId]);

  // Hämta kanalmeddelanden
  useEffect(() => {
    if (!selectedChannel) return;
    const token = localStorage.getItem("token");
    (async () => {
      const res = await fetch(`/api/channels/${selectedChannel.PK}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Message[] = await res.json();
      setMessages(data);
    })();
  }, [selectedChannel]);

  // Skicka meddelande
  async function sendMessage() {
    if (!text.trim()) return;
    const token = localStorage.getItem("token");

    if (selectedUser) {
      await fetch("/api/chats/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedUser.PK,
          text,
        }),
      });

      const res = await fetch("/api/chats/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Message[] = await res.json();
      const filtered = data.filter(
        (m) =>
          (m.senderId === userId && m.receiverId === selectedUser.PK) ||
          (m.senderId === selectedUser.PK && m.receiverId === userId)
      );
      setMessages(filtered);
    }

    if (selectedChannel) {
      await fetch("/api/channels/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelId: selectedChannel.PK,
          text,
        }),
      });

      const res = await fetch(`/api/channels/${selectedChannel.PK}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Message[] = await res.json();
      setMessages(data);
    }

    setText("");
  }

  return (
    <div className="chat-page">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <img src={chappyLogo} alt="logo" className="topbar-logo" />
        </div>
        <div className="topbar-right">
          <button className="btn-user">{user}</button>
          <button className="btn-logout" onClick={handleLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <div className="chat-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <Channels
            selectedChannel={selectedChannel}
            onSelectChannel={(channel) => {
              setSelectedChannel(channel);
              setSelectedUser(null);
              setMessages([]);
              return channel;
            }}
          />

          <div className="sidebar-section">
            <h3>Användare</h3>
            <ul>
              {users.length === 0 && <li>Inga användare ännu</li>}
              {users.map((u) => (
                <li
                  key={u.PK}
                  className={selectedUser?.PK === u.PK ? "active" : ""}
                  onClick={() => {
                    setSelectedUser(u);
                    setSelectedChannel(null);
                    setMessages([]);
                  }}
                >
                  {u.name}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Chatten */}
        <main className="chat-window">
          <div className="chat-header">
            {selectedChannel && (
              <h3># {selectedChannel.name}</h3>
            )}

            {selectedUser && (
              <div className="chat-header-user">
                <img
                  src={getAvatarForUser(selectedUser.PK)}
                  alt="Avatar"
                  className="header-avatar"
                />
                <h3>{selectedUser.name}</h3>
              </div>
            )}

            {!selectedUser && !selectedChannel && (
              <h3>Välj kanal eller användare</h3>
            )}
          </div>

          <div className="chat-messages">
            {!selectedUser && !selectedChannel && (
              <p>Hoppa in i en kanal eller välj någon att snacka med.</p>
            )}
            {selectedChannel && messages.length === 0 && (
              <p>Inga meddelanden i #{selectedChannel.name} ännu.</p>
            )}
            {selectedUser && messages.length === 0 && (
              <p>Du har inga meddelanden med {selectedUser.name} än.</p>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`message-group ${
                  m.senderId === userId ? "sent" : "received"
                }`}
              >
                <div className="sender-info">
                  <em className="sender-name">
                    {m.senderId === userId
                      ? user
                      : m.senderName
                      ? m.senderName
                      : users.find((u) => u.PK === m.senderId)?.name ||
                        m.senderId}
                  </em>
                  <span className="message-time">
                    {" "}-{" "}
                    {new Date(m.timestamp).toLocaleTimeString("sv-SE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="message-bubble">{m.text}</div>
              </div>
            ))}
          </div>

          {(selectedUser || selectedChannel) && (
            <div className="chat-input">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Aa..."/>
              <button onClick={sendMessage}>Skicka</button>
            </div>
          )}
        </main>

        {/* Reklam */}
        <div className="side-panel">
          <p>Annons:</p>
          <img
            src={reklamImage}
            alt="Reklam: Chappy Premium"
            className="ad-image"
          />
        </div>
      </div>
    </div>
  );
}
