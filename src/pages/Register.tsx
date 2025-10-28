import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./register.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add("register-page");
    return () => document.body.classList.remove("register-page");
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("Create account");

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Fail");
        return;
      }

      setMessage("konto");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error("Register error:", err);
      setMessage("Error, try again.");
    }
  }

  return (
    <div className="register-container">
      <h2>Skapa konto</h2>
      <form className="register-form" onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign up</button>
      </form>

      {/* TODO Statusmeddelande */}
      {message && <p className="status-message">{message}</p>}
    </div>
  );
}
