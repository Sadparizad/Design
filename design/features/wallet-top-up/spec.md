# Wallet Top-up v1.3

## Summary

Lets a user add money to their wallet from a saved card.

## Problem

Users run out of balance at checkout and have no quick way to add money.

## Evidence

- 

## Out of scope

- Withdrawing money from the wallet.

## User stories

| ID | Story |
|---|---|
| US-01 | As a user, I want to top up my wallet from a saved card, so that I can pay without delay. |

## Acceptance checks

| For | Check |
|---|---|
| US-01 | Given I have a saved card, when I confirm a top-up amount, then my balance increases. |

## States

| State | Needed | Notes |
|---|---|---|
| Default | Yes | |
| Error | Yes | Card declined. |

## Strings used

| Key | Text | Screen or state |
|---|---|---|

## Open questions

| Question | Owner | Temporary answer | Status |
|---|---|---|---|
| What is the maximum top-up amount? | Sample Designer | No limit for now | Open |

## Decisions

| Decision | Date | Decided by | Related story |
|---|---|---|---|
