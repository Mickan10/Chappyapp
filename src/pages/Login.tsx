import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./login.css"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    document.body.classList.add("login-page")
    return () => document.body.classList.remove("login-page")
  }, [])

  //hantera login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault() //inte ladda om sidan
    setError("")

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Fel användarnamn eller lösenord")
        return
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("userName", data.name)
      localStorage.setItem("userId", data.userId)

      navigate("/chat")
    } catch {
      setError("Nätverksfel, försök igen")
    }
  }

  return (
    
    <div className="login-container">
      <h1>CHAPPY</h1>

      <form className="login-form" onSubmit={handleLogin}>
        <input type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} required/>

        <input type="password" placeholder="Lösenord" value={password} onChange={(e) => setPassword(e.target.value)} required/>

        <button type="submit">Logga in</button>

        <button type="button" onClick={() => navigate("/register")}>
          Skapa konto
        </button>
        
        <button type="button" onClick={() => navigate("/guest")}>
          Logga in som gäst
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
