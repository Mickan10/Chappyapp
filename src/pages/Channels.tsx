import { useState, useEffect } from "react"
import type { Channel } from "../types"

type ChannelsProps = {
  selectedChannel: Channel | null
  onSelectChannel: (channel: Channel) => Channel
}

export default function Channels({ selectedChannel, onSelectChannel }: ChannelsProps) {
  const [channels, setChannels] = useState<Channel[]>([])
  const [role, setRole] = useState<string>("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole") || "user"
    setRole(userRole)

    async function loadChannels() {
      const res = await fetch("/api/channels/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setChannels(data)
    }
    loadChannels()
  }, [])

  return (
    <div className="sidebar-section">
      <h3>Kanaler</h3>
      <ul>
        {channels.length === 0 && <li>Inga kanaler ännu</li>}

        {channels.map((c) => {
          const isPrivate = c.isPrivate === true
          const isGuest = role === "guest"
          const isDisabled = isGuest && isPrivate

          return (
            <li
              key={c.PK}
              className={`
                ${selectedChannel?.PK === c.PK ? "active" : ""} 
                ${isDisabled ? "locked-channel" : ""}
              `}
              onClick={() => {
                if (!isDisabled) onSelectChannel(c)
              }}
            >
              #{c.name} {isPrivate && <span></span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
