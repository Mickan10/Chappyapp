import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import chappyLogo from "../assets/chappy.png";
import type { User, Message, Channel } from "../types"; 

export default function Chat() {
  const navigate = useNavigate();

  //TODO zustand
  const [user, setUser] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");

  // logga ut lokalt i webbläsaren
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/");
  }

  //Kolla om användaren redan är inloggad
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

  // hämta andra användare, för chatt
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

  // hämta kanaler
  useEffect(() => {
    const token = localStorage.getItem("token");
    async function loadChannels() {
      const res = await fetch("/api/channels/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChannels(data);
    }
    loadChannels();
  }, []);

  // hämta privata meddelanden
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

  // hämta kanal-meddelanden
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

  // skicka meddelande, inga tomma meddeladen.
  async function sendMessage() {
    if (!text.trim()) return;
    const token = localStorage.getItem("token");

    // privata
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
      //visa meddelanden mellan inloggad o vald användare
      const filtered = data.filter(
        (m) =>
          (m.senderId === userId && m.receiverId === selectedUser.PK) ||
          (m.senderId === selectedUser.PK && m.receiverId === userId)
      );
      setMessages(filtered);
    }

    // kanal
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
      <header className="topbar">
        <div className="topbar-left">
          <img src={chappyLogo} alt="logo" className="topbar-logo" />
        </div>
        <div className="topbar-right">
          <button className="btn-user">{user}</button>
          <button className="btn-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Kanaler</h3>
            <ul>
              {channels.length === 0 && <li>Inga kanaler ännu</li>}
              {channels.map((c) => (
                <li
                  key={c.PK}
                  className={selectedChannel?.PK === c.PK ? "active" : ""}
                  onClick={() => {
                    setSelectedChannel(c);
                    setSelectedUser(null);
                    setMessages([]);
                  }}
                >
                  #{c.name}
                </li>
              ))}
            </ul>
          </div>

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

        <main className="chat-window">
          <div className="chat-header">
            <h3>
              {selectedChannel
                ? `#${selectedChannel.name}`
                : selectedUser
                ? selectedUser.name
                : "Välj kanal eller användare"}
            </h3>
          </div>

          <div className="chat-messages">
            {!selectedUser && !selectedChannel && (
              <p>Välj en kanal eller användare för att börja chatta.</p>
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
                <div className="sender-name">
                  <em>
                    {m.senderId === userId
                      ? user
                      : selectedUser
                      ? selectedUser.name
                      : m.senderId}{" "}
                    –{" "}
                    {new Date(m.timestamp).toLocaleTimeString("sv-SE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </em>
                </div>
                <div className="message-bubble">{m.text}</div>
              </div>
            ))}
          </div>

          {(selectedUser || selectedChannel) && (
            <div className="chat-input">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Aa..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
