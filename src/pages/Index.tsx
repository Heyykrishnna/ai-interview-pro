import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Zap, CheckCircle, ArrowRight, Code, Briefcase, Database, Sparkles, Users, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import Nav from "@/components/nav";
const Index = () => {
  const navigate = useNavigate();
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">{/* Hero Section */}
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.05),transparent_50%),radial-gradient(circle_at_70%_80%,hsl(var(--primary)/0.05),transparent_50%)]"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Interview Preparation
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground leading-tight">
              Elevate Your Interview Skills with AI
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-foreground/80 leading-relaxed">
              The complete AI toolkit to ace interviews and land your dream role. Practice with AI-powered interviews, get instant feedback, and track your progress.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={() => handleNavigate("/auth")} 
                className="h-12 px-8 text-lg"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 px-8 text-lg" 
                onClick={() => handleNavigate("/learning-paths")}
              >
                Explore Learning Paths
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span>Trusted by Top Companies</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Supercharge Your Interview Preparation
            </h2>
            <p className="text-xl text-muted-foreground">Everything you need to succeed in your next interview</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 cursor-pointer group" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">AI-Powered Feedback</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get instant, actionable insights on your interview performance with advanced AI analysis of your responses, body language, and communication style.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 cursor-pointer group" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Video Practice</h3>
              <p className="text-muted-foreground leading-relaxed">
                Record your responses to common interview questions and get detailed feedback on delivery, confidence, and body language.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 cursor-pointer group" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Role-Specific Practice</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tailored interview questions and scenarios for your specific role, from software engineering to product management.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 cursor-pointer group" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Progress Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monitor your improvement over time with detailed analytics and personalized recommendations for skill development.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 cursor-pointer group" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Peer Interviews</h3>
              <p className="text-muted-foreground leading-relaxed">
                Practice with peers in real-time video sessions, give and receive feedback, and learn from each other's experiences.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 cursor-pointer group" onClick={() => handleNavigate("/auth")}>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Job Market Insights</h3>
              <p className="text-muted-foreground leading-relaxed">
                Stay updated with trending skills, salary ranges, and company-specific interview patterns to give you a competitive edge.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Job Profiles Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Get Ready for Jobs at Leading Firms
            </h2>
            <p className="text-xl text-muted-foreground">
              Explore what you need to learn for your dream role and practice with realistic simulations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 group" onClick={() => handleNavigate("/learning-paths")}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Code className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Software Developer</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Data Structures & Algorithms</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>System Design</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Programming Languages</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 group" onClick={() => handleNavigate("/learning-paths")}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Data Scientist</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Machine Learning</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Statistics & Probability</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Python & R</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 group" onClick={() => handleNavigate("/learning-paths")}>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Product Manager</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Product Strategy</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>User Research</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/80">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Business Analysis</span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => handleNavigate("/learning-paths")}>
              View All Learning Paths
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl mb-10 text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands of professionals who have successfully landed their dream jobs with our AI-powered platform
          </p>
          <Button 
            size="lg" 
            onClick={() => handleNavigate("/auth")} 
            variant="secondary"
            className="shadow-xl hover:shadow-2xl transition-all h-12 px-8 text-lg"
          >
            Start Practicing Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">&copy; 2024 InterviewAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;