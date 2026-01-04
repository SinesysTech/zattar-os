"use client"

import Lottie from "lottie-react"
import animationData from "./ai-sphere-animation.json"

interface AiSphereProps {
  onClick?: () => void
  size?: number
}

export function AiSphere({ onClick, size = 40 }: AiSphereProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
      aria-label="AI Assistant"
    >
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{ width: size, height: size }}
      />
    </button>
  )
}
