import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, Users, Target, Award, Calendar, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [videoSessions, setVideoSessions] = useState<any[]>([]);
  const [peerSessions, setPeerSessions] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    improvement: 0,
    rank: 0,
    percentile: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await loadAnalyticsData(session.user.id);
  };

  const loadAnalyticsData = async (userId: string) => {
    try {
      // Load video interview sessions
      const { data: videoData, error: videoError } = await supabase
        .from("video_interview_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("created_at", { ascending: true });

      if (videoError) throw videoError;

      // Load peer interview ratings
      const { data: peerData, error: peerError } = await supabase
        .from("peer_interview_ratings")
        .select("*")
        .eq("rated_user_id", userId)
        .order("created_at", { ascending: true });

      if (peerError) throw peerError;

      setVideoSessions(videoData || []);
      setPeerSessions(peerData || []);

      // Calculate user stats
      const totalSessions = (videoData?.length || 0) + (peerData?.length || 0);
      const videoAvg = videoData?.reduce((sum, s) => sum + (s.overall_score || 0), 0) / (videoData?.length || 1) || 0;
      const peerAvg = peerData?.reduce((sum, s) => sum + (s.overall_score || 0), 0) / (peerData?.length || 1) || 0;
      const averageScore = totalSessions > 0 ? ((videoAvg + peerAvg) / 2) : 0;

      // Calculate improvement
      const allScores = [...(videoData || []).map(s => s.overall_score), ...(peerData || []).map(s => s.overall_score)].filter(s => s);
      const improvement = allScores.length > 1 ? allScores[allScores.length - 1] - allScores[0] : 0;

      // Get global stats for ranking
      const { data: allUsers, error: rankError } = await supabase
        .from("video_interview_sessions")
        .select("user_id, overall_score");

      let rank = 0;
      let percentile = 0;
      if (allUsers && !rankError) {
        const userAverages = allUsers.reduce((acc: any, session: any) => {
          if (!acc[session.user_id]) acc[session.user_id] = [];
          if (session.overall_score) acc[session.user_id].push(session.overall_score);
          return acc;
        }, {});

        const rankings = Object.entries(userAverages)
          .map(([uid, scores]: [string, any]) => ({
            userId: uid,
            avgScore: scores.reduce((a: number, b: number) => a + b, 0) / scores.length
          }))
          .sort((a, b) => b.avgScore - a.avgScore);

        rank = rankings.findIndex(r => r.userId === userId) + 1;
        percentile = ((rankings.length - rank) / rankings.length) * 100;
      }

      setUserStats({ totalSessions, averageScore, improvement, rank, percentile });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const performanceTrendData = videoSessions.map((session, index) => ({
    session: `S${index + 1}`,
    date: new Date(session.created_at).toLocaleDateString(),
    overall: session.overall_score || 0,
    delivery: session.delivery_score || 0,
    bodyLanguage: session.body_language_score || 0,
    confidence: session.confidence_score || 0
  }));

  const skillRadarData = [
    {
      skill: "Delivery",
      score: videoSessions.length > 0 
        ? videoSessions.reduce((sum, s) => sum + (s.delivery_score || 0), 0) / videoSessions.length 
        : 0,
      fullMark: 100
    },
    {
      skill: "Body Language",
      score: videoSessions.length > 0
        ? videoSessions.reduce((sum, s) => sum + (s.body_language_score || 0), 0) / videoSessions.length
        : 0,
      fullMark: 100
    },
    {
      skill: "Confidence",
      score: videoSessions.length > 0
        ? videoSessions.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / videoSessions.length
        : 0,
      fullMark: 100
    },
    {
      skill: "Communication",
      score: peerSessions.length > 0
        ? peerSessions.reduce((sum, s) => sum + (s.communication_score || 0), 0) / peerSessions.length
        : 0,
      fullMark: 10
    },
    {
      skill: "Technical",
      score: peerSessions.length > 0
        ? peerSessions.reduce((sum, s) => sum + (s.technical_score || 0), 0) / peerSessions.length
        : 0,
      fullMark: 10
    }
  ];

  const comparisonData = [
    {
      metric: "Overall Score",
      you: userStats.averageScore,
      average: 65,
      top10: 85
    },
    {
      metric: "Sessions",
      you: userStats.totalSessions,
      average: 8,
      top10: 20
    },
    {
      metric: "Improvement",
      you: userStats.improvement,
      average: 5,
      top10: 15
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Performance Analytics
          </h1>
          <p className="text-muted-foreground">
            Deep insights into your interview preparation journey
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.totalSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all interview types
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userStats.averageScore.toFixed(1)}</div>
              <Progress value={userStats.averageScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Improvement</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {userStats.improvement > 0 ? '+' : ''}{userStats.improvement.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Since first session
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Global Rank</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">#{userStats.rank || 'N/A'}</div>
              <Badge variant="secondary" className="mt-2">
                Top {userStats.percentile.toFixed(0)}%
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
          </TabsList>

          {/* Performance Trends */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Overall Performance Trend
                </CardTitle>
                <CardDescription>
                  Track your score progression across all sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    overall: { label: "Overall Score", color: "hsl(var(--primary))" }
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceTrendData}>
                      <defs>
                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="session" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="overall"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorOverall)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Metrics Breakdown</CardTitle>
                <CardDescription>
                  See how each skill evolved over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    delivery: { label: "Delivery", color: "hsl(var(--chart-1))" },
                    bodyLanguage: { label: "Body Language", color: "hsl(var(--chart-2))" },
                    confidence: { label: "Confidence", color: "hsl(var(--chart-3))" }
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="session" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="delivery"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--chart-1))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bodyLanguage"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--chart-2))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--chart-3))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills Analysis */}
          <TabsContent value="skills" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Skills Radar</CardTitle>
                  <CardDescription>
                    Your comprehensive skill assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      score: { label: "Score", color: "hsl(var(--primary))" }
                    }}
                    className="h-[350px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={skillRadarData}>
                        <PolarGrid className="stroke-muted" />
                        <PolarAngleAxis dataKey="skill" className="text-xs" />
                        <PolarRadiusAxis className="text-xs" />
                        <Radar
                          name="Your Score"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Scores</CardTitle>
                  <CardDescription>
                    Average performance by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {skillRadarData.map((skill) => {
                    const percentage = (skill.score / skill.fullMark) * 100;
                    return (
                      <div key={skill.skill}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{skill.skill}</span>
                          <span className="text-sm text-muted-foreground">
                            {skill.score.toFixed(1)}/{skill.fullMark}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison */}
          <TabsContent value="compare" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  How You Compare
                </CardTitle>
                <CardDescription>
                  Your performance vs. community averages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    you: { label: "You", color: "hsl(var(--primary))" },
                    average: { label: "Average User", color: "hsl(var(--chart-2))" },
                    top10: { label: "Top 10%", color: "hsl(var(--chart-3))" }
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="metric" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="you" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="average" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="top10" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      #{userStats.rank || 'N/A'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Out of all active users
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Percentile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {userStats.percentile.toFixed(0)}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Better than average
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Growth Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {userStats.improvement > 0 ? '+' : ''}{userStats.improvement.toFixed(0)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Points improvement
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
