import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Moon, Volume2, Bell } from 'lucide-react';

// Props might be needed later if settings become global
interface SettingsPanelProps {
    // Example: onThemeChange?: (theme: 'light' | 'dark') => void;
}

export function SettingsPanel({}: SettingsPanelProps) {
    // Local state for settings within this panel for now
    const [isDarkMode, setIsDarkMode] = useState(true); // Consider using a global theme context later
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // TODO: Implement actual theme switching logic if needed globally
    // const handleThemeToggle = () => {
    //    const newMode = !isDarkMode;
    //    setIsDarkMode(newMode);
    //    // Apply theme change logic (e.g., update class on root element)
    //    document.documentElement.classList.toggle('dark', newMode);
    // };

    return (
        <div className="flex flex-col h-full bg-background"> {/* Panel background */}
            {/* Header specific to the panel */}
             <div className="p-4 border-b border-border flex-shrink-0">
                 <h2 className="text-lg font-semibold">Settings</h2>
            </div>

            <ScrollArea className="flex-1 p-4 lg:p-6">
                <div className="space-y-8 max-w-md mx-auto">
                    {/* Appearance Section */}
                    <div>
                        <h3 className="text-base font-semibold mb-4 text-foreground">Appearance</h3>
                        <div className="space-y-3 bg-card p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                                <label htmlFor="dark-mode-toggle" className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-card-foreground">
                                    <Moon className="h-4 w-4" />
                                    <span>Dark Mode</span>
                                </label>
                                <Button id="dark-mode-toggle" variant="outline" size="sm" onClick={() => setIsDarkMode(!isDarkMode)}>
                                    {isDarkMode ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>
                            {/* Add more appearance settings here */}
                        </div>
                    </div>

                    {/* Notifications & Sound Section */}
                    <div>
                        <h3 className="text-base font-semibold mb-4 text-foreground">Notifications & Sound</h3>
                        <div className="space-y-3 bg-card p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                                <label htmlFor="notif-toggle" className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-card-foreground">
                                    <Bell className="h-4 w-4" />
                                    <span>Enable Notifications</span>
                                </label>
                                <Button id="notif-toggle" variant="outline" size="sm" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                                    {notificationsEnabled ? 'On' : 'Off'}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="sound-toggle" className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-card-foreground">
                                    <Volume2 className="h-4 w-4" />
                                    <span>Sound Effects</span>
                                </label>
                                <Button id="sound-toggle" variant="outline" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>
                                    {soundEnabled ? 'On' : 'Off'}
                                </Button>
                            </div>
                        </div>
                    </div>

                     {/* Add more settings sections as needed */}

                </div>
            </ScrollArea>
        </div>
    );
}