import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PlusCircle, Wallet, Coins, Copy, Check, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import DataCard from "@/components/ui/data-card";
import { Wallet as WalletType } from "@shared/schema";

// Form schema for adding a new wallet
const walletFormSchema = z.object({
  type: z.string().min(1, {
    message: "Wallet type is required",
  }),
  address: z.string().min(1, {
    message: "Wallet address is required",
  }),
  label: z.string().min(1, {
    message: "Wallet label is required",
  }),
  isDefault: z.boolean().optional(),
});

// Get crypto icon based on type
const CryptoIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "BTC":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M13.6 11.2c.2-.8-.5-1.2-1.3-1.5l.3-1-1.6-.4-.3.9c-.4-.1-.8-.2-1.2-.3l.3-.9-1.6-.4-.3 1c-.3-.1-.6-.2-.9-.2v-.1l-2.2-.5-.4 1.6s.8.2.8.2c.5.1.4.5.4.7l-.9 3.7c-.1.1-.2.3-.5.2 0 0-.8-.2-.8-.2L3 14.6l2.1.5c.4.1.8.2 1.1.3l-.2 1.1 1.6.4.3-1c.4.1.8.2 1.2.3l-.3 1 1.6.4.3-1c2.2.4 3.8.2 4.5-1.6.5-1.5-.1-2.3-1.4-2.9.7-.5 1-1.1.8-1.9zM14 16.4c-.4 1.4-3 .6-3.8.5l.7-2.6c.8.2 3.4.7 3.1 2.1zm.3-3.5c-.3 1.3-2.6.6-3.2.5l.6-2.4c.6.2 2.6.5 2.6 1.9z"/>
        </svg>
      );
    case "ETH":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="m12 1.75-6.25 10.5L12 16l6.25-3.75L12 1.75M5.75 13.5 12 22.25l6.25-8.75L12 17.25 5.75 13.5Z"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
        </svg>
      );
  }
};

export default function WalletsPage() {
  useEffect(() => {
    document.title = "Wallets - CryptoPay";
  }, []);

  const { toast } = useToast();
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<number | null>(null);
  const [copiedWallet, setCopiedWallet] = useState<number | null>(null);

  // Fetch wallets
  const { data: wallets, isLoading } = useQuery<WalletType[]>({
    queryKey: ["/api/wallets"],
  });

  // Form for adding a new wallet
  const form = useForm<z.infer<typeof walletFormSchema>>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      type: "BTC",
      address: "",
      label: "",
      isDefault: false,
    },
  });

  // Add wallet mutation
  const addWallet = useMutation({
    mutationFn: async (data: z.infer<typeof walletFormSchema>) => {
      const response = await apiRequest(
        "POST",
        "/api/wallets",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Success",
        description: "Wallet added successfully",
      });
      form.reset();
      setIsAddWalletOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add wallet. Please try again.",
      });
      console.error("Failed to add wallet:", error);
    },
  });

  // Delete wallet mutation
  const deleteWallet = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/wallets/${id}`,
        undefined
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Success",
        description: "Wallet deleted successfully",
      });
      setSelectedWallet(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete wallet. Please try again.",
      });
      console.error("Failed to delete wallet:", error);
    },
  });

  // Set default wallet mutation
  const setDefaultWallet = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(
        "PATCH",
        `/api/wallets/${id}`,
        { isDefault: true }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Success",
        description: "Default wallet updated",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update default wallet. Please try again.",
      });
      console.error("Failed to update default wallet:", error);
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof walletFormSchema>) => {
    addWallet.mutate(values);
  };

  // Copy wallet address to clipboard
  const copyToClipboard = (id: number, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedWallet(id);
    toast({
      title: "Copied",
      description: "Wallet address copied to clipboard",
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopiedWallet(null);
    }, 2000);
  };

  // Format wallet address for display (truncate in the middle)
  const formatWalletAddress = (address: string) => {
    if (address.length < 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 10)}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Wallets</h1>
        <Button onClick={() => setIsAddWalletOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Wallet
        </Button>
      </div>

      {/* Wallet Information */}
      <Alert className="mb-6">
        <Wallet className="h-4 w-4" />
        <AlertTitle>Wallet Management</AlertTitle>
        <AlertDescription>
          Add your cryptocurrency wallets to receive payments. You can set a default wallet for each cryptocurrency type.
        </AlertDescription>
      </Alert>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="bg-muted/50 h-[100px]"></CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="h-5 w-3/4 bg-muted rounded"></div>
                <div className="h-4 w-full bg-muted rounded"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : wallets && wallets.length > 0 ? (
          wallets.map((wallet) => (
            <Card key={wallet.id} className="relative overflow-hidden">
              {wallet.isDefault && (
                <div className="absolute top-2 right-2">
                  <Badge variant="success">Default</Badge>
                </div>
              )}
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <CryptoIcon type={wallet.type} />
                </div>
                <div>
                  <CardTitle>{wallet.label}</CardTitle>
                  <CardDescription>{wallet.type}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg text-sm my-4 overflow-hidden">
                  <span className="truncate mr-2">{formatWalletAddress(wallet.address)}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(wallet.id, wallet.address)}
                    className="shrink-0"
                  >
                    {copiedWallet === wallet.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                {!wallet.isDefault && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDefaultWallet.mutate(wallet.id)}
                    disabled={setDefaultWallet.isPending}
                  >
                    Set as Default
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the wallet "{wallet.label}" from your account. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteWallet.mutate(wallet.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Wallets Added Yet</h3>
            <p className="text-muted-foreground mb-6">Add your first cryptocurrency wallet to receive payments</p>
            <Button onClick={() => setIsAddWalletOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Wallet
            </Button>
          </div>
        )}
      </div>

      {/* Add Wallet Dialog */}
      <Dialog open={isAddWalletOpen} onOpenChange={setIsAddWalletOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Wallet</DialogTitle>
            <DialogDescription>
              Add a cryptocurrency wallet to receive payments from your clients.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
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
                        <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                        <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                        <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                        <SelectItem value="SOL">Solana (SOL)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Label</FormLabel>
                    <FormControl>
                      <Input placeholder="My Bitcoin Wallet" {...field} />
                    </FormControl>
                    <FormDescription>
                      A name to help you identify this wallet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your wallet address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as default</FormLabel>
                      <FormDescription>
                        This wallet will be used as the default for this cryptocurrency
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddWalletOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={addWallet.isPending}
                >
                  {addWallet.isPending ? "Adding..." : "Add Wallet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
