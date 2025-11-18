import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, LogOut, Target, TrendingUp, Mic, MicOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useVoiceChat } from "@/hooks/useVoiceChat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SkillGap {
  skill: string;
  importance: string;
  learning_resource: string;
}

const AdaptiveInterview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [voiceMode, setVoiceMode] = useState(false);

  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceChat({
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        setInput(transcript);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    checkAuth();
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await loadCareerGuidance(user.id);
  };

  const loadCareerGuidance = async (userId: string) => {
    try {
      const { data: recommendations, error } = await supabase
        .from("user_career_recommendations")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        toast({
          title: "No Career Guidance Found",
          description: "Please generate career guidance first from the Job Market Insights page.",
          variant: "destructive",
        });
        navigate("/job-market");
        return;
      }

      const gaps = (recommendations.skill_gaps as unknown) as SkillGap[];
      setSkillGaps(gaps || []);

      // Start the interview with an introduction
      await sendInitialMessage(gaps || []);
    } catch (error) {
      console.error("Error loading career guidance:", error);
      toast({
        title: "Error",
        description: "Failed to load career guidance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInitialMessage = async (gaps: SkillGap[]) => {
    const initialMessages = [
      {
        role: "user" as const,
        content: "Start the adaptive interview simulation based on my skill gaps.",
      },
    ];

    setMessages(initialMessages);
    await streamResponse(initialMessages, gaps);
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");

    await streamResponse(updatedMessages, skillGaps);
  };

  const streamResponse = async (msgs: Message[], gaps: SkillGap[]) => {
    setIsStreaming(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/adaptive-interview-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: msgs,
            userId,
            skillGaps: gaps,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  setMessages([
                    ...msgs,
                    { role: "assistant", content: assistantMessage },
                  ]);
                  
                  // Speak the response in voice mode
                  if (voiceMode && content && !isSpeaking) {
                    speak(content);
                  }
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error streaming response:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const toggleVoiceMode = () => {
    setVoiceMode(!voiceMode);
    if (voiceMode) {
      stopListening();
      stopSpeaking();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Adaptive Interview Simulation</h1>
              <p className="text-sm text-muted-foreground">
                Focused on your skill gaps
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={voiceMode ? "default" : "outline"}
              size="sm"
              onClick={toggleVoiceMode}
            >
              {voiceMode ? <Mic className="h-4 w-4 mr-2" /> : <MicOff className="h-4 w-4 mr-2" />}
              {voiceMode ? "Voice On" : "Voice Off"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Skill Gaps Sidebar */}
          <div className="md:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Focus Areas
                </CardTitle>
                <CardDescription>Skills being assessed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {skillGaps.map((gap, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted">
                    <Badge variant="outline" className="mb-2">
                      Gap {idx + 1}
                    </Badge>
                    <p className="font-semibold text-sm">{gap.skill}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gap.importance}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-3">
            <Card className="h-[calc(100vh-12rem)]">
              <CardContent className="p-6 flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {message.content.split("\n").map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isStreaming && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={
                      voiceMode
                        ? isListening
                          ? "Listening..."
                          : "Click microphone or type your answer..."
                        : "Type your answer..."
                    }
                    className="min-h-[100px]"
                    disabled={isStreaming}
                  />
                  <div className="flex flex-col gap-2">
                    {voiceMode && (
                      <Button
                        onClick={isListening ? stopListening : startListening}
                        disabled={isStreaming}
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isStreaming}
                      size="icon"
                    >
                      {isStreaming ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveInterview;
