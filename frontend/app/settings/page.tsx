'use client'

import { SettingsForm } from '@/components/settings/SettingsForm'
import { BackButton } from '@/components/ui/BackButton'

export default function SettingsPage() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-display text-gray-800">Settings</h1>
        <BackButton />
      </div>
      <SettingsForm />
    </div>
  )
}
