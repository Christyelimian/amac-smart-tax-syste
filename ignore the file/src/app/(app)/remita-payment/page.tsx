'use client'

import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { revenueSources, type RevenueSource } from '@/lib/revenue-data'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Banknote, Smartphone, CreditCard, QrCode } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
  revenueType: z.string().min(1, 'Revenue type is required.'),
  businessName: z.string().min(1, 'Business name is required.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(10, 'Invalid phone number.'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
})

type FormValues = z.infer<typeof formSchema>

type PaymentDetails = {
  rrr: string
  revenueSource: RevenueSource
  amount: number
  accountNumber: string
}

export default function RemitaPaymentPage() {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      revenueType: '',
      businessName: '',
      email: '',
      phone: '',
      amount: 0,
    },
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const selectedRevenueSource = revenueSources.find(rs => rs.value === data.revenueType)
    if (!selectedRevenueSource) return

    // Simulate RRR and Virtual Account generation
    const rrr = `2700${Math.floor(10000000 + Math.random() * 90000000)}`
    const virtualAccountNumber = `9876${Math.floor(100000 + Math.random() * 900000)}`

    setPaymentDetails({
      rrr,
      revenueSource: selectedRevenueSource,
      amount: data.amount,
      accountNumber: virtualAccountNumber,
    })
  }

  const revenueOptions = revenueSources.map(rs => ({ value: rs.value, label: rs.label }))
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied!`,
      description: `The ${label.toLowerCase()} has been copied to your clipboard.`,
    });
  };

  return (
    <>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">AMAC Revenue Payment Portal</CardTitle>
            <CardDescription>
              Select a revenue type and enter your details to generate a payment reference.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="grid gap-6">
                <FormField
                  control={form.control}
                  name="revenueType"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>1. Select Revenue Type</FormLabel>
                      <Combobox
                        options={revenueOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select revenue type..."
                        searchPlaceholder="Search revenue types..."
                        emptyPlaceholder="No revenue type found."
                        className="w-full"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <fieldset className="grid gap-4">
                  <legend className="text-sm font-medium mb-2">2. Enter Details</legend>
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business/Payer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ABC Company Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="payer@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="08012345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₦)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter amount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
                <Button type="submit" className="w-full">
                  Generate Payment Reference
                </Button>
              </CardContent>
            </form>
          </Form>
        </Card>
      </main>

      <Dialog open={!!paymentDetails} onOpenChange={(open) => !open && setPaymentDetails(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Reference Generated</DialogTitle>
            <DialogDescription>
              Your Remita Retrieval Reference (RRR) has been created. Please use one of the methods below to complete your payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-muted p-4">
              <span className="text-sm font-medium text-muted-foreground">Remita Retrieval Reference (RRR)</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-widest">{paymentDetails?.rrr}</span>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(paymentDetails?.rrr || '', 'RRR')}>Copy</Button>
              </div>
            </div>

            <div className="text-center">
              <p className="font-medium">Total Amount: <span className="font-bold text-lg">₦{paymentDetails?.amount.toLocaleString()}</span></p>
              <p className="text-sm text-muted-foreground">For: {paymentDetails?.revenueSource.label}</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">How to Pay:</h4>
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Banknote className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <h5 className="font-semibold">Bank Transfer</h5>
                  <p className="text-sm text-muted-foreground">Transfer to the account below. Use the RRR as the transaction description.</p>
                  <div className="mt-2 text-sm space-y-1">
                    <p><strong>Bank:</strong> Zenith Bank (Virtual Account)</p>
                    <div className="flex items-center gap-2">
                      <p><strong>Account:</strong> {paymentDetails?.accountNumber}</p>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentDetails?.accountNumber || '', 'Account Number')}>Copy</Button>
                    </div>
                    <p><strong>Name:</strong> AMAC - {paymentDetails?.revenueSource.label}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Smartphone className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <h5 className="font-semibold">USSD Payment</h5>
                  <p className="text-sm text-muted-foreground">Dial the code below from your registered phone number.</p>
                  <div className="flex items-center gap-2 mt-2">
                      <p className="font-mono text-sm">*322*{paymentDetails?.rrr}#</p>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`*322*${paymentDetails?.rrr}#`, 'USSD Code')}>Copy</Button>
                  </div>
                </div>
              </div>
               <div className="flex items-start gap-3 rounded-md border p-3">
                <CreditCard className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                <div>
                  <h5 className="font-semibold">Card / Web Payment</h5>
                  <p className="text-sm text-muted-foreground">Click the button to pay online via the Remita gateway.</p>
                  <Button size="sm" className="mt-2">Pay with Card</Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
