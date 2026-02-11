'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function ExecutionsPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/workflows') }, [router])
  return null
}
