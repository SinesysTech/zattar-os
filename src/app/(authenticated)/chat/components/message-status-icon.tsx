import { Check, CheckCheck, AlertCircle} from "lucide-react";
import { MessageStatus } from "../domain";

import { LoadingSpinner } from "@/components/ui/loading-state"
export function MessageStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "sending":
      return <LoadingSpinner size="sm" className="shrink-0 text-muted-foreground" />;
    case "failed":
      return <AlertCircle className="size-3 shrink-0 text-destructive" />;
    case "read":
      return <CheckCheck className="size-3 shrink-0 text-success/60" />;
    case "forwarded":
      return <CheckCheck className="size-3 shrink-0 text-muted-foreground" />;
    case "sent":
      return <Check className="size-3 shrink-0 text-primary/70" />;
    default:
      return null;
  }
}
