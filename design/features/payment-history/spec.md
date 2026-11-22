# Payment History v1.2

## Summary

A list of a user's past payments, with search and a status filter.

## Problem

Users cannot find an old payment. They scroll through everything or contact support.

## Evidence

- 

## Out of scope

- Exporting payments to PDF.

## User stories

| ID | Story |
|---|---|
| US-01 | As a user, I want to search my past payments, so that I can find one quickly. |

## Acceptance checks

| For | Check |
|---|---|
| US-01 | Given I have past payments, when I type a name in search, then only matching payments show. |

## States

| State | Needed | Notes |
|---|---|---|
| Default | Yes | |
| Empty | Yes | No payments yet. |

## Strings used

| Key | Text | Screen or state |
|---|---|---|

## Open questions

| Question | Owner | Temporary answer | Status |
|---|---|---|---|

## Decisions

| Decision | Date | Decided by | Related story |
|---|---|---|---|
| Show the newest payments first. | 2025-09-15 | Sample Designer | US-01 |
