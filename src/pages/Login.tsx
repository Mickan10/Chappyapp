import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import chappyLogo from "../assets/chappy.png";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // TODO - ändra i css o ta bort 
  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  // hantera inloggning
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      //spara användardata i localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);
      localStorage.setItem("userId", data.userId);

      //navigera till chat
      navigate("/chat");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error");
    }
  }

  return (
    <div className="login-container">
      <img src={chappyLogo} alt="Chappy logo" className="logo" />

      <form className="login-form" onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="E-post"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Logga in</button>

        <button type="button" onClick={() => navigate("/register")}>
          Skapa konto
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
