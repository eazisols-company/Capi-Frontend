import { useState, useRef, useEffect } from "react";
import { Mail, MessageCircle, Headphones  } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CustomerSupportCardProps {
  collapsed?: boolean;
}

export function CustomerSupportCard({ collapsed = false }: CustomerSupportCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleEmailSupport = () => {
    window.open("mailto:support@trackaff.com", "_blank");
    setIsExpanded(false);
  };

  const handleTelegramSupport = () => {
    window.open("https://t.me/trackaff_support", "_blank");
    setIsExpanded(false);
  };

  const handleCustomerSupportClick = () => {
    setIsExpanded(true);
  };

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // Don't show the card when sidebar is collapsed
  if (collapsed) {
    return null;
  }

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div 
        ref={cardRef}
        className="bg-card border border-border rounded-lg p-4 transition-all duration-300 ease-in-out"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Headphones   className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Need help?
            </h3>
            <p className="text-xs text-muted-foreground">
              Check out the support page
            </p>
          </div>
        </div>
        
        {/* Customer Support Button or Support Options */}
        <div className="mt-4">
          {!isExpanded ? (
            <Button
              onClick={handleCustomerSupportClick}
              size="sm"
              className="w-full h-8 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-all duration-200 ease-in-out"
            >
              Customer Support
            </Button>
          ) : (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Button
                onClick={handleEmailSupport}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <Mail className="h-3 w-3 text-blue-600" />
                <span className="text-xs">Email Support</span>
              </Button>
              
              {/* <Button
                onClick={handleTelegramSupport}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <MessageCircle className="h-3 w-3 text-blue-500" />
                <span className="text-xs">Telegram Support</span>
              </Button> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
