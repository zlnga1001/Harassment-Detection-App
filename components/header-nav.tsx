import Link from "next/link"
import { Video, PlaySquare, FolderOpen, BarChart2 } from "lucide-react"
import { Button } from "./ui/button"

export function HeaderNav() {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/pages/upload" className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          <span>Upload</span>
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/pages/realtimeStreamPage" className="flex items-center gap-2">
          <PlaySquare className="h-4 w-4" />
          <span>Realtime</span>
        </Link>
      </Button>
    </div>
  )
}
