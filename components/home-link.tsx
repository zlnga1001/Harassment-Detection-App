'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function HomeLink() {
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    router.push(user ? '/protected' : '/')
  }

  return (
    <Link 
      href="/" 
      onClick={handleClick}
      className="flex items-center"
    >
      <Image
        src="/logoWhite.png"
        alt="Group log"
        width={80}
        height={30}
        className="object-contain h-8"
        priority
      />
    </Link>
  )
}
