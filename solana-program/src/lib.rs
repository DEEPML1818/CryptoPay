use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod crypto_payroll {
    use super::*;

    pub fn create_invoice(
        ctx: Context<CreateInvoice>,
        amount: u64,
        description: String,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let creator = &ctx.accounts.creator;
        let clock = Clock::get()?;

        // Initialize the invoice data
        invoice.creator = creator.key();
        invoice.amount = amount;
        invoice.description = description;
        invoice.status = InvoiceStatus::Pending;
        invoice.created_at = clock.unix_timestamp;
        invoice.paid_at = 0; // Not paid yet

        msg!("Invoice created with amount {} lamports", amount);
        Ok(())
    }

    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        amount: u64,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let payer = &ctx.accounts.payer;
        let creator = &ctx.accounts.creator;
        let clock = Clock::get()?;

        // Verify that the invoice is still pending
        require!(
            invoice.status == InvoiceStatus::Pending,
            CryptoPayrollError::InvoiceNotPending
        );

        // Verify that the payment amount meets or exceeds the invoice amount
        require!(
            amount >= invoice.amount,
            CryptoPayrollError::InsufficientPaymentAmount
        );

        // Transfer funds from payer to invoice creator
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: payer.to_account_info(),
            to: creator.to_account_info(),
        };

        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        // Update invoice status to Paid
        invoice.status = InvoiceStatus::Paid;
        invoice.paid_at = clock.unix_timestamp;

        msg!("Payment processed for {} lamports", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateInvoice<'info> {
    #[account(
        init,
        payer = creator,
        space = Invoice::SPACE,
        seeds = [b"invoice", creator.key().as_ref(), &creator.key().to_bytes()[..8]],
        bump
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        mut,
        seeds = [b"invoice", creator.key().as_ref(), &creator.key().to_bytes()[..8]],
        bump,
        constraint = invoice.creator == creator.key() @ CryptoPayrollError::InvalidCreator,
    )]
    pub invoice: Account<'info, Invoice>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub creator: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Invoice {
    pub creator: Pubkey,        // Creator's public key
    pub amount: u64,            // Invoice amount in lamports
    pub description: String,    // Invoice description (max 100 chars)
    pub status: InvoiceStatus,  // Invoice status (Pending/Paid)
    pub created_at: i64,        // Timestamp when invoice was created
    pub paid_at: i64,           // Timestamp when invoice was paid (0 if not paid)
}

impl Invoice {
    // Calculate the space required for the Invoice account
    pub const SPACE: usize = 
        8 +                         // Discriminator
        32 +                        // creator: Pubkey
        8 +                         // amount: u64
        4 + (100 * 4) +             // description: String (max 100 chars * 4 bytes per char)
        1 +                         // status: InvoiceStatus (enum)
        8 +                         // created_at: i64
        8;                          // paid_at: i64
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum InvoiceStatus {
    Pending,
    Paid,
}

#[error_code]
pub enum CryptoPayrollError {
    #[msg("Invoice is not in pending status")]
    InvoiceNotPending,
    
    #[msg("Payment amount is less than invoice amount")]
    InsufficientPaymentAmount,
    
    #[msg("Invalid invoice creator")]
    InvalidCreator,
}