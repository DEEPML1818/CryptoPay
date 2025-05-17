import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Contact, InsertContact } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

// Contact form schema with validation
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  walletAddress: z.string().optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  company: z.string().optional(),
  userId: z.number(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export function ContactsList() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  // Create contact mutation
  const createContact = useMutation({
    mutationFn: async (contact: InsertContact) => {
      const response = await apiRequest("POST", "/api/contacts", contact);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contact created",
        description: "The contact has been created successfully",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create contact. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      walletAddress: "",
      email: "",
      company: "",
      userId: 1, // Default user ID
    },
  });

  // Open dialog for new contact
  const handleNewContact = () => {
    setEditingContact(null);
    form.reset({
      name: "",
      walletAddress: "",
      email: "",
      company: "",
      userId: 1,
    });
    setIsDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = async (data: ContactFormValues) => {
    await createContact.mutateAsync(data);
  };

  // Table columns
  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row: Contact) => (
        <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
      ),
    },
    {
      header: "Company",
      accessorKey: "company",
      cell: (row: Contact) => (
        <div className="text-gray-500 dark:text-gray-300">{row.company || "-"}</div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (row: Contact) => (
        <div className="text-gray-500 dark:text-gray-300">{row.email || "-"}</div>
      ),
    },
    {
      header: "Wallet Address",
      accessorKey: "walletAddress",
      cell: (row: Contact) => (
        <div className="text-xs font-mono text-gray-500 dark:text-gray-300">
          {row.walletAddress
            ? `${row.walletAddress.substring(0, 6)}...${row.walletAddress.substring(
                row.walletAddress.length - 4
              )}`
            : "-"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: Contact) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Your Contacts</h3>
        <Button onClick={handleNewContact}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={contacts || []}
          loading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No contacts found
              </p>
              <Button variant="outline" onClick={handleNewContact}>
                Add your first contact
              </Button>
            </div>
          }
        />
      </Card>

      {/* Contact Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Solana wallet address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createContact.isPending}>
                  {createContact.isPending ? "Saving..." : "Save Contact"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
