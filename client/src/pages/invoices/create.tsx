import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import DataCard from "@/components/ui/data-card";

// Form schema
const formSchema = z.object({
  clientId: z.string().min(1, {
    message: "Please select a client",
  }),
  invoiceNumber: z.string().min(1, {
    message: "Invoice number is required",
  }),
  amount: z.string().min(1, {
    message: "Amount is required",
  }),
  status: z.string().min(1, {
    message: "Status is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  paymentMethod: z.string().min(1, {
    message: "Payment method is required",
  }),
  items: z.string().min(1, {
    message: "At least one item is required",
  }),
  notes: z.string().optional(),
  template: z.string().default("default"),
  cryptoType: z.string().optional(),
});

export default function CreateInvoice() {
  useEffect(() => {
    document.title = "Create Invoice - CryptoPay";
  }, []);

  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch clients
  const { data: clients, isLoading: isLoadingClients } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch crypto prices for conversion
  const { data: cryptoPrices } = useQuery<any[]>({
    queryKey: ["/api/crypto-prices"],
  });

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // If crypto payment is selected, calculate crypto amount
      let cryptoAmount = null;
      if (data.paymentMethod === "CRYPTO" && data.cryptoType) {
        // Fetch the current price for the selected crypto
        const cryptoPrice = cryptoPrices?.find(cp => cp.symbol === data.cryptoType);
        if (cryptoPrice) {
          // Calculate how much crypto is needed for the invoice amount
          cryptoAmount = (parseFloat(data.amount) / parseFloat(cryptoPrice.price)).toString();
        }
      }

      // Reformat items from string to JSON
      // This is a simplified example - in a real app we'd have a dynamic form for items
      const items = JSON.stringify([
        { description: "Service", quantity: 1, rate: parseFloat(data.amount), amount: parseFloat(data.amount) }
      ]);

      return await apiRequest(
        "POST",
        "/api/invoices",
        {
          clientId: parseInt(data.clientId),
          invoiceNumber: data.invoiceNumber,
          amount: data.amount,
          cryptoAmount,
          cryptoType: data.paymentMethod === "CRYPTO" ? data.cryptoType : null,
          status: data.status,
          dueDate: data.dueDate.toISOString(),
          paymentMethod: data.paymentMethod,
          items,
          notes: data.notes,
          template: data.template,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      navigate("/invoices");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create invoice. Please try again.",
      });
      console.error("Failed to create invoice:", error);
    },
  });

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: '',
      invoiceNumber: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      amount: '',
      status: "PENDING",
      paymentMethod: "CRYPTO",
      template: "default",
      notes: "Thank you for your business!",
      items: JSON.stringify([{ description: "Service", quantity: 1, rate: 0, amount: 0 }])
    },
  });

  // Generate next invoice number
  useEffect(() => {
    if (!form.getValues("invoiceNumber")) {
      form.setValue("invoiceNumber", `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
    }
  }, [form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    createInvoice.mutate(values);
  };

  const paymentMethodOptions = [
    { value: "CRYPTO", label: "Cryptocurrency" },
    { value: "BANK", label: "Bank Transfer" },
    { value: "CARD", label: "Credit Card" },
  ];

  const statusOptions = [
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING", label: "Pending" },
    { value: "PAID", label: "Paid" },
  ];

  const templateOptions = [
    { value: "default", label: "Default" },
    { value: "modern", label: "Modern" },
    { value: "minimal", label: "Minimal" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Invoice</h1>
        <Button variant="outline" onClick={() => navigate("/invoices")}>
          Cancel
        </Button>
      </div>

      <DataCard title="Invoice Details">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Client</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? clients?.find(
                                  (client) => client.id.toString() === field.value
                                )?.name
                              : "Select client"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0">
                        {isLoadingClients ? (
                          <div className="text-center py-2">Loading clients...</div>
                        ) : (
                          <Command>
                            <CommandInput placeholder="Search client..." />
                            <CommandEmpty>No client found.</CommandEmpty>
                            <CommandGroup>
                              {clients?.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.id.toString()}
                                  onSelect={() => {
                                    form.setValue("clientId", client.id.toString());
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      client.id.toString() === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {client.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        )}
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Amount</FormLabel>
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("paymentMethod") === "CRYPTO" && (
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
              )}

              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templateOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    These notes will appear on the invoice.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/invoices")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createInvoice.isPending}
              >
                {createInvoice.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </form>
        </Form>
      </DataCard>
    </div>
  );
}