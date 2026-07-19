"use client"

import { useChat } from "ai/react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import Markdown from "react-markdown"
import { useApp } from "./app-provider"
import { useEffect, useRef } from "react"

export function AiView() {
  const { t } = useApp()
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat'
  })
  
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const quickPrompts = [
    { label: "2 Odds", prompt: "Generate a solid 2 odds accumulator from today's matches." },
    { label: "5 Odds", prompt: "Generate a 5 odds accumulator from today's matches." },
    { label: "VIP Tips", prompt: "Show me the highest confidence VIP tips for today.", highlight: true }
  ]

  return (
    <div className="mx-auto flex h-[calc(100dvh-180px)] max-w-4xl flex-col p-4 md:h-[calc(100vh-140px)]">
      <div className="tp-fade-up flex flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--tp-border)] bg-[var(--tp-surface)] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.6)]">
        
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-[var(--tp-muted)]">
              <div className="tp-glow flex size-16 items-center justify-center rounded-full bg-[var(--tp-accent)]/10 text-[var(--tp-accent)] mb-4">
                <Bot className="size-8" />
              </div>
              <p className="font-display font-semibold text-[var(--tp-text)]">Data-Driven Betting Assistant</p>
              <p className="mt-2 text-sm text-balance max-w-xs">
                Ask me for tips on today's matches, analysis for specific teams, or general betting insights based on live data!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((m) => (
                <div key={m.id} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-[var(--tp-accent)] text-[var(--tp-on-accent)]' : 'bg-[var(--tp-bg-2)] border border-[var(--tp-border)] text-[var(--tp-accent)]'}`}>
                    {m.role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-[var(--tp-accent)] text-[var(--tp-on-accent)]' : 'bg-[var(--tp-bg-2)] text-[var(--tp-text)] border border-[var(--tp-border)]'}`}>
                    {m.role === 'assistant' ? (
                      <Markdown 
                        className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[var(--tp-surface)] prose-pre:border prose-pre:border-[var(--tp-border)]"
                        components={{
                          // Open all AI-generated links in a new tab to never navigate away from the app
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--tp-accent)] underline underline-offset-2 hover:opacity-80"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {m.content}
                      </Markdown>
                    ) : (
                      <p className="text-sm">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3">
                   <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--tp-bg-2)] border border-[var(--tp-border)] text-[var(--tp-accent)]">
                      <Bot className="size-4" />
                   </div>
                   <div className="flex items-center gap-2 rounded-2xl bg-[var(--tp-bg-2)] border border-[var(--tp-border)] px-4 py-3 text-sm text-[var(--tp-muted)]">
                     <Loader2 className="size-4 animate-spin" /> Thinking...
                   </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-[var(--tp-border)] bg-[var(--tp-surface-2)]/50 p-3 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => append({ role: 'user', content: qp.prompt })}
                  className={`tp-focus text-[10px] uppercase font-bold px-3 py-1.5 rounded-full border transition-transform hover:scale-[1.03] active:scale-[0.97] ${
                    qp.highlight 
                      ? 'bg-[var(--tp-accent)]/10 text-[var(--tp-accent)] border-[var(--tp-accent)]/30 hover:bg-[var(--tp-accent)]/20' 
                      : 'bg-[var(--tp-surface)] text-[var(--tp-text)] border-[var(--tp-border)] hover:bg-[var(--tp-bg-2)]'
                  }`}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask for match tips..."
              className="tp-focus flex-1 rounded-xl border border-[var(--tp-border)] bg-[var(--tp-bg)] px-4 py-3 pr-12 text-sm text-[var(--tp-text)] outline-none placeholder:text-[var(--tp-muted)]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 tp-focus flex items-center justify-center rounded-lg bg-[var(--tp-accent)] px-3 text-[var(--tp-on-accent)] disabled:opacity-50 transition-transform hover:scale-[1.03] active:scale-[0.97]"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
