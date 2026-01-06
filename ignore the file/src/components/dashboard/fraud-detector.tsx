"use client"

import { useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { detectFraud } from "@/ai/flows/fraud-detection"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const formSchema = z.object({
  transactionData: z.string().min(1, "Transaction data is required."),
  userProfile: z.string().min(1, "User profile is required."),
})

type FormValues = z.infer<typeof formSchema>
type FraudDetectionResult = Awaited<ReturnType<typeof detectFraud>> | null

export function FraudDetector() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<FraudDetectionResult>(null)
  const { toast } = useToast()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionData: `{
  "transactionId": "txn_12345",
  "amount": 95000.00,
  "currency": "NGN",
  "paymentMethod": "credit_card",
  "timestamp": "2024-05-21T14:30:00Z",
  "ipAddress": "192.168.1.10"
}`,
      userProfile: `{
  "userId": "usr_abcde",
  "accountAge": "2 years",
  "transactionHistory": "5 previous transactions, avg ₦15,000",
  "location": "Lagos, Nigeria"
}`,
    },
  })

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true)
    setResult(null)
    try {
      const response = await detectFraud(data)
      setResult(response)
    } catch (error) {
      console.error("Fraud detection failed:", error)
      toast({
        title: "Error",
        description: "Failed to analyze transaction. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Fraud Detection</CardTitle>
        <CardDescription>
          Analyze transaction data to detect potential fraud and suspicious activities.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="transactionData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Data (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., {"transactionId": "txn_123", ...}'
                        className="min-h-[200px] font-code text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Profile (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='e.g., {"userId": "user_abc", ...}'
                        className="min-h-[200px] font-code text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {result && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <h3 className="mb-2 text-lg font-semibold flex items-center gap-2">
                  {result.isFraudulent ? (
                     <ShieldAlert className="h-6 w-6 text-destructive" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  )}
                  Analysis Result
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`flex flex-col space-y-1.5 rounded-md p-3 ${result.isFraudulent ? 'bg-destructive/10' : 'bg-green-600/10'}`}>
                    <p className="text-sm text-muted-foreground">Fraudulent</p>
                    <p className="text-xl font-bold">{result.isFraudulent ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="flex flex-col space-y-1.5 rounded-md p-3 bg-muted">
                    <p className="text-sm text-muted-foreground">Risk Score</p>
                    <p className="text-xl font-bold">{result.riskScore}/100</p>
                  </div>
                </div>
                 <Separator className="my-4" />
                 <div className="space-y-2 text-sm">
                    <p className="font-medium">Explanation:</p>
                    <p className="text-muted-foreground">{result.fraudExplanation}</p>
                 </div>
                 {result.flagReasons && result.flagReasons.length > 0 && (
                    <div className="mt-4 space-y-2 text-sm">
                        <p className="font-medium">Flag Reasons:</p>
                        <ul className="list-disc list-inside text-muted-foreground">
                            {result.flagReasons.map((reason, i) => <li key={i}>{reason}</li>)}
                        </ul>
                    </div>
                 )}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Transaction
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
