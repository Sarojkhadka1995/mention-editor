"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

// Mock users for @mention suggestions
interface User {
  id: string
  name: string
  email: string
}

interface MentionEditorProps {
  fetchUsers: (query: string) => Promise<User[]>
  onSubmit?: (html: string) => void
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
}

export function MentionEditor({
  fetchUsers,
  onSubmit,
  onChange,
  placeholder = "Add a comment...",
  className,
}: MentionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const mentionRangeRef = useRef<Range | null>(null)
  const isActiveMentionRef = useRef(false)
  const lastInputTypeRef = useRef<string>("")
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  const handleBeforeInput = (e: React.CompositionEvent<HTMLDivElement> | any) => {
    if (e.data === "@") {
      isActiveMentionRef.current = true
      lastInputTypeRef.current = "insert"
    }
  }

  const handleInput = () => {
    if (!editorRef.current) return

    const content = editorRef.current.innerHTML
    const normalizedContent = content === "<br>" || content === "<br/>" ? "" : content
    onChange?.(normalizedContent)

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const textBeforeCaret = getTextBeforeCaret(range)

    const mentionMatch = textBeforeCaret.match(/@([\w\s.\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]*)$/)

    if (mentionMatch && isActiveMentionRef.current) {
      const query = mentionMatch[1]
      setMentionQuery(query)
      mentionRangeRef.current = range.cloneRange()

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true)
        try {
          const users = await fetchUsers(query)
          setFilteredUsers(users)
          setSelectedIndex(0)
        } catch (error) {
          console.error("Failed to fetch users:", error)
          setFilteredUsers([])
        } finally {
          setIsLoading(false)
        }
      }, 300)

      const caretPosition = getCaretPosition()
      setDropdownPosition(caretPosition)
      setShowDropdown(true)
    } else {
      if (isActiveMentionRef.current && !mentionMatch) {
        setShowDropdown(false)
        isActiveMentionRef.current = false
        mentionRangeRef.current = null
      }
    }
  }

  const getTextBeforeCaret = (range: Range): string => {
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(editorRef.current!)
    preCaretRange.setEnd(range.endContainer, range.endOffset)

    const container = document.createElement("div")
    container.appendChild(preCaretRange.cloneContents())

    const mentions = container.querySelectorAll("a.mention")
    mentions.forEach((mention) => {
      const textNode = document.createTextNode(mention.textContent || "")
      mention.parentNode?.replaceChild(textNode, mention)
    })

    return container.textContent || ""
  }

  const getCaretPosition = (): { top: number; left: number } => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return { top: 0, left: 0 }
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const editorRect = editorRef.current?.getBoundingClientRect()

    if (!editorRect) return { top: 0, left: 0 }

    return {
      top: rect.bottom - editorRect.top + 4,
      left: rect.left - editorRect.left,
    }
  }

  const insertMention = (user: User) => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection) return

    const range = selection.getRangeAt(0)

    let textNode = range.endContainer

    if (textNode.nodeType !== Node.TEXT_NODE) {
      const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT, null)

      let found = false
      while (walker.nextNode()) {
        const node = walker.currentNode
        if (node.textContent?.includes("@")) {
          textNode = node
          found = true
          break
        }
      }

      if (!found) return
    }

    const textContent = textNode.textContent || ""
    const atIndex = textContent.lastIndexOf("@")
    if (atIndex === -1) return

    const deleteRange = document.createRange()
    deleteRange.setStart(textNode, atIndex)
    deleteRange.setEnd(textNode, textContent.length)

    deleteRange.deleteContents()

    const mention = document.createElement("a")
    mention.href = `/users/${user.id}`
    mention.className = "mention"
    mention.setAttribute("data-user-id", user.id)
    mention.contentEditable = "false"
    mention.textContent = `@${user.name}`
    mention.style.cssText = `
      display: inline-block;
      background: #e9f2ff;
      color: #0052cc;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      user-select: none;
    `

    deleteRange.insertNode(mention)

    const space = document.createTextNode("\u00A0")
    deleteRange.setStartAfter(mention)
    deleteRange.insertNode(space)

    deleteRange.setStartAfter(space)
    deleteRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(deleteRange)

    editorRef.current.focus()

    onChange?.(editorRef.current.innerHTML)

    setShowDropdown(false)
    isActiveMentionRef.current = false
    mentionRangeRef.current = null
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => (prev < filteredUsers.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        if (filteredUsers[selectedIndex]) {
          e.preventDefault()
          insertMention(filteredUsers[selectedIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setShowDropdown(false)
        isActiveMentionRef.current = false
        break
      case " ":
        if (filteredUsers.length === 0) {
          setShowDropdown(false)
          isActiveMentionRef.current = false
        }
        break
    }
  }

  const handleSubmit = () => {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    const normalizedHtml = html === "<br>" || html === "<br/>" ? "" : html
    onSubmit?.(normalizedHtml)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showDropdown) return

      const target = event.target as Node
      const dropdown = document.getElementById("mention-dropdown")

      const clickedOutsideDropdown = dropdown && !dropdown.contains(target)

      if (clickedOutsideDropdown) {
        setShowDropdown(false)
        isActiveMentionRef.current = false
        mentionRangeRef.current = null
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDropdown])

  useEffect(() => {
    const dropdown = document.getElementById("mention-dropdown")
    const selectedItem = document.getElementById(`user-${selectedIndex}`)
    if (dropdown && selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={cn("relative", className)}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onBeforeInput={handleBeforeInput}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Comment editor"
        data-placeholder={placeholder}
        style={{
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      />

      {showDropdown && (
        <div
          id="mention-dropdown"
          role="listbox"
          aria-label="User suggestions"
          onMouseDown={(e) => e.preventDefault()}
          className="absolute z-50 max-h-[200px] w-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          {isLoading ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              <div className="font-medium">Loading...</div>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user, index) => (
              <div
                key={user.id}
                id={`user-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm transition-colors",
                  index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              <div className="font-medium">No members found</div>
              <div className="text-xs mt-1">Try a different search term</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSubmit}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export type { User }
