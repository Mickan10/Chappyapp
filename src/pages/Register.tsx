import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import chappyLogo from "../assets/chappy.png"
import "./register.css"

export default function Register() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    document.body.classList.add("register-page")
    return () => document.body.classList.remove("register-page")
  }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setMessage("Skapar konto...")

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.error || "Kunde inte skapa konto")
        return
      }

      setMessage("Konto skapat! Skickar dig till inloggning...")
      setTimeout(() => navigate("/"), 2000)
    } catch {
      setMessage("Något gick fel, försök igen.")
    }
  }

  return (
    <div className="register-container">
      <img src={chappyLogo} alt="Chappy logo" className="logo" />
      <h2>Skapa konto</h2>

      <form className="register-form" onSubmit={handleRegister}>
        <input type="text"placeholder="Namn"value={name} onChange={(e) => setName(e.target.value)} required/>

        <input type="email" placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} required/>
        
        <input type="password" placeholder="Lösenord" value={password} onChange={(e) => setPassword(e.target.value)} required/>
        
        <button type="submit">Registrera</button>
        <button onClick={() => navigate("/")}>Tillbaka till login</button>
      </form>

      {message && <p className="status-message">{message}</p>}
    </div>
  )
}
