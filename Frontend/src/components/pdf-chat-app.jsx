"use client"

import { useState, useEffect, useContext } from "react"
import { FileText, AlertCircle, CheckCircle, Plus, Menu, X, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/hooks/use-media-query"
import ChatInterface from "@/components/chat-interface"
import FileUpload from "@/components/file-upload"
import ChatList from "@/components/chat-list"
import { AuthContext } from "@/context/authcontext"
import Cookies from "js-cookie"
import useAuthRedirect from "@/context/useauthredirect"

export default function PDFChatApp() {
  useAuthRedirect();
  const [apiStatus, setApiStatus] = useState("checking")
  const [uploadStatus, setUploadStatus] = useState("idle")
  const [errorMessage, setErrorMessage] = useState(null)
  const [chatHistory, setChatHistory] = useState([])
  const [chats, setChats] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { authData, logout } = useContext(AuthContext) // Use AuthContext with logout

  // Check if screen is mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isMobile])

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const response = await fetch("http://localhost:5000/api/health", { signal: controller.signal })
        clearTimeout(timeoutId)
        const data = await response.json()
        setApiStatus(data.status === "healthy" ? "healthy" : "down")
      } catch (error) {
        setApiStatus("down")
        setErrorMessage(
          error.name === "AbortError"
            ? "API request timed out"
            : "API is not available. Please ensure the server is running."
        )
      }
    }

    checkApiHealth()
  }, [])

  // Fetch user's chats
  useEffect(() => {
    if (apiStatus === "healthy") {
      fetchChats()
    }
  }, [apiStatus])

  const fetchChats = async () => {
    try {
      const token = Cookies.get("authToken")
      if (!token) {
        setErrorMessage("Please log in to view chats")
        return
      }

      const response = await fetch("http://localhost:3000/api/chats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setChats(data.chats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) || [])
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.message || "Failed to fetch chats")
      }
    } catch (error) {
      console.error("Error fetching chats:", error)
      setErrorMessage("Failed to fetch chats due to a network error")
    }
  }

  const createNewChat = () => {
    setChatHistory([])
    setCurrentChat(null)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const selectChat = async (chatId) => {
    try {
      const token = Cookies.get("authToken")
      if (!token) {
        setErrorMessage("Please log in to view chats")
        return
      }

      const response = await fetch(`http://localhost:3000/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setChatHistory(data.chat.history || [])
        setCurrentChat(data.chat)
        if (isMobile) {
          setSidebarOpen(false)
        }
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.message || "Failed to load chat history")
      }
    } catch (error) {
      console.error("Error fetching chat:", error)
      setErrorMessage("Failed to load chat history due to a network error")
    }
  }

  const saveCurrentChat = async (history) => {
    if (!history || history.length === 0) return

    try {
      const token = Cookies.get("authToken")
      if (!token) {
        setErrorMessage("Please log in to save chats")
        return
      }

      const response = await fetch("http://localhost:3000/api/chats/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId: currentChat?.chatId,
          history,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (!currentChat) {
          setCurrentChat({
            chatId: data.chatId,
            chatName: history.find((h) => h.role === "user")?.content?.substring(0, 50) || `Chat ${new Date().toISOString()}`,
          })
        }
        await fetchChats()
        return data.chatId
      } else {
        const errorData = await response.json()
        setErrorMessage(errorData.message || "Failed to save chat")
      }
    } catch (error) {
      console.error("Error saving chat:", error)
      setErrorMessage("Failed to save chat due to a network error")
    }
  }

  const handleAskQuestion = async (question) => {
    try {
      const token = Cookies.get("authToken")
      if (!token) {
        setErrorMessage("Please log in to ask questions")
        return
      }

      const askResponse = await fetch("http://localhost:5000/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          token,
          chatId: currentChat?.chatId,
        }),
      })

      if (askResponse.ok) {
        const { chat_history, chatId } = await askResponse.json()
        setChatHistory(chat_history)

        if (!currentChat && chatId) {
          setCurrentChat({
            chatId,
            chatName: chat_history.find((h) => h.role === "user")?.content?.substring(0, 50) || `Chat ${new Date().toISOString()}`,
          })
        }

        await fetchChats()
      } else {
        const errorData = await askResponse.json()
        setErrorMessage(errorData.error || "Failed to process question")
      }
    } catch (error) {
      console.error("Error asking question:", error)
      setErrorMessage("Failed to process question due to a network error")
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="text-xl font-bold">PDF Chat</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Log out"
          className="hover:bg-muted"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar - Collapsible on mobile */}
      {sidebarOpen && (
        <div
          className={`${
            isMobile ? "absolute z-40 top-[61px] bottom-0 left-0 w-[280px]" : "w-[280px] min-w-[280px]"
          } border-r border-border bg-card shadow-sm flex flex-col h-full md:h-screen`}
        >
          <div className="p-4 border-b border-border">
            <Button
              onClick={createNewChat}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <ChatList chats={chats} currentChatId={currentChat?.chatId} onSelectChat={selectChat} />
          </div>
        </div>
      )}

      {/* Main Content - Takes full width when sidebar is closed */}
      <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-61px)] md:h-screen">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-2xl font-bold">PDF Chat Application</h1>
          </div>

          <div className="flex items-center gap-4">
            {currentChat && (
              <div className="text-sm text-muted-foreground">
                Current chat: <span className="font-medium">{currentChat.chatName}</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Log out"
              className="hover:bg-muted"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          {apiStatus === "down" && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage || "API is not available. Please ensure the server is running."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-1">
              <Card className="overflow-hidden border shadow-sm h-full">
                <CardHeader className="bg-muted/70 p-4">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <FileText className="h-5 w-5" />
                    PDF Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <FileUpload
                    apiStatus={apiStatus}
                    setUploadStatus={setUploadStatus}
                    setErrorMessage={setErrorMessage}
                  />
                  {uploadStatus === "success" && (
                    <div className="flex items-center gap-2 mt-4 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>PDFs processed successfully!</span>
                    </div>
                  )}
                  {uploadStatus === "error" && (
                    <div className="flex items-center gap-2 mt-4 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errorMessage || "Upload failed"}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="overflow-hidden border shadow-sm h-full">
                <CardHeader className="bg-muted/70 p-4">
                  <CardTitle className="text-base md:text-lg">Chat with your PDFs</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ChatInterface
                    apiStatus={apiStatus}
                    uploadStatus={uploadStatus}
                    chatHistory={chatHistory}
                    setChatHistory={setChatHistory}
                    setErrorMessage={setErrorMessage}
                    onAskQuestion={handleAskQuestion}
                    currentChat={currentChat}
                    onSaveChat={saveCurrentChat}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}