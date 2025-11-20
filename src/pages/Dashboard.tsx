import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, LogOut, TrendingUp, Upload, Play, Target, Users, Award, Clock, Zap, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const sessionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      // Entrance animations
      const tl = gsap.timeline();

      tl.from(heroRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: "power3.out",
        clearProps: "all"
      })
        .from(statsRef.current?.children || [], {
          opacity: 0,
          y: 30,
          stagger: 0.1,
          duration: 0.6,
          ease: "power2.out",
          clearProps: "all"
        }, "-=0.4")
        .from(cardsRef.current?.children || [], {
          opacity: 0,
          scale: 0.9,
          y: 20,
          stagger: 0.08,
          duration: 0.5,
          ease: "back.out(1.2)",
          clearProps: "all"
        }, "-=0.3");

      // Scroll-triggered animation for sessions
      if (sessionsRef.current) {
        gsap.from(sessionsRef.current, {
          scrollTrigger: {
            trigger: sessionsRef.current,
            start: "top 80%",
            end: "top 50%",
            toggleActions: "play none none reverse"
          },
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: "power2.out",
          clearProps: "all"
        });
      }

      // Cleanup function
      return () => {
        tl.kill();
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    }
  }, [loading]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const { data: sessionsData } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setSessions(sessionsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl"></div>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Award, label: "Total Sessions", value: sessions.length, gradient: "from-blue-500 to-cyan-500" },
    { icon: BarChart3, label: "Avg Score", value: "85%", gradient: "from-purple-500 to-pink-500" },
    { icon: Zap, label: "Current Streak", value: "7 days", gradient: "from-orange-500 to-red-500" },
    { icon: Clock, label: "Time Practiced", value: "12h", gradient: "from-green-500 to-emerald-500" }
  ];

  const quickActions = [
    {
      icon: Play,
      title: "Text Interview",
      description: "Practice with AI chat",
      gradient: "from-blue-600 to-cyan-600",
      path: "/interview/new"
    },
    {
      icon: Brain,
      title: "Video Practice",
      description: "Record & get AI feedback",
      gradient: "from-purple-600 to-pink-600",
      path: "/video-interview"
    },
    {
      icon: Upload,
      title: "Upload Resume",
      description: "Get personalized questions",
      gradient: "from-indigo-600 to-blue-600",
      path: "/profile"
    },
    {
      icon: FileText,
      title: "Learning Paths",
      description: "Explore career roadmaps",
      gradient: "from-teal-600 to-cyan-600",
      path: "/learning-paths"
    },
    {
      icon: TrendingUp,
      title: "Job Market",
      description: "AI trends & guidance",
      gradient: "from-orange-600 to-red-600",
      path: "/job-market"
    },
    {
      icon: Target,
      title: "Adaptive Interview",
      description: "Skill gap practice",
      gradient: "from-pink-600 to-rose-600",
      path: "/adaptive-interview"
    },
    {
      icon: Users,
      title: "Peer Interviews",
      description: "Practice with peers",
      gradient: "from-green-600 to-emerald-600",
      path: "/peer-interviews"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Enhanced Header with Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border/50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="w-8 h-8 text-primary relative z-10" />
                <div className="absolute inset-0 bg-primary/20 blur-lg"></div>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Quantum Query
              </h1>
            </div>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/dashboard")} className="hover:bg-primary/10">
                Dashboard
              </Button>
              <Button variant="ghost" onClick={() => navigate("/learning-paths")} className="hover:bg-primary/10">
                Learning Paths
              </Button>
              <Button variant="ghost" onClick={() => navigate("/video-practice")} className="hover:bg-primary/10">
                Video Practice
              </Button>
              <Button variant="ghost" onClick={() => navigate("/job-market")} className="hover:bg-primary/10">
                Job Market
              </Button>
              <Button variant="ghost" onClick={() => navigate("/leaderboard")} className="hover:bg-primary/10">
                Leaderboard
              </Button>
              <Button variant="ghost" onClick={() => navigate("/profile")} className="hover:bg-primary/10">
                Profile
              </Button>
              <div className="h-6 w-px bg-border mx-2"></div>
              <ThemeToggle />
              <Button variant="outline" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div ref={heroRef} className="mb-12 text-center">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            Welcome back, {profile?.full_name || "User"}! 👋
          </h2>
          <p className="text-xl text-muted-foreground">Ready to level up your interview skills?</p>
        </div>

        {/* Stats Section */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-12">
          <h3 className="text-4xl font-bold mb-6">Quick Actions:</h3>
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 hover:border-primary/50"
                  onClick={() => navigate(action.path)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">{action.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Sessions */}
        <div ref={sessionsRef}>
          <Card className="border-2 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-card to-muted/20">
              <CardTitle className="text-2xl">Recent Interview Sessions</CardTitle>
              <CardDescription>Your practice history and progress</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {sessions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-lg text-muted-foreground mb-2">No sessions yet</p>
                  <p className="text-sm text-muted-foreground">Start your first interview practice to see your progress!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="group flex items-center justify-between p-5 border-2 border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {session.interview_type} Interview
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/interview/${session.id}`)}
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        Continue →
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
