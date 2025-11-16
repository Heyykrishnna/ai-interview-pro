import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Zap, CheckCircle, ArrowRight, Code, Briefcase, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Master Your Interview Skills with AI
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Practice with AI-powered interviews, get instant feedback, and track your progress
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" onClick={() => navigate("/auth")} className="bg-white text-primary hover:bg-white/90">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate("/learning-paths")}>
                Explore Learning Paths
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose AI Interview Pro?</h2>
            <p className="text-xl text-muted-foreground">Everything you need to ace your next interview</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 hover:shadow-medium transition-all">
              <div className="w-14 h-14 rounded-lg bg-gradient-hero flex items-center justify-center mb-4">
                <Brain className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Feedback</h3>
              <p className="text-muted-foreground">
                Get detailed, constructive feedback on every answer with model responses to learn from
              </p>
            </Card>

            <Card className="p-6 hover:shadow-medium transition-all">
              <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Role-Specific Practice</h3>
              <p className="text-muted-foreground">
                Practice interviews tailored to your target role and industry
              </p>
            </Card>

            <Card className="p-6 hover:shadow-medium transition-all">
              <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center mb-4">
                <Zap className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Resume Analysis</h3>
              <p className="text-muted-foreground">
                Upload your resume for personalized interview questions based on your experience
              </p>
            </Card>

            <Card className="p-6 hover:shadow-medium transition-all">
              <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center mb-4">
                <TrendingUp className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your improvement over time with detailed session history
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Job Profiles Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Popular Career Paths</h2>
            <p className="text-xl text-muted-foreground">Explore what you need to learn for your dream role</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 hover:shadow-medium transition-all cursor-pointer" onClick={() => navigate("/learning-paths")}>
              <div className="w-14 h-14 rounded-lg bg-gradient-hero flex items-center justify-center mb-4">
                <Code className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Software Developer</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Data Structures & Algorithms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  System Design
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Programming Languages
                </li>
              </ul>
            </Card>

            <Card className="p-6 hover:shadow-medium transition-all cursor-pointer" onClick={() => navigate("/learning-paths")}>
              <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Database className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Data Scientist</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  Machine Learning
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  Statistics & Probability
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  Python & R
                </li>
              </ul>
            </Card>

            <Card className="p-6 hover:shadow-medium transition-all cursor-pointer" onClick={() => navigate("/learning-paths")}>
              <div className="w-14 h-14 rounded-lg bg-accent flex items-center justify-center mb-4">
                <Briefcase className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Product Manager</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Product Strategy
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  User Research
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  Roadmap Planning
                </li>
              </ul>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate("/learning-paths")}>
              View All Learning Paths
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-hero text-primary-foreground p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Start Practicing?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands preparing for their dream jobs</p>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90" onClick={() => navigate("/auth")}>
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 AI Interview Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
