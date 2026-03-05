import React from "react"
import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

type Session = {
  id: string
  telegram_id: string
  name: string
  duration_seconds: number
  intention: string
  mood: string
  created_at: string
}

type AppState = {
  sessions: Session[]
}

type AppContextType = {
  data: AppState
  loading: boolean
  user: any
  refreshData: () => Promise<void>
  endPractice: (duration: number, intention: string, mood: string) => Promise<void>
}

const AppContext = createContext<AppContextType | null>(null)

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("AppContext not found")
  return ctx
}

export const AppProvider = ({ children }: { children: React.ReactNode }) => {

  const [data, setData] = useState<AppState>({
    sessions: []
  })

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const refreshData = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase load error:", error)
        return
      }

      setData({
        sessions: sessions || []
      })

    } catch (err) {
      console.error("Unexpected error:", err)
    }
  }

  const endPractice = async (duration: number, intention: string, mood: string) => {

    if (!user) {
      console.warn("No Telegram user")
      return
    }

    try {
      const { error } = await supabase
        .from("sessions")
        .insert({
          telegram_id: String(user.id),
          name: user.first_name,
          duration_seconds: duration,
          intention,
          mood
        })

      if (error) {
        console.error("Supabase insert error:", error)
        return
      }

      await refreshData()

    } catch (err) {
      console.error("Unexpected error:", err)
    }
  }

  useEffect(() => {

    const init = async () => {

      const tg = (window as any).Telegram?.WebApp

      if (tg) {
        tg.ready()
        tg.expand()

        const telegramUser = tg.initDataUnsafe?.user

        if (telegramUser) {
          setUser(telegramUser)
        } else {
          console.warn("Telegram user not available yet")
        }
      } else {
        console.warn("Telegram WebApp not detected")
      }

      await refreshData()

      setLoading(false)
    }

    init()

  }, [])

  return (
    <AppContext.Provider
      value={{
        data,
        loading,
        user,
        refreshData,
        endPractice
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
