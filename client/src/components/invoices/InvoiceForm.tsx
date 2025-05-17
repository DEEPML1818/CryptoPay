import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertInvoiceSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useSolanaPrice } from "@/hooks/useInvoices";
import { formatCurrency } from "@/utils/currency";
import { useWalletContext } from "@/providers/WalletProvider";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Extend the insert schema with validation
const invoiceFormSchema = insertInvoiceSchema.extend({
  amount: z.coerce.number().min(0.001, "Amount must be greater than 0"),
  dueDate: z.coerce.date().min(new Date(), "Due date must be in the future"),
});

// Form values type
type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export function InvoiceForm() {
  const { toast } = useToast();
  const { data: solanaPrice } = useSolanaPrice();
  const { connected, address } = useWalletContext();
  const [amountInSol, setAmountInSol] = useState<number>(0);
  const createInvoice = useCreateInvoice();

  // Initialize form with default values
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: `INV-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      creatorId: 1, // Default user
      recipientName: "",
      recipientWalletAddress: "",
      amount: 0,
      description: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      status: "draft",
      issueDate: new Date(),
      convertOnPayment: false,
    },
  });

  // Watch amount to update fiat amount
  const amount = form.watch("amount");

  // Using useEffect to track SOL amount changes and set wallet address
  useEffect(() => {
    if (amount !== amountInSol) {
      setAmountInSol(amount);
    }
    
    // Set creator wallet address when connected
    if (connected && address) {
      form.setValue("creatorWalletAddress", address);
    }
  }, [amount, amountInSol, connected, address, form]);

  // Form submission handler
  const onSubmit = async (data: InvoiceFormValues) => {
    if (!connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create an invoice",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a modified copy of the data that stringifies dates
      const dueDateStr = data.dueDate instanceof Date 
        ? data.dueDate.toISOString().split('T')[0] // YYYY-MM-DD format
        : new Date().toISOString().split('T')[0];

      // Build the submission data with properly formatted fields
      const submissionData = {
        invoiceNumber: data.invoiceNumber,
        creatorId: data.creatorId,
        recipientName: data.recipientName,
        recipientWalletAddress: data.recipientWalletAddress || "",
        amount: String(data.amount),
        description: data.description || "",
        // Format dates as strings in the expected format
        dueDate: dueDateStr,
        issueDate: new Date().toISOString().split('T')[0],
        creatorWalletAddress: address || "",
        status: "draft",
        convertOnPayment: data.convertOnPayment
      };
      
      console.log("Submitting invoice with formatted dates:", submissionData);
      await createInvoice.mutateAsync(submissionData as any);

      toast({
        title: "Invoice Created",
        description: "Your invoice has been successfully created",
      });

      // Reset form
      form.reset();
    } catch (error) {
      console.error("Invoice creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="recipientName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="recipient">Recipient</FormLabel>
              <FormControl>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <Input
                    id="recipient"
                    placeholder="Name or Company"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recipientWalletAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="recipientWalletAddress">
                Wallet Address
              </FormLabel>
              <FormControl>
                <Input
                  id="recipientWalletAddress"
                  placeholder="Recipient's Solana wallet address"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="amount">Amount (SOL)</FormLabel>
                <FormControl>
                  <div className="relative rounded-md shadow-sm">
                    <Input
                      id="amount"
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.00"
                      {...field}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                        SOL
                      </span>
                    </div>
                  </div>
                </FormControl>
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
              <FormLabel htmlFor="description">Description</FormLabel>
              <FormControl>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="Invoice description or notes"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="dueDate">Due Date</FormLabel>
              <FormControl>
                <Input
                  id="dueDate"
                  type="date"
                  value={format(field.value, "yyyy-MM-dd")}
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="convertOnPayment"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  id="convertOnPayment"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
              <FormLabel
                htmlFor="convertOnPayment"
                className="text-sm font-normal"
              >
                Convert to USD via Mercuryo on payment
              </FormLabel>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline">
            Save Draft
          </Button>
          <Button
            type="submit"
            disabled={createInvoice.isPending || !connected}
          >
            {createInvoice.isPending ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
