import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import chappyLogo from "../assets/chappy.png";

// typer för användare och meddelanden
interface User {
  PK: string;
  name: string;
}

interface Message {
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
}

export default function Chat() {
  const navigate = useNavigate();

  const [user, setUser] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState<string>("");

  // Logga ut all info och skicka tillbaka till start
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/");
  }

  // Hämta inloggad användare (från localStorage)
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

  // Hämta alla användare (visas i listan till vänster)
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

  // Hämtar meddelanden för vald användare (när man klickar på någon)
  useEffect(() => {
    if (!selectedUser) return; // Om ingen användare är vald ska inget hända

    const token = localStorage.getItem("token");

    // själv-anropande async-funktion för att kunna använda await
    (async () => {
      const res = await fetch("/api/chats/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: Message[] = await res.json();

      // filter för att visa bara meddelanden mellan inloggad user och den valda
      const filtered = data.filter(
        (m) =>
          (m.senderId === userId && m.receiverId === selectedUser.PK) ||
          (m.senderId === selectedUser.PK && m.receiverId === userId)
      );

      setMessages(filtered);
    })();
  }, [selectedUser, userId]);

  // Skicka meddelande
  async function sendMessage() {
    if (!text.trim() || !selectedUser) return; // inget tomt meddelande

    const token = localStorage.getItem("token");

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

    setText("");

    // Ladda om meddelanden efter att man skickat, så de kommer längst upp
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

  return (
    <div className="chat-page">
      {/* Övre meny */}
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
        {/* Sidopanel med användare */}
        <aside className="sidebar">
          <h3>Användare</h3>
          <ul>
            {users.map((u) => (
              <li
                key={u.PK}
                className={selectedUser?.PK === u.PK ? "active" : ""}
                onClick={() => setSelectedUser(u)}
              >
                {u.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* chatten */}
        <main className="chat-window">
          <div className="chat-header">
            <h3>{selectedUser ? selectedUser.name : "Välj användare"}</h3>
          </div>

          <div className="chat-messages">
            {/* Ingen användare vald */}
            {!selectedUser && <p>Välj en användare för att börja chatta.</p>}

            {/* Om användare är vald men inga meddelanden */}
            {selectedUser && messages.length === 0 && (
              <p>Du har inga meddelanden med {selectedUser.name} än.</p>
            )}

            {/* Visa meddelanden bara om användare är vald */}
            {selectedUser &&
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`message-group ${
                    m.senderId === userId ? "sent" : "received"
                  }`}
                >
                  {/* Namn + tid ovanför varje meddelande */}
                  <div className="sender-name">
                    <em>
                      {m.senderId === userId ? user : selectedUser.name} –{" "}
                      {m.timestamp
                        ? new Date(m.timestamp).toLocaleTimeString("sv-SE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </em>
                  </div>

                  <div className="message-bubble">{m.text}</div>
                </div>
              ))}
          </div>

          {/* visas bara om man valt användare*/}
          {selectedUser && (
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
