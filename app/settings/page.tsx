import { NotificationSettings } from '@/components/NotificationSettings'

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and notifications
        </p>
      </div>
      
      <div className="grid gap-6">
        <NotificationSettings />
        
        {/* Add other settings sections here */}
        <div className="text-sm text-muted-foreground">
          More settings coming soon...
        </div>
      </div>
    </div>
  )
}
