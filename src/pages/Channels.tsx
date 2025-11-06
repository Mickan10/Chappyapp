import { useState, useEffect } from "react"
import type { Channel } from "../types"

type ChannelsProps = {
  selectedChannel: Channel | null
  onSelectChannel: (channel: Channel) => Channel
}

export default function Channels({ selectedChannel, onSelectChannel }: ChannelsProps) {
  const [channels, setChannels] = useState<Channel[]>([])

  useEffect(() => {
    const token = localStorage.getItem("token")
    
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
        {channels.map((c) => (
          <li
            key={c.PK}
            className={selectedChannel?.PK === c.PK ? "active" : ""}
            onClick={() => onSelectChannel(c)}>
            #{c.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
