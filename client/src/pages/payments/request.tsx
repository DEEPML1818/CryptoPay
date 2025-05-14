import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Copy, Check, CreditCard, CopyCheck, Link } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { convertCurrency } from "@/lib/crypto-api";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DataCard from "@/components/ui/data-card";

// Form schema
const formSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1, {
    message: "Client name is required",
  }),
  clientEmail: z.string().email({
    message: "Please enter a valid email address",
  }),
  amount: z.string().min(1, {
    message: "Amount is required",
  }),
  description: z.string().optional(),
  cryptoType: z.string().min(1, {
    message: "Please select a cryptocurrency",
  }),
});

export default function RequestPayment() {
  useEffect(() => {
    document.title = "Request Payment - CryptoPay";
  }, []);

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("direct");
  const [paymentURL, setPaymentURL] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Fetch clients
  const { data: clients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch crypto prices
  const { data: cryptoPrices } = useQuery<any[]>({
    queryKey: ["/api/crypto-prices"],
  });

  // Create payment request mutation
  const createPaymentRequest = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Calculate crypto amount based on fiat amount
      let cryptoAmountValue = null;
      
      if (data.amount && data.cryptoType) {
        try {
          const result = await convertCurrency(
            data.amount,
            "USD",
            data.cryptoType
          );
          cryptoAmountValue = result.to.amount.toString();
        } catch (error) {
          console.error("Error converting currency:", error);
          // Fall back to a simple estimation
          const cryptoPrice = cryptoPrices?.find(cp => cp.symbol === data.cryptoType);
          if (cryptoPrice) {
            cryptoAmountValue = (parseFloat(data.amount) / parseFloat(cryptoPrice.price)).toFixed(8);
          }
        }
      }
      
      // Create a payment request
      const response = await apiRequest(
        "POST",
        "/api/payments",
        {
          // We don't have an invoice ID for direct payment requests
          amount: data.amount,
          cryptoAmount: cryptoAmountValue,
          cryptoType: data.cryptoType,
          status: "PENDING",
          // Additional info for direct payment tracking
          transactionId: `REQ-${Math.floor(Math.random() * 1000000)}`,
        }
      );

      // Store the crypto amount for display
      setCryptoAmount(cryptoAmountValue);
      
      // Generate a payment URL
      const baseUrl = window.location.origin;
      const reqId = Math.random().toString(36).substring(2, 15);
      setPaymentURL(`${baseUrl}/pay/${reqId}?amount=${data.amount}&crypto=${data.cryptoType}&cryptoAmount=${cryptoAmountValue}`);
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Success",
        description: "Payment request created successfully",
      });
      // Switch to the "share" tab to show the payment link
      setActiveTab("share");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create payment request. Please try again.",
      });
      console.error("Failed to create payment request:", error);
    },
  });

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      clientEmail: "",
      amount: "",
      description: "Payment for services",
      cryptoType: "BTC",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    createPaymentRequest.mutate(values);
  };

  // Client selection change handler
  const handleClientChange = (clientId: string) => {
    if (clientId) {
      const selectedClient = clients?.find(c => c.id.toString() === clientId);
      if (selectedClient) {
        form.setValue("clientName", selectedClient.name);
        form.setValue("clientEmail", selectedClient.email);
      }
    } else {
      form.setValue("clientName", "");
      form.setValue("clientEmail", "");
    }
  };

  // Copy payment link handler
  const copyToClipboard = () => {
    navigator.clipboard.writeText(paymentURL);
    setHasCopied(true);
    toast({
      title: "Copied",
      description: "Payment link copied to clipboard",
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Request Payment</h1>
        <Button variant="outline" onClick={() => navigate("/payments")}>
          Cancel
        </Button>
      </div>

      <Tabs defaultValue="direct" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="direct">Direct Payment</TabsTrigger>
          <TabsTrigger value="share" disabled={!paymentURL}>Share Link</TabsTrigger>
        </TabsList>
        
        <TabsContent value="direct">
          <DataCard title="Payment Request Details">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {clients && clients.length > 0 && (
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Client (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleClientChange(value);
                            }}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">New Client</SelectItem>
                              {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select an existing client or enter details below
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cryptoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cryptocurrency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cryptocurrency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cryptoPrices?.map((crypto) => (
                              <SelectItem key={crypto.symbol} value={crypto.symbol}>
                                {crypto.name} ({crypto.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter payment description..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe what this payment is for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/payments")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPaymentRequest.isPending}
                  >
                    {createPaymentRequest.isPending ? "Creating..." : "Create Payment Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </DataCard>
        </TabsContent>
        
        <TabsContent value="share">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Request Created</CardTitle>
                <CardDescription>
                  Share this payment link with your client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                  <code className="text-sm truncate max-w-[260px] md:max-w-[300px]">
                    {paymentURL}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyToClipboard}
                    className="shrink-0"
                  >
                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="rounded-md border p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-medium">${form.getValues("amount")}</span>
                  </div>
                  {cryptoAmount && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Crypto Amount:</span>
                      <span className="font-medium">
                        {cryptoAmount} {form.getValues("cryptoType")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Client:</span>
                    <span className="font-medium">{form.getValues("clientName")}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open(`mailto:${form.getValues("clientEmail")}?subject=Payment%20Request&body=Please%20use%20this%20link%20to%20make%20your%20payment:%20${encodeURIComponent(paymentURL)}`)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Email to Client
                </Button>
                <Button className="w-full" onClick={() => setActiveTab("direct")}>
                  <Link className="mr-2 h-4 w-4" />
                  Create Another Request
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
                <CardDescription>
                  Scan with a mobile wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-8">
                {/* QR Code - using a placeholder SVG for simplicity */}
                <div className="w-48 h-48 bg-white p-4 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" strokeWidth="2" />
                    <g fill="black">
                      <rect x="20" y="20" width="20" height="20" />
                      <rect x="60" y="20" width="20" height="20" />
                      <rect x="20" y="60" width="20" height="20" />
                      <rect x="45" y="45" width="10" height="10" />
                      <rect x="60" y="60" width="5" height="5" />
                      <rect x="70" y="60" width="5" height="5" />
                      <rect x="60" y="70" width="5" height="5" />
                      <rect x="70" y="70" width="5" height="5" />
                    </g>
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Scan this code to open the payment page
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={copyToClipboard}>
                  <CopyCheck className="mr-2 h-4 w-4" />
                  Copy Payment Link
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
