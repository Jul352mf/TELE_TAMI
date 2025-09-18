# TODO

# TAMI Persona and Flow

- [ ]  Add **Multi-lead handling**
    - Prompt can instruct: “If user has more than one lead, handle one at a time, confirm, then ask for another.”
    - Keeps agenda structured while supporting multi-item sessions.
    - Probably needs changes on the backend
- [ ]  **Closing behavior**
    - Add explicit instruction to thank user + confirm no more leads, *then* end.
    - Avoids abrupt cutoff or silent hang-up.

# Email

- [ ]  Improve email formatting → html templates?
    - Like actually send an email with greeting, body and signature and put the lead info in table. Just a really good and modern looking email.

# Sheets

- [ ]  Most lines are not filled. I assume we only added them to sheets and never wired it up for the info to actually be collected. Verify and propose a fix.

# Technical & Frontend improvements

- [ ]  Fix button and toggle arrangement (currently they are overlapping) and remove GitHub star thingy
    - All settings should be arranged horizontally on desktop and vertically on mobile below the call button.
- [ ]  Add retries for Sheets writes
- [ ]  Implement all items in Configs.md