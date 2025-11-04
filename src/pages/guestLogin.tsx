import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function GuestLogin() {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  async function handleGuestLogin() {
    if (!name.trim()) {
      setError("Fyll i ett namn för att fortsätta som gäst")
      return
    }

    try {
      const res = await fetch("/api/users/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Kunde inte logga in som gäst")

      // 🔹 Spara i localStorage
      localStorage.setItem("token", data.token)
      localStorage.setItem("userId", data.userId)
      localStorage.setItem("userName", data.name)
      localStorage.setItem("userRole", "guest")

      navigate("/chat")
    } catch (err) {
      console.error("Fel vid gästinloggning:", err)
      setError("Kunde inte logga in som gäst.")
    }
  }

  return (
    <div className="login-container">
      <h2>Gästinloggning</h2>
      <input
        type="text"
        placeholder="Ditt namn"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={handleGuestLogin}>Fortsätt till chatten</button>
      <button onClick={() => navigate("/")}>Tillbaka</button>
      {error && <p>{error}</p>}
    </div>
  )
}
