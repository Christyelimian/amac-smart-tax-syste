'use client'

import { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Languages,
    ZoomIn,
    Palette,
    Mic,
    BookDown,
    Users,
    Eye,
    MessageCircleQuestion,
    Accessibility as AccessibilityIcon,
} from "lucide-react"

const otherFeatures = [
    {
        title: "Cultural Adaptation",
        description: "Interface adaptation for local cultural preferences and norms.",
        icon: Users,
    },
    {
        title: "Offline Documentation",
        description: "Downloadable documentation and guides in local languages.",
        icon: BookDown,
    },
    {
        title: "General Accessibility",
        description: "Full compliance with WCAG standards for users with disabilities.",
        icon: Eye,
    },
    {
        title: "Literacy Support",
        description: "Intuitive, icon-based navigation for users with limited literacy.",
        icon: MessageCircleQuestion,
    },
]

export default function AccessibilityPage() {
    const [fontSize, setFontSize] = useState(16)
    const [theme, setTheme] = useState("default")

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme);
        // In a real app, this would dynamically update CSS variables
        console.log(`Theme changed to: ${newTheme}`);
    }


    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8" style={{ fontSize: `${fontSize}px` }}>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Accessibility & Localization</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Languages className="h-6 w-6 text-muted-foreground mt-1" />
                            <div>
                                <CardTitle>Multi-Language Support</CardTitle>
                                <CardDescription>Select your preferred language.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Select defaultValue="en">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ha">Hausa</SelectItem>
                                <SelectItem value="yo">Yoruba</SelectItem>
                                <SelectItem value="ig">Igbo</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1">
                     <CardHeader>
                        <div className="flex items-start gap-4">
                            <ZoomIn className="h-6 w-6 text-muted-foreground mt-1" />
                            <div>
                                <CardTitle>Large Font Support</CardTitle>
                                <CardDescription>Adjust text size for better readability.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                         <Label htmlFor="font-size-slider">Font Size: {fontSize}px</Label>
                         <Slider
                            id="font-size-slider"
                            min={12}
                            max={24}
                            step={1}
                            value={[fontSize]}
                            onValueChange={(value) => setFontSize(value[0])}
                        />
                    </CardContent>
                </Card>
                
                <Card className="lg:col-span-1">
                     <CardHeader>
                        <div className="flex items-start gap-4">
                            <Mic className="h-6 w-6 text-muted-foreground mt-1" />
                            <div>
                                <CardTitle>Voice Interface</CardTitle>
                                <CardDescription>Control the app with your voice.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <Button variant="outline" className="w-full">
                            <Mic className="mr-2 h-4 w-4" />
                            Activate Voice Control
                        </Button>
                    </CardContent>
                </Card>

            </div>

             <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <Palette className="h-6 w-6 text-muted-foreground mt-1" />
                        <div>
                            <CardTitle>Color Scheme Options</CardTitle>
                            <CardDescription>Adjust color themes for visual comfort and accessibility (e.g., for color blindness).</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                     <Button variant={theme === 'default' ? 'default' : 'outline'} onClick={() => handleThemeChange('default')}>Default</Button>
                     <Button variant={theme === 'protanopia' ? 'default' : 'outline'} onClick={() => handleThemeChange('protanopia')}>Protanopia</Button>
                     <Button variant={theme === 'deuteranopia' ? 'default' : 'outline'} onClick={() => handleThemeChange('deuteranopia')}>Deuteranopia</Button>
                     <Button variant={theme === 'tritanopia' ? 'default' : 'outline'} onClick={() => handleThemeChange('tritanopia')}>Tritanopia</Button>
                     <Button variant={theme === 'high-contrast' ? 'default' : 'outline'} onClick={() => handleThemeChange('high-contrast')}>High Contrast</Button>
                </CardContent>
            </Card>


            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 {otherFeatures.map((feature, index) => (
                    <Card key={index} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1.5">
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </div>
                                <feature.icon className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </main>
    )
}
