"use client"

import { useState } from "react"
import { MentionEditor, type User } from "@/components/mention-editor"

export default function Home() {
  const [submittedHtml, setSubmittedHtml] = useState("")
  const [editorContent, setEditorContent] = useState("")

  const getTextLength = (html: string): number => {
    if (!html) return 0
    const temp = document.createElement("div")
    temp.innerHTML = html
    return temp.textContent?.length || 0
  }

  const fetchUsers = async (query: string): Promise<User[]> => {
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/users?_page=1&_limit=10")
      const data = await response.json()

      const transformedUsers: User[] = data.map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
      }))

      if (query.trim()) {
        return transformedUsers.filter(
          (user) =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()),
        )
      }

      return transformedUsers
    } catch (error) {
      console.error("Failed to fetch users:", error)
      return []
    }
  }

  const handleSubmit = (html: string) => {
    setSubmittedHtml(html)
    console.log("Submitted HTML:", html)
  }

  const handleChange = (html: string) => {
    setEditorContent(html)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rich Text Comment Editor</h1>
          <p className="text-muted-foreground">Type @ to mention users • Supports multi-line and multiple mentions</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">Write a comment</h2>
          <MentionEditor fetchUsers={fetchUsers} onSubmit={handleSubmit} onChange={handleChange} />
        </div>

        {editorContent && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">Live Editor Content</h3>
            <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: editorContent }} />
            <p className="mt-2 text-xs text-muted-foreground">Character count: {getTextLength(editorContent)}</p>
          </div>
        )}

        {submittedHtml && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">Rendered Output</h3>
              <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: submittedHtml }} />
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">HTML Output</h3>
              <pre className="overflow-x-auto rounded bg-muted p-3 text-xs text-muted-foreground">{submittedHtml}</pre>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
