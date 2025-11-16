import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Brain, LogOut, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "assistant" | "user";
  content: string;
}

const InterviewSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    loadSession();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadSession = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      const { data: messagesData } = await supabase
        .from("interview_messages")
        .select("*")
        .eq("session_id", id)
        .order("created_at");

      if (messagesData && messagesData.length > 0) {
        setMessages(
          messagesData.map((msg) => ({
            role: msg.role as "assistant" | "user",
            content: msg.content,
          }))
        );
      } else {
        // Start the interview with initial greeting
        await sendMessage("", true);
      }
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load interview session");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, isInitial = false) => {
    if (!content.trim() && !isInitial) return;

    setSending(true);
    setStreamingMessage("");

    try {
      const userMessage: Message = { role: "user", content };
      const newMessages = isInitial ? [] : [...messages, userMessage];

      if (!isInitial) {
        setMessages(newMessages);
        setInput("");

        // Save user message
        await supabase.from("interview_messages").insert({
          session_id: id,
          role: "user",
          content,
        });
      }

      // Call interview chat function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interview-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: isInitial
              ? []
              : newMessages.map((m) => ({ role: m.role, content: m.content })),
            interviewType: session?.interview_type,
            resumeContent: session?.resume_content,
          }),
        }
      );

      if (!response.ok || !response.body) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setStreamingMessage(assistantMessage);
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }

      // Save assistant message
      await supabase.from("interview_messages").insert({
        session_id: id,
        role: "assistant",
        content: assistantMessage,
      });

      setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);
      setStreamingMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const endInterview = async () => {
    try {
      await supabase
        .from("interview_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);

      toast.success("Interview completed!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error ending interview:", error);
      toast.error("Failed to end interview");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-soft flex-shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Brain className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-primary">AI Interview Session</h1>
              <p className="text-sm text-muted-foreground capitalize">{session?.interview_type} Interview</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="outline" onClick={endInterview}>
              <CheckCircle className="w-4 h-4 mr-2" />
              End Interview
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: message.content.replace(/\n/g, "<br>"),
                    }}
                  />
                </Card>
              </div>
            ))}

            {streamingMessage && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-4 bg-card">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: streamingMessage.replace(/\n/g, "<br>"),
                    }}
                  />
                </Card>
              </div>
            )}

            {sending && !streamingMessage && (
              <div className="flex justify-start">
                <Card className="p-4 bg-card">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card flex-shrink-0">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex gap-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Type your answer here... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={sending || !input.trim()}
              size="lg"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
