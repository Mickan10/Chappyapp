import { useState } from "react";
import { useNavigate } from "react-router-dom";
import chappyLogo from "../assets/chappy.png";

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "Stina", text: "Hello!" },
    { id: 2, sender: "User", text: "Hello!" },
    { id: 3, sender: "Stina", text: "Hello! Hello!" },
  ]);
  const [text, setText] = useState("");

  const navigate = useNavigate();

function handleLogout() {
  localStorage.removeItem("token");
  navigate("/");
}

  const users = ["Stina", "Lisa", "Gösta", "Lars"];
  const [selectedUser, setSelectedUser] = useState("Stina");

  function sendMessage() {
    if (!text.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: "User", text }]);
    setText("");
  }

  return (
    <div className="chat-page">
      <header className="topbar">
        <div className="topbar-left">
          <img src={chappyLogo} alt="logo" className="topbar-logo" />
          {/*<p className="sloggan">Connect. Chat. Chappy.</p>*/}
        </div>

        <div className="topbar-right">
          <button className="btn-user">User</button>  
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Channels</h3>
            <ul>
              <li>#Random1</li>
              <li>#Random2</li>
              <li>#Go</li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>Messages</h3>
            <ul>
              {users.map((u) => (
                <li
                  key={u}
                  className={u === selectedUser ? "active" : ""}
                  onClick={() => setSelectedUser(u)}
                >
                  {u}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* chatten */}
        <main className="chat-window">
          <div className="chat-header">
            <h3>{selectedUser}</h3>
          </div>

          <div className="chat-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`message-group ${
                  m.sender === "User" ? "sent" : "received"
                }`}
              >
                <p>{m.text}</p>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Aa..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </main>
      </div>
    </div>
  );
}
