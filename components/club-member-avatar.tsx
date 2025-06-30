import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserAvatar } from "@/hooks/use-profile";

interface ClubMemberAvatarProps {
  userId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showName?: boolean;
}

export function ClubMemberAvatar({ 
  userId, 
  size = "md", 
  className = "", 
  showName = false 
}: ClubMemberAvatarProps) {
  const { avatarUrl, displayName, initials, isLoading } = useUserAvatar(userId);

  

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  if (showName) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className={sizeClasses[size]}>
          <AvatarImage 
            src={avatarUrl} 
            alt={displayName}
            className={isLoading ? "opacity-75" : ""} 
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {isLoading ? "..." : initials}
          </AvatarFallback>
        </Avatar>
        {showName && (
          <span className="text-sm font-medium">
            {isLoading ? "Loading..." : displayName}
          </span>
        )}
      </div>
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={avatarUrl} 
        alt={displayName}
        className={isLoading ? "opacity-75" : ""} 
      />
      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
        {isLoading ? "..." : initials}
      </AvatarFallback>
    </Avatar>
  );
}

// For displaying multiple club members
interface ClubMemberListProps {
  memberIds: string[];
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
}

export function ClubMemberList({ 
  memberIds, 
  maxDisplay = 5, 
  size = "sm" 
}: ClubMemberListProps) {
  const displayIds = memberIds.slice(0, maxDisplay);
  const overflow = memberIds.length - maxDisplay;

  return (
    <div className="flex -space-x-2">
      {displayIds.map((userId) => (
        <ClubMemberAvatar 
          key={userId}
          userId={userId}
          size={size}
          className="border-2 border-white"
        />
      ))}
      {overflow > 0 && (
        <div className={`${size === 'sm' ? 'h-6 w-6' : size === 'md' ? 'h-8 w-8' : 'h-12 w-12'} rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600`}>
          +{overflow}
        </div>
      )}
    </div>
  );
} 