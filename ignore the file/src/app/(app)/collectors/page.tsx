'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { CollectorDashboard } from '@/components/collectors/collector-dashboard'
import { CompanyDashboard } from '@/components/collectors/company-dashboard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { revenueSources, type RevenueSource } from '@/lib/revenue-data'
import { Combobox } from '@/components/ui/combobox'

export default function CollectorsPage() {
  const [view, setView] = useState<'collector' | 'company'>('collector')
  const [selectedEntity, setSelectedEntity] = useState<string>('tenement-rate-1')

  const handleEntityChange = (value: string) => {
    if (value) {
      setView('company');
      setSelectedEntity(value);
    } else {
      setView('collector');
      setSelectedEntity('');
    }
  }
  
  const getContractor = (value: string): RevenueSource | undefined => {
    return revenueSources.find(rs => rs.value === value)
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {view === 'collector' ? 'Collector Dashboard' : 'Contractor Company View'}
        </h1>
        <div className="flex items-center space-x-2">
          <Label htmlFor="view-switch">Switch to {view === 'collector' ? 'Company View' : 'Collector View'}</Label>
          <Switch
            id="view-switch"
            checked={view === 'company'}
            onCheckedChange={(checked) => setView(checked ? 'company' : 'collector')}
            aria-label="Switch between Collector and Company view"
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6 flex flex-col sm:flex-row flex-wrap items-center gap-4">
          <DateRangePicker className="w-full sm:w-auto" />
          <Select>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Revenue Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Revenue Types</SelectItem>
              <SelectItem value="tenement_rate">Tenement Rate</SelectItem>
              <SelectItem value="shop_kiosk">Shop and Kiosk</SelectItem>
              <SelectItem value="market_fees">Market Fees</SelectItem>
              <SelectItem value="hotel_permits">Hotel Permits</SelectItem>
              <SelectItem value="vehicle_reg">Vehicle Registration</SelectItem>
              <SelectItem value="mobile_advert">Mobile Advert</SelectItem>
            </SelectContent>
          </Select>
           <Combobox
              options={revenueSources.map(rs => ({ value: rs.value, label: `${rs.label} (${rs.company})` }))}
              value={selectedEntity}
              onChange={handleEntityChange}
              placeholder="Select Contractor..."
              searchPlaceholder="Search contractor..."
              emptyPlaceholder="No contractor found."
              className="w-full sm:w-[350px]"
            />
          <Button className="w-full sm:w-auto">Apply Filters</Button>
        </CardContent>
      </Card>

      {view === 'collector' ? <CollectorDashboard /> : <CompanyDashboard contractor={getContractor(selectedEntity)} />}
    </main>
  )
}
