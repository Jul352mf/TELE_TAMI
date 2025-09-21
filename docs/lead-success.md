# Lead Success Criteria & Field Matrix

A lead is considered SUCCESSFUL when all REQUIRED CORE fields are present AND at least one location field (loading or delivery) is provided.

## Core Required (Schema-Enforced)
- side (BUY | SELL)
- product
- price.amount, price.currency, price.per
- quantity.amount, quantity.unit
- paymentTerms
- incoterm
- (anyOf) loadingLocation OR deliveryLocation

## Recommended High-Value Optional (encourage if trader engaged)
- Other location (whichever missing)
- packaging
- transportMode
- priceValidity (offer if price seems time-sensitive)
- availabilityTime OR availabilityQty (supply context)
- deliveryTimeframe
- trader identity (traderName) – currently represented as free-form notes; consider formalizing

## Supplemental Context (low pressure)
- notes / specialNotes (edge cases, constraints)
- summary (model-generated internal recap — avoid re-sending unless requested)

## Validation Algorithm (Proposed Runtime)
1. Track a draft object as fields extracted.
2. Maintain set Missing = CORE minus present fields (treat location satisfied if either present).
3. On each new user turn:
   - Extract candidate fields.
   - For each candidate not yet confirmed, briefly reflect and add.
   - If Missing empty → offer lock-in vs more details.
4. Finalization allowed only when Missing empty.
5. Multi-lead: after finalization, reset draft and ask if another lead.

## Multi-Lead Handling Verification Plan
- Unit test: sequential finalize → new draft is empty and prior data not leaked.
- Ensure prompt prohibits mixing (already present) and tool layer associates each record with unique `sourceCallId`.
- Add `leadIndex` incremental counter in memory (optional future) to tie telemetry.

## Edge Cases
| Scenario | Handling |
|----------|----------|
| Price given without unit | Ask unit; do not assume. |
| Quantity string with unit embedded ("5k mt") | Parse into amount=5000 unit=mt where reasonable; confirm once. |
| Incoterm missing after two prompts | Provide final polite attempt then proceed to close if trader disengages. |
| Trader gives both loading & delivery | Accept both; no extra confirmation unless ambiguous. |
| Ambiguous location ("Rotterdam") | Ask if loading or delivery. |

## Success Metric Candidates
- Lead completion rate = completed leads / sessions with at least one lead attempt.
- Avg confirmations per required field (target <=1.3).
- Avg time to completion (target iterative reduction).

## Next Actions
- Integrate matrix into experiment harness metrics.
- Extend schema if traderName formalization required.
