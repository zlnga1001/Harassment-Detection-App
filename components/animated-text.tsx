"use client"

import { useState, useEffect } from "react"

const phrases = ["Nora (Nga) Vu", "Kien Tran", "Warren Yap", "Antonio Franco Laureano"]

export default function AnimatedText() {
  const maxLength = Math.max(...phrases.map((name) => name.length)) // Find longest name
  const typingSpeeds = phrases.map((name) => Math.floor(120 * (name.length / maxLength))) // Adjust speed per name

  const [texts, setTexts] = useState(Array(phrases.length).fill(""))
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (isComplete) return // Stop animation once complete

    const handleTyping = () => {
      setTexts((prevTexts) => {
        const updatedTexts = prevTexts.map((text, i) => {
          if (text.length < phrases[i].length) {
            return phrases[i].substring(0, text.length + 1)
          }
          return text
        })

        if (updatedTexts.every((text, i) => text === phrases[i])) {
          setIsComplete(true) // Stop animation when all names are fully typed
        }

        return updatedTexts
      })
    }

    const timers = texts.map((text, i) =>
      text.length < phrases[i].length ? setTimeout(handleTyping, typingSpeeds[i]) : null
    )

    return () => timers.forEach((timer) => timer && clearTimeout(timer))
  }, [texts, isComplete, typingSpeeds])

  return (
    <div className="h-32 flex flex-col items-center justify-center space-y-1">
      {texts.map((text, i) => (
        <p key={i} className="text-2xl font-light tracking-wide bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">
          {text}
          {!isComplete && text.length < phrases[i].length && <span className="animate-blink text-green-400">|</span>}
        </p>
      ))}
    </div>
  )
}
