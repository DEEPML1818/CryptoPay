import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useSolanaWallet, SolanaInvoice } from '@/lib/solana-provider';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Define the form schema
const solanaInvoiceSchema = z.object({
  amount: z.string().min(1, { message: 'Amount is required' }),
  description: z.string().min(1, { message: 'Description is required' }).max(100, { message: 'Description must be less than 100 characters' }),
});

type SolanaInvoiceFormValues = z.infer<typeof solanaInvoiceSchema>;

export default function CreateSolanaInvoice() {
  const { toast } = useToast();
  const solanaWallet = useSolanaWallet();
  const { isConnected, createInvoice, wallet } = solanaWallet;
  const [isCreating, setIsCreating] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<SolanaInvoice | null>(null);

  // Define the form
  const form = useForm<SolanaInvoiceFormValues>({
    resolver: zodResolver(solanaInvoiceSchema),
    defaultValues: {
      amount: '',
      description: '',
    },
  });

  // Create invoice function
  const handleCreateInvoice = async (data: SolanaInvoiceFormValues) => {
    if (!isConnected) {
      toast({
        variant: 'destructive',
        title: 'Wallet not connected',
        description: 'Please connect your wallet to create an invoice',
      });
      return;
    }

    setIsCreating(true);
    try {
      const amount = parseFloat(data.amount);
      const invoice = await createInvoice(amount, data.description);
      
      if (invoice) {
        setCreatedInvoice(invoice);
        toast({
          title: 'Success',
          description: 'Solana invoice created successfully',
        });
        form.reset();
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice on Solana:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create invoice on the blockchain',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Blockchain Invoice</CardTitle>
          <CardDescription>
            Connect your wallet to create an invoice on the Solana blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-slate-50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-2">No wallet connected</p>
            <p className="text-sm text-muted-foreground">
              Please connect your Solana wallet to create blockchain invoices.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Blockchain Invoice</CardTitle>
        <CardDescription>
          Create an invoice on the Solana blockchain that can be paid with SOL
        </CardDescription>
      </CardHeader>
      <CardContent>
        {createdInvoice ? (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="font-medium mb-4">Invoice Created Successfully</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Invoice ID:</span>
                  <span className="text-sm font-mono">{createdInvoice.id.substring(0, 10)}...</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="text-sm">{createdInvoice.amount} SOL</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="text-sm capitalize">{createdInvoice.status}</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setCreatedInvoice(null)} 
              className="w-full"
            >
              Create Another Invoice
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateInvoice)} className="space-y-6">
              <div className="p-4 border rounded-md bg-slate-50 mb-4">
                <p className="text-sm mb-1">Connected wallet: <span className="font-mono">{wallet.address.slice(0, 10)}...</span></p>
                <p className="text-xs text-muted-foreground">This wallet will receive the payment</p>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (SOL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.000001" placeholder="0.1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Amount in SOL to request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter invoice description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Invoice'
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}