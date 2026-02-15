"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BuilderSettingsDialogProps {
    settings: {
        name: string
        width: number
        height: number
        unit: string
        orientation: string
        orgDetails: any
    }
    onSettingsChange: (key: string, value: any) => void
    trigger?: React.ReactNode
}

export function BuilderSettingsDialog({ settings, onSettingsChange, trigger }: BuilderSettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const isCustom = !!(settings.orgDetails && Object.keys(settings.orgDetails).length > 0)
    const [useCustomOrg, setUseCustomOrg] = useState(isCustom)

    const handleOrgChange = (key: string, value: string) => {
        const newDetails = { ...settings.orgDetails, [key]: value }
        onSettingsChange('orgDetails', newDetails)
    }

    const toggleCustomOrg = (checked: boolean) => {
        setUseCustomOrg(checked)
        if (!checked) {
            onSettingsChange('orgDetails', null)
        } else {
            onSettingsChange('orgDetails', {})
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" title="Template Settings">
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle>Template Settings</DialogTitle>
                    <DialogDescription>
                        Configure global settings and organization overrides for this template.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="organization">Organization</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general" className="space-y-4">
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Template Name</Label>
                                    <Input
                                        id="name"
                                        value={settings.name}
                                        onChange={(e) => onSettingsChange('name', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="width">Width</Label>
                                        <Input
                                            id="width"
                                            type="number"
                                            step="0.1"
                                            value={settings.width}
                                            onChange={(e) => onSettingsChange('width', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="height">Height</Label>
                                        <Input
                                            id="height"
                                            type="number"
                                            step="0.1"
                                            value={settings.height}
                                            onChange={(e) => onSettingsChange('height', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="unit">Unit</Label>
                                        <Select
                                            value={settings.unit}
                                            onValueChange={(val) => onSettingsChange('unit', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mm">mm</SelectItem>
                                                <SelectItem value="in">in</SelectItem>
                                                <SelectItem value="px">px</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="orientation">Orientation</Label>
                                    <Select
                                        value={settings.orientation}
                                        onValueChange={(val) => onSettingsChange('orientation', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="portrait">Portrait</SelectItem>
                                            <SelectItem value="landscape">Landscape</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="organization" className="space-y-4">
                            <div className="py-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                    Manage organization details for this template.
                                </p>

                                {useCustomOrg && (
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Organization Name</Label>
                                            <Input
                                                value={settings.orgDetails?.name || ''}
                                                onChange={(e) => handleOrgChange('name', e.target.value)}
                                                placeholder="e.g. Guinabsan National High School"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Department Name</Label>
                                                <Input
                                                    value={settings.orgDetails?.department_name || ''}
                                                    onChange={(e) => handleOrgChange('department_name', e.target.value)}
                                                    placeholder="e.g. Department of Education"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Division Name</Label>
                                                <Input
                                                    value={settings.orgDetails?.division_name || ''}
                                                    onChange={(e) => handleOrgChange('division_name', e.target.value)}
                                                    placeholder="e.g. Division of Buenavista"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Address</Label>
                                            <Input
                                                value={settings.orgDetails?.division_address || ''}
                                                onChange={(e) => handleOrgChange('division_address', e.target.value)}
                                                placeholder="Address line"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Website</Label>
                                                <Input
                                                    value={settings.orgDetails?.division_website || ''}
                                                    onChange={(e) => handleOrgChange('division_website', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Logo URL</Label>
                                                <Input
                                                    value={settings.orgDetails?.logo_url || ''}
                                                    onChange={(e) => handleOrgChange('logo_url', e.target.value)}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Division Code</Label>
                                                <Input
                                                    value={settings.orgDetails?.division_code || ''}
                                                    onChange={(e) => handleOrgChange('division_code', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Station Code</Label>
                                                <Input
                                                    value={settings.orgDetails?.station_code || ''}
                                                    onChange={(e) => handleOrgChange('station_code', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Superintendent Name</Label>
                                                <Input
                                                    value={settings.orgDetails?.superintendent_name || ''}
                                                    onChange={(e) => handleOrgChange('superintendent_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Superintendent Title</Label>
                                                <Input
                                                    value={settings.orgDetails?.superintendent_title || ''}
                                                    onChange={(e) => handleOrgChange('superintendent_title', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <Button onClick={() => setOpen(false)}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
