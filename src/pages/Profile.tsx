import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, LogOut, Upload, FileText, TrendingUp, Target, Award, Calendar, BookOpen, Code, Sparkles, BarChart3, Play, Users } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    linkedin_url: "",
    github_url: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    completedSessions: 0,
    averageScore: 0,
    peerSessions: 0,
    videoInterviews: 0,
    averageVideoScore: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [skillGaps, setSkillGaps] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadProfile();
    loadStats();
    loadRecentActivity();
    loadSkillGaps();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          linkedin_url: profileData.linkedin_url || "",
          github_url: profileData.github_url || "",
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get interview sessions stats
      const { data: sessions } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id);

      // Get video interview stats
      const { data: videoSessions } = await supabase
        .from("video_interview_sessions")
        .select("overall_score")
        .eq("user_id", user.id)
        .not("overall_score", "is", null);

      // Get peer sessions stats
      const { data: peerSessions } = await supabase
        .from("peer_interview_sessions")
        .select("*")
        .or(`host_user_id.eq.${user.id},guest_user_id.eq.${user.id}`);

      const totalInterviews = (sessions?.length || 0) + (videoSessions?.length || 0);
      const completedSessions = sessions?.filter(s => s.status === "completed").length || 0;
      const avgScore = videoSessions?.length
        ? videoSessions.reduce((acc, s) => acc + s.overall_score, 0) / videoSessions.length
        : 0;

      setStats({
        totalInterviews,
        completedSessions,
        averageScore: Math.round(avgScore),
        peerSessions: peerSessions?.length || 0,
        videoInterviews: videoSessions?.length || 0,
        averageVideoScore: Math.round(avgScore),
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sessions } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentActivity(sessions || []);
    } catch (error) {
      console.error("Error loading recent activity:", error);
    }
  };

  const loadSkillGaps = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: recommendations } = await supabase
        .from("user_career_recommendations")
        .select("skill_gaps")
        .eq("user_id", user.id)
        .single();

      if (recommendations?.skill_gaps) {
        setSkillGaps(recommendations.skill_gaps as any[] || []);
      }
    } catch (error) {
      console.error("Error loading skill gaps:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      loadProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      toast.error("Please select a file first");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = resumeFile.name.split(".").pop();
      const fileName = `${user.id}/resume.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, resumeFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Resume uploaded successfully!");
      loadProfile();
      setResumeFile(null);
    } catch (error: any) {
      console.error("Error uploading resume:", error);
      const errorMessage = error?.message || "Failed to upload resume";

      // Provide helpful error messages
      if (errorMessage.includes("Bucket not found")) {
        toast.error("Storage bucket not configured. Please contact support or check setup guide.");
      } else if (errorMessage.includes("row-level security")) {
        toast.error("Permission denied. Please ensure you're logged in.");
      } else if (errorMessage.includes("size")) {
        toast.error("File too large. Please upload a file smaller than 5MB.");
      } else {
        toast.error(`Upload failed: ${errorMessage}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Brain className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Total Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.totalInterviews}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.completedSessions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Avg Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.averageScore}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Peer Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.peerSessions}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="skills">Skills Progress</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_url">GitHub URL</Label>
                  <Input
                    id="github_url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    placeholder="https://github.com/yourusername"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <div className="space-y-6">
              {/* Skills Overview Header */}
              <Card className="border-2 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Skills Progress Dashboard
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        Track your skill development journey and close knowledge gaps
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => navigate("/learning-paths")}
                      >
                        <BookOpen className="h-4 w-4" />
                        Resources
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-primary to-primary/80"
                        onClick={() => navigate("/job-market")}
                      >
                        <Target className="h-4 w-4" />
                        Set Goals
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Critical Performance Insights */}
              {stats.videoInterviews > 0 && stats.averageVideoScore < 60 && (
                <Card className="border-2 border-destructive/50 shadow-xl bg-gradient-to-br from-destructive/5 via-card to-destructive/10">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl text-destructive flex items-center gap-2 mb-2">
                          ⚠️ CRITICAL: Performance Analysis
                        </CardTitle>
                        <CardDescription className="text-base">
                          Your interview performance needs immediate attention
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg">
                      <p className="text-foreground font-semibold mb-2">
                        📊 Key Findings:
                      </p>
                      <ul className="space-y-2 text-sm text-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-destructive font-bold mt-0.5">•</span>
                          <span>
                            Your <strong>average video score of {stats.averageVideoScore}</strong> across{" "}
                            <strong>{stats.videoInterviews} video interview{stats.videoInterviews > 1 ? 's' : ''}</strong> is the{" "}
                            <strong className="text-destructive">single biggest blocker</strong> in your job search.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-destructive font-bold mt-0.5">•</span>
                          <span>
                            You have completed <strong>{stats.totalInterviews} interviews</strong>, indicating your{" "}
                            <strong>resume gets you in the door</strong>, but you are{" "}
                            <strong className="text-destructive">failing to convert</strong>.
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-destructive font-bold mt-0.5">•</span>
                          <span>
                            Improving your <strong>interview performance skills</strong> should be your{" "}
                            <strong className="text-destructive">top priority</strong>.
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-lg">
                      <p className="text-foreground font-semibold mb-2">
                        💡 Recommended Actions:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                          className="gap-2 justify-start h-auto py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                          onClick={() => navigate("/video-practice")}
                        >
                          <Play className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-semibold">Video Practice</div>
                            <div className="text-xs opacity-90">Record & get AI feedback</div>
                          </div>
                        </Button>
                        <Button
                          className="gap-2 justify-start h-auto py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          onClick={() => navigate("/interview/new")}
                        >
                          <Brain className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-semibold">AI Mock Interview</div>
                            <div className="text-xs opacity-90">Practice with AI coach</div>
                          </div>
                        </Button>
                        <Button
                          className="gap-2 justify-start h-auto py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          onClick={() => navigate("/peer-interviews")}
                        >
                          <Users className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-semibold">Peer Practice</div>
                            <div className="text-xs opacity-90">Practice with real people</div>
                          </div>
                        </Button>
                        <Button
                          className="gap-2 justify-start h-auto py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                          onClick={() => navigate("/adaptive-interview")}
                        >
                          <Target className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-semibold">Adaptive Training</div>
                            <div className="text-xs opacity-90">Focus on weak areas</div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {skillGaps.length === 0 ? (
                <Card className="border-2">
                  <CardContent className="py-16">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                        <Target className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">No Skills Data Yet</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Complete a career guidance assessment to discover your personalized skill development plan and start tracking your progress.
                      </p>
                      <Button onClick={() => navigate("/job-market")} className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Start Assessment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Skills Overview Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Radar Chart - Skills Overview */}
                    <Card className="border-2 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Skills Overview
                        </CardTitle>
                        <CardDescription>Your current skill proficiency levels</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={skillGaps.slice(0, 6).map((gap: any) => ({
                            skill: gap.skill?.substring(0, 15) || 'Unknown',
                            proficiency: Math.random() * 60 + 20,
                            target: 85
                          }))}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis
                              dataKey="skill"
                              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                            />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Radar
                              name="Current"
                              dataKey="proficiency"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.6}
                            />
                            <Radar
                              name="Target"
                              dataKey="target"
                              stroke="hsl(var(--chart-2))"
                              fill="hsl(var(--chart-2))"
                              fillOpacity={0.2}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Bar Chart - Progress Comparison */}
                    <Card className="border-2 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-foreground">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Progress Tracking
                        </CardTitle>
                        <CardDescription>Skill development over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={skillGaps.slice(0, 5).map((gap: any, idx: number) => ({
                            skill: gap.skill?.substring(0, 12) || 'Skill',
                            current: Math.random() * 60 + 20,
                            lastMonth: Math.random() * 50 + 15,
                            target: 85
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis
                              dataKey="skill"
                              tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                            />
                            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Legend />
                            <Bar dataKey="lastMonth" fill="hsl(var(--muted))" name="Last Month" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="current" fill="hsl(var(--primary))" name="Current" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="target" fill="hsl(var(--chart-2))" name="Target" radius={[4, 4, 0, 0]} opacity={0.3} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Skills List */}
                  <Card className="border-2 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Code className="h-5 w-5 text-primary" />
                        Skill Development Plan
                      </CardTitle>
                      <CardDescription>Detailed breakdown of your learning path</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        {skillGaps.map((gap: any, index: number) => {
                          const progressValue = Math.random() * 60 + 20;
                          const gradients = [
                            'from-blue-500 to-cyan-500',
                            'from-purple-500 to-pink-500',
                            'from-orange-500 to-red-500',
                            'from-green-500 to-emerald-500',
                            'from-indigo-500 to-blue-500',
                            'from-pink-500 to-rose-500'
                          ];
                          const gradient = gradients[index % gradients.length];

                          return (
                            <div
                              key={index}
                              className="group relative overflow-hidden p-6 border-2 border-border rounded-xl hover:border-primary/50 transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-card to-muted/20"
                            >
                              {/* Gradient Accent */}
                              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${gradient}`}></div>

                              <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                      <Code className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                        {gap.skill}
                                      </h4>
                                      {gap.learning_resource && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                          {gap.learning_resource}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={gap.importance === 'High' ? 'destructive' : gap.importance === 'Medium' ? 'default' : 'secondary'}
                                    className="shrink-0"
                                  >
                                    {gap.importance || 'Medium'} Priority
                                  </Badge>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground font-medium">Progress</span>
                                    <span className="font-bold text-foreground">{Math.round(progressValue)}%</span>
                                  </div>
                                  <div className="relative">
                                    <Progress value={progressValue} className="h-3" />
                                    <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 rounded-full`}></div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                    onClick={() => navigate("/learning-paths")}
                                  >
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Learn
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                    onClick={() => navigate("/video-practice")}
                                  >
                                    <Target className="h-4 w-4 mr-2" />
                                    Practice
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                                    onClick={() => toast.success(`Keep up the great work on ${gap.skill}!`)}
                                  >
                                    <Award className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest interview sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No recent activity. Start your first interview to see your progress here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-semibold text-foreground">{activity.interview_type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resume">
            <Card>
              <CardHeader>
                <CardTitle>Resume Management</CardTitle>
                <CardDescription>Upload and manage your resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.resume_url && (
                  <div className="p-4 border border-border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">Current Resume</p>
                          <p className="text-sm text-muted-foreground">Uploaded successfully</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(profile.resume_url, "_blank")}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="resume">Upload New Resume</Label>
                  <div className="flex gap-2">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleResumeUpload}
                      disabled={!resumeFile || saving}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {saving ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
