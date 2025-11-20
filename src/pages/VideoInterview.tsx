import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, LogOut, Video, StopCircle, Play, Upload, ArrowRight, Camera, Mic, RotateCcw, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const COMMON_QUESTIONS = [
  "Tell me about yourself and your background.",
  "Why do you want to work for our company?",
  "Describe a challenging project you worked on.",
  "What are your greatest strengths and weaknesses?",
  "Where do you see yourself in five years?",
  "Tell me about a time you worked in a team.",
  "How do you handle stress and pressure?",
  "Describe a time you failed and what you learned.",
];

const VideoInterview = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    checkAuth();
    const randomQuestion = COMMON_QUESTIONS[Math.floor(Math.random() * COMMON_QUESTIONS.length)];
    setCurrentQuestion(randomQuestion);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsPreviewing(true);
      toast.success("Camera and microphone connected");
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera and microphone");
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = URL.createObjectURL(blob);
      }
      toast.success("Recording saved! Review or re-record.");
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    toast.info("Recording started");
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const uploadAndAnalyze = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const fileName = `${session.user.id}/${Date.now()}.webm`;

      toast.info("Uploading video...");
      const { error: uploadError } = await supabase.storage
        .from('interview-videos')
        .upload(fileName, recordedBlob, {
          contentType: 'video/webm'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('interview-videos')
        .getPublicUrl(fileName);

      const { data: sessionData, error: sessionError } = await supabase
        .from('video_interview_sessions')
        .insert({
          user_id: session.user.id,
          question: currentQuestion,
          video_url: publicUrl,
          duration_seconds: recordingTime,
          status: 'uploaded'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setIsUploading(false);
      setIsAnalyzing(true);
      toast.info("Analyzing your interview...");

      const { error: functionError } = await supabase.functions.invoke('analyze-video-interview', {
        body: { sessionId: sessionData.id }
      });

      if (functionError) throw functionError;

      toast.success("Analysis complete!");
      navigate(`/video-interview-results?sessionId=${sessionData.id}`);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload and analyze");
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  const retake = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    if (videoRef.current) {
      videoRef.current.src = "";
    }
    startCamera();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Video Interview Practice</h1>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Video className="w-6 h-6 text-primary" />
                    Interview Recording
                  </CardTitle>
                  {isRecording && (
                    <Badge variant="destructive" className="animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-white mr-2" />
                      Recording
                    </Badge>
                  )}
                </div>
                {isRecording && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Recording Time</span>
                      <span className="font-mono font-bold text-foreground">{formatTime(recordingTime)}</span>
                    </div>
                    <Progress value={(recordingTime / 180) * 100} className="h-2" />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isRecording}
                    controls={recordedBlob !== null}
                    className="w-full h-full object-cover"
                  />
                  {!isPreviewing && !recordedBlob && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <div className="text-center">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg text-muted-foreground">Camera Preview</p>
                        <p className="text-sm text-muted-foreground">Click "Start Camera" to begin</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="mt-6 flex gap-3 flex-wrap">
                  {!isPreviewing && !recordedBlob && (
                    <Button onClick={startCamera} size="lg" className="flex-1">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  )}
                  
                  {isPreviewing && !isRecording && !recordedBlob && (
                    <Button onClick={startRecording} size="lg" className="flex-1">
                      <Play className="w-4 h-4 mr-2" />
                      Start Recording
                    </Button>
                  )}
                  
                  {isRecording && (
                    <Button onClick={stopRecording} variant="destructive" size="lg" className="flex-1">
                      <StopCircle className="w-4 h-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                  
                  {recordedBlob && !isUploading && !isAnalyzing && (
                    <>
                      <Button onClick={retake} variant="outline" size="lg" className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retake
                      </Button>
                      <Button onClick={uploadAndAnalyze} size="lg" className="flex-1">
                        <Upload className="w-4 h-4 mr-2" />
                        Submit for Analysis
                      </Button>
                    </>
                  )}
                  
                  {(isUploading || isAnalyzing) && (
                    <Button disabled size="lg" className="flex-1">
                      <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      {isUploading ? "Uploading..." : "Analyzing..."}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Question Card */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Interview Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium leading-relaxed text-foreground">
                  {currentQuestion}
                </p>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Take a moment to think before answering
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Maintain eye contact with the camera
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Speak clearly and at a moderate pace
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use the STAR method (Situation, Task, Action, Result)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">5</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Be authentic and show enthusiasm
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* History Button */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/video-practice-history")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Practice History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoInterview;
