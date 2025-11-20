import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, Clock, Target, Plus, Loader2, Sparkles, UserPlus, Search, TrendingUp, Award, Brain } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java",
  "System Design", "Data Structures", "Algorithms", "SQL", "NoSQL",
  "AWS", "Docker", "Kubernetes", "CI/CD", "Git",
  "REST APIs", "GraphQL", "Microservices", "Testing", "Agile"
];

const PeerInterviews = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [mySessions, setMySessions] = useState<any[]>([]);
  const [matchedPeers, setMatchedPeers] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [peerProfile, setPeerProfile] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    skills: [] as string[],
    experienceLevel: "intermediate",
    preferredTopics: [] as string[],
    bio: "",
    isActive: true
  });
  const [newSkill, setNewSkill] = useState("");
  const [newTopic, setNewTopic] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await Promise.all([
      loadSessions(user.id),
      loadPeerProfile(user.id)
    ]);
  };

  const loadPeerProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("peer_learning_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setPeerProfile(data);
        setProfileForm({
          skills: Array.isArray(data.skills) ? data.skills as string[] : [],
          experienceLevel: data.experience_level || "intermediate",
          preferredTopics: Array.isArray(data.preferred_topics) ? data.preferred_topics as string[] : [],
          bio: data.bio || "",
          isActive: data.is_active ?? true
        });
      }
    } catch (error) {
      console.error("Error loading peer profile:", error);
    }
  };

  const loadSessions = async (userId: string) => {
    try {
      // Load available sessions (not joined yet)
      const { data: available } = await supabase
        .from("peer_interview_sessions")
        .select(`
          *,
          profiles:host_user_id (full_name)
        `)
        .eq("status", "scheduled")
        .is("guest_user_id", null)
        .neq("host_user_id", userId)
        .order("scheduled_at", { ascending: true });

      // Load my sessions (hosting or joined)
      const { data: mine } = await supabase
        .from("peer_interview_sessions")
        .select(`
          *,
          host_profile:host_user_id (full_name),
          guest_profile:guest_user_id (full_name)
        `)
        .or(`host_user_id.eq.${userId},guest_user_id.eq.${userId}`)
        .order("scheduled_at", { ascending: true });

      setAvailableSessions(available || []);
      setMySessions(mine || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const savePeerProfile = async () => {
    try {
      const profileData = {
        user_id: userId,
        skills: profileForm.skills,
        experience_level: profileForm.experienceLevel,
        preferred_topics: profileForm.preferredTopics,
        bio: profileForm.bio,
        is_active: profileForm.isActive,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("peer_learning_profiles")
        .upsert(profileData);

      if (error) throw error;

      toast.success("Peer learning profile saved!");
      await loadPeerProfile(userId);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error?.message || "Failed to save profile. Please ensure the database tables are created.");
    }
  };

  const findMatches = async () => {
    if (!peerProfile || profileForm.skills.length === 0) {
      toast.error("Please create a peer profile with skills first");
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-peer-matches", {
        body: {
          requesterId: userId,
          skills: profileForm.skills,
          experienceLevel: profileForm.experienceLevel
        }
      });

      if (error) throw error;

      setMatchedPeers(data.matches || []);
      toast.success(`Found ${data.matches?.length || 0} matching peers!`);
    } catch (error) {
      console.error("Error finding matches:", error);
      toast.error("Failed to find matches");
    } finally {
      setSearching(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("peer_interview_sessions")
        .update({ guest_user_id: userId })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Successfully joined session!");
      loadSessions(userId);
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to join session");
    }
  };

  const cancelSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("peer_interview_sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session cancelled");
      loadSessions(userId);
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast.error("Failed to cancel session");
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !profileForm.skills.includes(skill)) {
      setProfileForm({ ...profileForm, skills: [...profileForm.skills, skill] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfileForm({
      ...profileForm,
      skills: profileForm.skills.filter(s => s !== skill)
    });
  };

  const addTopic = () => {
    if (newTopic && !profileForm.preferredTopics.includes(newTopic)) {
      setProfileForm({
        ...profileForm,
        preferredTopics: [...profileForm.preferredTopics, newTopic]
      });
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    setProfileForm({
      ...profileForm,
      preferredTopics: profileForm.preferredTopics.filter(t => t !== topic)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <div className="absolute inset-0 bg-primary/5 blur-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/80 border-b border-border/50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Users className="h-8 w-8 text-primary relative z-10" />
                <div className="absolute inset-0 bg-primary/20 blur-lg"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Peer Learning Network
                </h1>
                <p className="text-sm text-muted-foreground">Practice together, grow together</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => navigate("/peer-interviews/create")} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Session
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue={peerProfile ? "available" : "profile"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur">
            <TabsTrigger value="profile" className="gap-2">
              <UserPlus className="h-4 w-4" />
              My Profile
            </TabsTrigger>
            <TabsTrigger value="matches" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Find Matches
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <Search className="h-4 w-4" />
              Browse Sessions
            </TabsTrigger>
            <TabsTrigger value="my-sessions" className="gap-2">
              <Target className="h-4 w-4" />
              My Sessions
            </TabsTrigger>
          </TabsList>

          {/* Peer Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-2 shadow-xl bg-gradient-to-br from-card via-card to-primary/5">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Brain className="h-6 w-6 text-primary" />
                  Peer Learning Profile
                </CardTitle>
                <CardDescription className="text-base">
                  Create your profile to get matched with peers who share your learning goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Skills Section */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Skills to Practice</Label>
                  <div className="flex gap-2">
                    <Select value={newSkill} onValueChange={(value) => addSkill(value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SKILLS.filter(s => !profileForm.skills.includes(s)).map(skill => (
                          <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or type custom skill"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSkill(newSkill)}
                      className="flex-1"
                    />
                    <Button onClick={() => addSkill(newSkill)} disabled={!newSkill}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.skills.map(skill => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
                        onClick={() => removeSkill(skill)}
                      >
                        {skill} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Experience Level</Label>
                  <Select
                    value={profileForm.experienceLevel}
                    onValueChange={(value) => setProfileForm({ ...profileForm, experienceLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferred Topics */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Preferred Interview Topics</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., System Design, Behavioral, Coding"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTopic()}
                    />
                    <Button onClick={addTopic} disabled={!newTopic}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.preferredTopics.map(topic => (
                      <Badge
                        key={topic}
                        variant="outline"
                        className="px-3 py-1 cursor-pointer hover:bg-destructive/20"
                        onClick={() => removeTopic(topic)}
                      >
                        {topic} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Bio (Optional)</Label>
                  <Textarea
                    placeholder="Tell others about your learning goals and what you're looking for in a peer..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    rows={4}
                  />
                </div>

                <Button onClick={savePeerProfile} className="w-full gap-2" size="lg">
                  <Award className="h-5 w-5" />
                  {peerProfile ? "Update Profile" : "Create Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Find Matches Tab */}
          <TabsContent value="matches" className="space-y-6">
            <Card className="border-2 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-primary" />
                      AI-Powered Peer Matching
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Find peers with matching skills and learning goals
                    </CardDescription>
                  </div>
                  <Button onClick={findMatches} disabled={searching || !peerProfile} className="gap-2">
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    Find Matches
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!peerProfile ? (
                  <div className="text-center py-12">
                    <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Create Your Profile First</h3>
                    <p className="text-muted-foreground mb-4">
                      Set up your peer learning profile to start finding matches
                    </p>
                  </div>
                ) : matchedPeers.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Matches Yet</h3>
                    <p className="text-muted-foreground">
                      Click "Find Matches" to discover peers with similar skills
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchedPeers.map((peer, idx) => (
                      <Card key={idx} className="border-2 hover:border-primary/50 transition-all">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{peer.fullName}</CardTitle>
                              <CardDescription>{peer.experienceLevel}</CardDescription>
                            </div>
                            <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
                              {peer.matchScore}% Match
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {peer.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{peer.bio}</p>
                          )}
                          <div>
                            <p className="text-sm font-semibold mb-2">Matching Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {peer.matchedSkills.map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button className="w-full" size="sm">
                            Send Session Request
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Sessions Tab - Keep existing implementation but enhance */}
          <TabsContent value="available" className="space-y-4">
            {availableSessions.length === 0 ? (
              <Card className="border-2">
                <CardContent className="py-16 text-center">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Available Sessions</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to create a session or use AI matching to find peers
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => navigate("/peer-interviews/create")}>
                      Create Session
                    </Button>
                    <Button variant="outline" onClick={findMatches}>
                      Find Matches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableSessions.map((session) => (
                  <Card key={session.id} className="border-2 hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{session.topic}</CardTitle>
                          <CardDescription>
                            Host: {session.profiles?.full_name || "Anonymous"}
                          </CardDescription>
                        </div>
                        <Badge variant={
                          session.difficulty_level === "advanced" ? "destructive" :
                            session.difficulty_level === "intermediate" ? "default" : "secondary"
                        }>
                          {session.difficulty_level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Array.isArray(session.required_skills) && session.required_skills.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold mb-2">Required Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {(session.required_skills as string[]).map((skill: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(session.scheduled_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {session.duration_minutes} minutes
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => joinSession(session.id)}
                      >
                        Join Session
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Sessions Tab - Keep existing but enhance styling */}
          <TabsContent value="my-sessions" className="space-y-4">
            {mySessions.length === 0 ? (
              <Card className="border-2">
                <CardContent className="py-16 text-center">
                  <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Sessions Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create or join a session to start practicing
                  </p>
                  <Button onClick={() => navigate("/peer-interviews/create")}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {mySessions.map((session) => {
                  const isHost = session.host_user_id === userId;
                  const partnerName = isHost
                    ? session.guest_profile?.full_name || "Waiting for partner"
                    : session.host_profile?.full_name || "Host";

                  return (
                    <Card key={session.id} className="border-2 hover:border-primary/50 transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{session.topic}</CardTitle>
                            <CardDescription>
                              {isHost ? "Hosting" : "Participating"} • {partnerName}
                            </CardDescription>
                          </div>
                          <Badge variant={
                            session.status === "completed" ? "default" :
                              session.status === "cancelled" ? "destructive" : "secondary"
                          }>
                            {session.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(session.scheduled_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {session.duration_minutes} minutes
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {session.status === "scheduled" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/peer-interviews/session/${session.id}`)}
                                className="flex-1"
                              >
                                {isHost ? "Start Session" : "Join Session"}
                              </Button>
                              {isHost && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => cancelSession(session.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </>
                          )}
                          {session.status === "completed" && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/peer-interviews/rate/${session.id}`)}
                              className="flex-1"
                            >
                              Rate Partner
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PeerInterviews;
