'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface ProfileAvatarProps {
  url: string | null
  size?: number
  onUpload: (url: string) => void
  editable?: boolean
}

export default function ProfileAvatar({ url, size = 120, onUpload, editable = true }: ProfileAvatarProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (url) setAvatarUrl(url)
  }, [url])

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('No user found')

      const filePath = `${user.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      onUpload(publicUrl)
      toast.success('Avatar updated!')
    } catch (error: any) {
      toast.error(error.message || 'Error uploading avatar!')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative group mx-auto sm:mx-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-2xl bg-surface-card border-2 border-surface-border overflow-hidden relative">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand/5">
            <User className="w-1/2 h-1/2 text-brand/30" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        )}
      </div>

      {editable && !uploading && (
        <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-brand text-white shadow-lg cursor-pointer hover:scale-110 transition-all border-4 border-surface">
          <Camera className="w-4 h-4" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  )
}
