"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Save, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Markdown message component
const MarkdownMessage = ({ content }) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 style={{fontSize: '1.5em', fontWeight: 'bold', marginBottom: '0.5em'}} {...props} />,
          h2: ({node, ...props}) => <h2 style={{fontSize: '1.3em', fontWeight: 'bold', marginBottom: '0.5em'}} {...props} />,
          h3: ({node, ...props}) => <h3 style={{fontSize: '1.1em', fontWeight: 'bold', marginBottom: '0.5em'}} {...props} />,
          p: ({node, ...props}) => <p style={{marginBottom: '1em', whiteSpace: 'pre-wrap'}} {...props} />,
          ul: ({node, ...props}) => <ul style={{listStyle: 'disc', marginLeft: '1em', marginBottom: '1em'}} {...props} />,
          ol: ({node, ...props}) => <ol style={{listStyle: 'decimal', marginLeft: '1em', marginBottom: '1em'}} {...props} />,
          li: ({node, ...props}) => <li style={{marginBottom: '0.5em'}} {...props} />,
          strong: ({node, ...props}) => <strong style={{fontWeight: 'bold'}} {...props} />,
          code: ({node, inline, ...props}) => 
            inline ? (
              <code style={{backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.2em 0.4em', borderRadius: '3px'}} {...props} />
            ) : (
              <pre style={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                padding: '1em',
                borderRadius: '5px',
                overflowX: 'auto',
                marginBottom: '1em'
              }}>
                <code {...props} />
              </pre>
            )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default function ChatInterface({
  apiStatus,
  uploadStatus,
  chatHistory,
  setChatHistory,
  setErrorMessage,
  onAskQuestion,
  currentChat,
  onSaveChat,
}) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatName, setChatName] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const chatContainerRef = useRef(null)

  // Auto-scroll to the bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  // Set chat name when current chat changes
  useEffect(() => {
    if (currentChat) {
      setChatName(currentChat.chatName)
    } else {
      setChatName(`Chat ${new Date().toLocaleString()}`)
    }
  }, [currentChat])

  const handleAsk = async () => {
    if (!question.trim()) return

    setIsLoading(true)
    try {
      // Use onAskQuestion prop to handle the API call with JWT token
      await onAskQuestion(question.trim())
    } catch (error) {
      setErrorMessage("Failed to process question")
    } finally {
      setIsLoading(false)
      setQuestion("")
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAsk()
    }
  }

  const handleSaveChat = async () => {
    if (!chatName.trim()) {
      setErrorMessage("Please enter a chat name")
      return
    }

    if (chatHistory.length === 0) {
      setErrorMessage("No chat history to save")
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setErrorMessage("Please log in to save chats")
        return
      }

      const response = await fetch("http://localhost:3000/api/chats/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: currentChat?.chatId, // Send existing chatId if available
          chatName, // Send custom chat name
          history: chatHistory, // Send chat history
        }),
      })

      if (response.ok) {
        setDialogOpen(false)
        // Trigger parent to refresh chat list
        onSaveChat(chatHistory)
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.message || "Failed to save chat")
      }
    } catch (error) {
      setErrorMessage("Failed to save chat due to a network error")
    }
  }

  const clearChat = () => {
    setChatHistory([])
    setChatName(`Chat ${new Date().toLocaleString()}`)
  }

  const isInputDisabled = apiStatus !== "healthy" || uploadStatus !== "success" || isLoading

  return (
    <div className="flex flex-col h-[350px] sm:h-[400px] md:h-[500px]">
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-muted/50 rounded-lg mb-4 border border-border"
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10 md:mt-20">
            {uploadStatus === "success"
              ? "Your PDFs are processed. Ask a question about them!"
              : "Upload PDFs to start chatting"}
          </div>
        ) : (
          chatHistory.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] sm:max-w-[80%] p-2 md:p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border shadow-sm"
                }`}
              >
                {message.role === "bot" ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  <div style={{whiteSpace: 'pre-wrap'}}>{message.content}</div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-[80%] p-2 md:p-3 rounded-lg bg-card border border-border shadow-sm flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
              <span className="text-foreground">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={chatHistory.length === 0}
                className="border-border hover:bg-muted hover:text-foreground"
              >
                <Save className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Save Chat</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleSaveChat}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="icon"
            onClick={clearChat}
            disabled={chatHistory.length === 0}
            className="border-border hover:bg-muted"
          >
            <Trash className="h-4 w-4 text-foreground" />
          </Button>
        </div>

        <div className="relative flex-1 mt-2 sm:mt-0">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              apiStatus !== "healthy"
                ? "API is not available"
                : uploadStatus !== "success"
                  ? "Upload PDFs first"
                  : "Ask a question about your PDFs..."
            }
            disabled={isInputDisabled}
            className="pr-12 border-border focus-visible:ring-ring"
          />
          <Button
            onClick={handleAsk}
            disabled={isInputDisabled || !question.trim()}
            size="icon"
            className="absolute right-1 top-1 h-8 w-8 bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}