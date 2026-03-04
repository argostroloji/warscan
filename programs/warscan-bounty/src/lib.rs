use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("WarScanBounty111111111111111111111111111111"); // Placeholder Program ID

#[program]
pub mod warscan_bounty {
    use super::*;

    /// Initialize a new bounty, locking WARSCAN tokens in the PDA vault.
    pub fn initialize_bounty(
        ctx: Context<InitializeBounty>,
        bounty_id: u64,
        amount: u64,
    ) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty_account;
        bounty.creator = ctx.accounts.creator.key();
        bounty.vault = ctx.accounts.vault.key();
        bounty.mint = ctx.accounts.mint.key();
        bounty.bounty_id = bounty_id;
        bounty.amount = amount;
        bounty.is_completed = false;
        bounty.is_cancelled = false;
        bounty.bump = ctx.bumps.bounty_account;

        // Transfer tokens from creator to PDA vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.creator_token_account.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.creator.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    /// Submit an intelligence report for a bounty.
    pub fn submit_report(
        ctx: Context<SubmitReport>,
        _bounty_id: u64,
        report_uri: String, // e.g. IPFS hash
    ) -> Result<()> {
        let report = &mut ctx.accounts.report_account;
        report.bounty = ctx.accounts.bounty_account.key();
        report.hunter = ctx.accounts.hunter.key();
        report.report_uri = report_uri;
        report.is_approved = false;

        Ok(())
    }

    /// Approve a report and release escrowed tokens to the hunter.
    pub fn approve_report(ctx: Context<ApproveReport>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty_account;
        let report = &mut ctx.accounts.report_account;

        require!(!bounty.is_completed, ErrorCode::AlreadyCompleted);
        require!(!bounty.is_cancelled, ErrorCode::AlreadyCancelled);
        require!(bounty.creator == ctx.accounts.creator.key(), ErrorCode::Unauthorized);

        report.is_approved = true;
        bounty.is_completed = true;

        // Transfer tokens from PDA vault to hunter
        let bounty_id_bytes = bounty.bounty_id.to_le_bytes();
        let seeds = &[
            b"bounty",
            bounty.creator.as_ref(),
            bounty_id_bytes.as_ref(),
            &[bounty.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.hunter_token_account.to_account_info(),
            authority: bounty.to_account_info(), // the bounty account is the PDA authority
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, bounty.amount)?;

        Ok(())
    }

    /// Cancel a bounty and return tokens to creator if not resolved.
    pub fn cancel_bounty(ctx: Context<CancelBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty_account;
        
        require!(!bounty.is_completed, ErrorCode::AlreadyCompleted);
        require!(!bounty.is_cancelled, ErrorCode::AlreadyCancelled);
        require!(bounty.creator == ctx.accounts.creator.key(), ErrorCode::Unauthorized);

        bounty.is_cancelled = true;

        // Return tokens to creator
        let bounty_id_bytes = bounty.bounty_id.to_le_bytes();
        let seeds = &[
            b"bounty",
            bounty.creator.as_ref(),
            bounty_id_bytes.as_ref(),
            &[bounty.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.creator_token_account.to_account_info(),
            authority: bounty.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, bounty.amount)?;

        Ok(())
    }
}

// ── Accounts ───────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(bounty_id: u64)]
pub struct InitializeBounty<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + BountyAccount::INIT_SPACE,
        seeds = [b"bounty", creator.key().as_ref(), bounty_id.to_le_bytes().as_ref()],
        bump
    )]
    pub bounty_account: Account<'info, BountyAccount>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        token::mint = mint,
        token::authority = bounty_account, // PDA is the authority of the vault
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(bounty_id: u64)]
pub struct SubmitReport<'info> {
    #[account(mut)]
    pub hunter: Signer<'info>,

    #[account(
        init,
        payer = hunter,
        space = 8 + ReportAccount::INIT_SPACE,
        // using hunter + bounty to ensure uniqueness or allow multiple?
        // for simplicity, hunter + bounty unique report
        seeds = [b"report", bounty_account.key().as_ref(), hunter.key().as_ref()],
        bump
    )]
    pub report_account: Account<'info, ReportAccount>,

    pub bounty_account: Account<'info, BountyAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveReport<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut, has_one = creator)]
    pub bounty_account: Account<'info, BountyAccount>,

    #[account(mut, has_one = bounty_account)]
    pub report_account: Account<'info, ReportAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    /// The recipient of the funds
    /// CHECK: We just need to transfer to their token account
    pub hunter: AccountInfo<'info>,

    #[account(mut)]
    pub hunter_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelBounty<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut, has_one = creator)]
    pub bounty_account: Account<'info, BountyAccount>,

    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub creator_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ── State ──────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct BountyAccount {
    pub creator: Pubkey,
    pub vault: Pubkey,
    pub mint: Pubkey,
    pub bounty_id: u64,
    pub amount: u64,
    pub is_completed: bool,
    pub is_cancelled: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ReportAccount {
    pub bounty: Pubkey,
    pub hunter: Pubkey,
    #[max_len(128)]
    pub report_uri: String, 
    pub is_approved: bool,
}

// ── Errors ─────────────────────────────────────────────────────

#[error_code]
pub enum ErrorCode {
    #[msg("This bounty is already completed.")]
    AlreadyCompleted,
    #[msg("This bounty has been cancelled.")]
    AlreadyCancelled,
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}
