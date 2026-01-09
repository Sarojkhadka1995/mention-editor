"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { cn } from "./utils"
import "./styles.css"

export interface User {
  id: string
  name: string
  email: string
}

export interface MentionConfig {
  href?: (user: User) => string
  className?: string
  target?: "_blank" | "_self" | "_parent" | "_top"
  rel?: string
  dataAttributes?: Record<string, string>
}

export interface MentionEditorProps {
  fetchUsers: (query: string) => Promise<User[]>
  onSubmit?: (html: string) => void
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  mentionConfig?: MentionConfig
}

export function MentionEditor({
  fetchUsers,
  onSubmit,
  onChange,
  placeholder = "Add a comment...",
  className,
  mentionConfig = {},
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

    // Set href using custom function or default
    const defaultHref = `/users/${user.id}`
    mention.href = mentionConfig.href ? mentionConfig.href(user) : defaultHref

    // Set className with custom class or default
    mention.className = mentionConfig.className || "mention"

    // Set target if provided
    if (mentionConfig.target) {
      mention.target = mentionConfig.target
    }

    // Set rel if provided
    if (mentionConfig.rel) {
      mention.rel = mentionConfig.rel
    }

    // Add data attributes
    mention.setAttribute("data-user-id", user.id)
    if (mentionConfig.dataAttributes) {
      Object.entries(mentionConfig.dataAttributes).forEach(([key, value]) => {
        mention.setAttribute(`data-${key}`, value)
      })
    }

    mention.contentEditable = "false"
    mention.textContent = `@${user.name}`

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
    <div className={cn("mention-editor-container", className)}>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onBeforeInput={handleBeforeInput}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="mention-editor"
        aria-label="Comment editor"
        data-placeholder={placeholder}
      />

      {showDropdown && (
        <div
          id="mention-dropdown"
          role="listbox"
          aria-label="User suggestions"
          onMouseDown={(e) => e.preventDefault()}
          className="mention-dropdown"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          {isLoading ? (
            <div className="mention-dropdown-loading">
              <div className="mention-dropdown-loading-text">Loading...</div>
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
                className={cn("mention-dropdown-item", index === selectedIndex && "mention-dropdown-item-selected")}
              >
                <div className="mention-dropdown-item-name">{user.name}</div>
                <div className="mention-dropdown-item-email">{user.email}</div>
              </div>
            ))
          ) : (
            <div className="mention-dropdown-empty">
              <div className="mention-dropdown-empty-title">No members found</div>
              <div className="mention-dropdown-empty-subtitle">Try a different search term</div>
            </div>
          )}
        </div>
      )}

      <div className="mention-editor-actions">
        <button onClick={handleSubmit} className="mention-editor-submit-btn">
          Submit
        </button>
      </div>
    </div>
  )
}
