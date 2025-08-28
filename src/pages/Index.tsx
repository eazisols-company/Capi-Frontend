import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <div className="inline-flex items-center gap-2 p-4 rounded-xl bg-[#552bd6]/10 border border-[#552bd6]/20 animate-glow">
          <TrendingUp className="h-12 w-12 text-[#552bd6]" />
          <span className="text-4xl font-bold text-[#552bd6]">TrackiTerra</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Meta CAPI Tracking Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced conversion tracking and lead management for Meta advertising campaigns
          </p>
        </div>
        <div className="space-y-4">
          <Button 
            onClick={() => navigate("/auth")}
            className="interactive-button bg-[#552bd6] hover:bg-[#552bd6]/90 text-white px-8 py-3 text-lg"
          >
            Access Dashboard
          </Button>
          <p className="text-sm text-muted-foreground">
            Single user platform • Advanced analytics • Real-time tracking
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
