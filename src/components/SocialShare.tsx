import { Button } from "@/components/ui/button";
import { Share2, Linkedin } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SocialShareProps {
  title: string;
  description: string;
  url?: string;
  hashtags?: string[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const SocialShare = ({
  title,
  description,
  url = window.location.href,
  hashtags = ["InterviewPrep", "CareerGrowth", "AI"],
  variant = "outline",
  size = "default",
}: SocialShareProps) => {
  
  const shareOnLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, "_blank", "width=600,height=600");
    toast.success("Opening LinkedIn...");
  };

  const shareOnTwitter = () => {
    const text = `${title}\n\n${description}`;
    const hashtagString = hashtags.join(",");
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtagString}`;
    window.open(twitterUrl, "_blank", "width=600,height=600");
    toast.success("Opening Twitter...");
  };

  const copyToClipboard = () => {
    const textToCopy = `${title}\n\n${description}\n\n${url}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Link copied to clipboard!");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Achievement
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={shareOnLinkedIn} className="cursor-pointer">
          <Linkedin className="w-4 h-4 mr-2 text-[#0A66C2]" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareOnTwitter} className="cursor-pointer">
          <FaXTwitter className="w-4 h-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Share2 className="w-4 h-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShare;
