import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8">
        <div className="inline-flex items-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20 animate-glow">
          <img src="/trackaff_logo_background_removed.png" alt="TrackAff" className="h-12 w-auto" />
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
            className="interactive-button bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
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
