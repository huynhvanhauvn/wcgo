
import React, { createContext, useContext, useState, useEffect } from 'react'
import { DateTime } from 'luxon'

const TimerContext = createContext<DateTime>(DateTime.now())

export const useTimer = () => useContext(TimerContext)

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState(DateTime.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(DateTime.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <TimerContext.Provider value={now}>
      {children}
    </TimerContext.Provider>
  )
}
