import { Badge } from "./badge";

type BadgeVerifiedProps = {
  isVerified?: boolean;
  role?: string;
  className?: string;
};

export function BadgeVerified({ isVerified = true, role = "OWNER", className }: BadgeVerifiedProps) {
  if (!isVerified) return null;
  return <Badge isVerified={isVerified} role={role} className={className} />;
}
