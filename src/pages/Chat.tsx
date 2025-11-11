import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [role, setRole] = useState<string>("");
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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    navigate("/");
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("userName");
    const id = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");
    if (!token) {
      navigate("/");
      return;
    }
    setUser(name || "");
    setUserId(id || "");
    setRole(role || "user");
  }, [navigate]);

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
  }, [role]);

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

  async function sendMessage() {
    if (!text.trim()) return;
    const token = localStorage.getItem("token");

    if (selectedUser) {
      const res = await fetch("/api/chats/messages", {
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

      if (res.ok) {
        const newMessage = {
          senderId: userId,
          receiverId: selectedUser.PK,
          text,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    }

    if (selectedChannel) {
      const res = await fetch("/api/channels/messages", {
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

      if (res.ok) {
        const newMessage = {
          senderId: userId,
          senderName: user,
          text,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    }

    setText("");
  }

  return (
    <div className="chat-page">
      <header className="topbar">
        <div className="topbar-left">
          <h1>CHAPPY</h1>
        </div>
        <div className="topbar-right">
          <span className="user-name">Välkommen {user}</span>
          <button className="btn-logout" onClick={handleLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="sidebar">
          <Channels
            selectedChannel={selectedChannel}
            onSelectChannel={(channel) => {
              if (role === "guest" && channel.isPrivate) return channel;
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
              {users.map((u) => {
                const isGuest = role === "guest";
                const isDisabled = isGuest;
                return (
                  <li
                    key={u.PK}
                    className={`${selectedUser?.PK === u.PK ? "active" : ""} ${
                      isDisabled ? "locked-user" : ""
                    }`}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedUser(u);
                        setSelectedChannel(null);
                        setMessages([]);
                      }
                    }}
                  >
                    {u.name}
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <main className="chat-window">
          <div className="chat-header">
            {selectedChannel && <h3># {selectedChannel.name}</h3>}
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
              <h3>Välj kanal eller användare för att chatta</h3>
            )}
          </div>

          <div className="chat-messages">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`message-group ${
                m.senderId === userId ? "sent" : "received"
                }`}
              >
                <div className="sender-info">
                  <em className="sender-name">
                    {m.senderId === userId ? user : m.senderName || "Okänd"}
                  </em>
                  <span className="message-time">
                    {" - "}
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
           <textarea placeholder="Skriv ett meddelande..." value={text} onChange={(e) => setText(e.target.value)} rows={2}></textarea>

            <button onClick={sendMessage}>Skicka</button>
          </div>

          )}
        </main>

        <div className="side-panel">
          <img src={reklamImage} alt="Reklam: Chappy Premium" className="ad-image"/>
        </div>
      </div>
    </div>
  );
}
