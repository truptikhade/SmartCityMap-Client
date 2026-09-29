'use client'

import { Bot, X } from 'lucide-react'

export default function AIAssistantButton({
  open,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        open
          ? 'Close AI assistant'
          : 'Open AI assistant'
      }
      title={
        open
          ? 'Close AI assistant'
          : 'Open AI assistant'
      }
      className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        border
        border-gray-200
        bg-white
        text-gray-800
        shadow-lg
        transition
        hover:bg-gray-50
        hover:shadow-xl
      "
    >
      {open ? (
        <X size={20} />
      ) : (
        <Bot size={21} />
      )}
    </button>
  )
}