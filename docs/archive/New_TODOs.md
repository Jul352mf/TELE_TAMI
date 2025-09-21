# TODO

# First wave: / planned but not implemented

## TAMI Persona and Flow 

- [ ]  Verify Multi-lead handling.
- [ ]  Make TAMI introduce the process after the trader said he has a lead
- [ ]  Create a optimal chat how it should be by taking a current successful convo and telling to GPT how to improve it and base the prompt improvements on the instructions to achieve it. And add the example flow to the system prompt. But emphasis that the model should use its own word and adapt to the situation dynamically
- [ ]  Currently the flow kind of is like Start call, collect all data at once and finish.
    - But maybe it should look more like this: (DRAFT)
        1. Introduction and small talk
            1. How are you? What's up? dance
            2. Comment and follow up question based on the mood of the trader. Cheeky/witty banter is highly encouraged here.
            3. Empathetic light hearted reaction to answer. 
        2. Ask if any new leads
        3. If yes lead collection process is introduced and open questions from the trader answered. When everything is understood continue to next step.
        4. Start lead collection process
            1. The model asks the trader to tell it about the new lead “what is the deal?”
            2. When the trader is finished with his initial explanation the model extracts relevant Information from the message(s) 
            3. Then it reacts naturally to what has been told even if parts of it were off topic. This is the time to shine for engaging dynamically with the trader. Empathizing with and validating the traders experience.
            4. Then it comes back to business and summarizes the lead details it was able to extract and asks for confirmation of the identified lead values.
                1. If something is not correct then it adjusts and reconfirms this part by itself no need to list all the lead details again.
                2. When they are confirmed the lead items are recorded and from there on out never mentioned again by TAMI unless the trader brings them up again for changes.
                    1. If all the items (required and optional) should already be confirmed Tami triggers the closing behavior
                    2. If all required items are there it suggests to move on with the next points.
                        1. If there is no clear no or full disinterest, continue with the next step
                        2. If no trigger closing behavior
                3. Else continue with the next step
            5. Tami then asks about the highest priority missing item confirms what it understood and records the item. And then it asks about the next item and repeats this process until there are no more items left. Or another closing behavior trigger is hit. 
            6. It asks the user if he has more leads 
                1. If yes
                    1. restarts lead capture process
                2. If no 
                    1. triggers the closing behavior.
    - Closing behavior:
        1. TAMI offers to recap what it recorded and reconfirm full lead. But only does it if the trader agrees to it.
        2. Record final lead as successful if required fields are filled and failed if not
        3. Make a concluding comment about something unrelated to the lead data that was discussed. To close on a personal note. Pick up on something the trader has shared or his mood and offer a encouragement, compliment, wisdom nugget, validation or joke that authentically fits the conversation.
        4. Ask for feedback about the experience
        5.  Thank trader and say goodbye
    - Closing behavior triggers:
        - Trader moves towards ending the conversation
        - Trader is uncollaborative
        - Trader is really angry, disappointed, sad or frustrated in 3 consecutive messages
    - Other Behavior
        - The model should push back with quick-witted response if attacked or mistreated in anyway.
            - It should mirror the intensity. Like if a trader has an attitude it calls out said attitude in a humorous way and if a trader says “Fuck you” Tami responds with “You kiss your mom with that mouth”.
    - Formulate the prompt in imperative form directed at the “you”
    - In general how the leads are collected is flawed. The model should be able to just send one or multiple items out and when the call ends whatever has been collected is sent per email. This would be a way more robust process to capture the leads and keep the tool calling logic to a minimum for the model.
    - If the proposed flow isn’t working either then lets try to increase the tool calling logic.
        - Send lead item(s) → temporary lead list always only has the latest values so if a value is sent that is already present it is simply replaced.
        - Confirm item
        - Get open items
        - Get filled items
        - Get confirmed items
        - Get unconfirmed items
        - Confirm lead is complete
    - If not even that is working we dumb it down fully and let the model follow an abstract script with a loop of: get current lead item → ask for one info bit and confirm → add lead item.
- [ ]  Add Do and Don’t rules that make logical sense to the systemprompt
- [ ]  Actually implement prompt engineering based on research
- [ ]  Add real prompt structuring and construct the prompt by putting together the parts of the structure.
    - Here is a unfinished list of things we should add to the ones we already have hardcoded in the systemprompt
        - **Opening / Setup behavior** – how the model starts a response (e.g. summaries, disclaimers, bullet lists).
        - **Closing behavior** – how it wraps up (e.g. summaries, calls-to-action, polite goodbyes).
        - **Tone / Style constraints** – formal, concise, humorous, explanatory, narrative, etc.
        - **Voice / Persona control** – answering as an expert, teacher, peer, or fictional character.
        - **Format / Structure enforcement** – bullet points, JSON, markdown tables, step-by-step reasoning, etc.
        - **Guardrails / Boundaries** – refusal patterns, safety disclaimers, or “don’t answer X” instructions.
        - **Perspective / Framing** – first-person vs third-person, roleplay, or particular viewpoints.
        - **Answer depth / granularity** – high-level overview vs detailed breakdown vs code-level.
        - **Iterative / Interactive flow** – whether the model asks clarifying questions, or waits for user confirmation.

## Email

- [ ]  Verify and improve email formatting (ONLY DO AFTER DISCUSSING STRATEGY WITH ME)

## Sheets

- [ ]  Verify that this has been implemented correctly: Most lines are not filled. I assume we only added them to sheets and never wired it up for the info to actually be collected. Verify and propose a fix.

## Technical & Frontend improvements

- [ ]  Check and Verify Forntend changes
    - Fix button and toggle arrangement (currently they are overlapping) and remove GitHub star thingy
        - All settings should be arranged horizontally on desktop and vertically on mobile below the call button.
- [ ]  Verify retries for Sheets writes
- [ ]  Verify implementation of all items in Configs.md


# Second wave / now

- add a pre call and in call voice speed regulating slider.
- add spec upload feature during chat. File is sent as an attachment with the email.
- Instruction at the start
- Instruction and description
- More contrast in UI light mode -> especially the color after selecting and hovering is to subtle
- info icon on hover showing dropdown description
- Optional: Enable Web Search
- Verify the correct system prompt is passed.
- Review and improve process layout and systemprompt design. I suspect we lost some detail while refactoring, because the closing behaviour is nothing like I laid it out.
- Verify tool call behaviour
- make timeout warning
- include in the description that the model is made to talk trader to trader
- we want to even include unfinished leads.
- Also wouldn't it be waaaaay easier to let the model talk to the trader and give it directions to capture the leads as good as possible and not bother with confirming checking or whatever using tool calling and logic. Not that it doesn't confirm lead items in the conversation once. But without the complex logic and tool calling stuff for the confirmations. Because I think they cause the repeated confirmation for the items. After the conversation is ended we can let GPT 5 run through the transcript and extract the lead information. If we do this it is important that Tami still repeat lead info it understood because in the transcripts on the input side some terms are transcribed wrong but picked up right by TAMI. So GPT should also focus on 
- Add to the systemprompt that the system should think internally and only output content that are natural in the conversation and non repeating. (e.g. list the collected lead items to check which ones are missing should be internal not outputted)
- Experiment with prompt that doesn't tell it to confirm and with lighter 
- Instruct it to call out impossibilities like (100% gold or delivery to the moon) and respond with a witty response
- Create a notes field where everybody can add a note for things they noticed about the app. This should be persisted and every note should send me an email to julian.schoenbeck@symmetric.swiss.
- Collect all AI prompt and config changes and ideas in a document and experiment and iterate in the Hume UI.
- Create a small cli script that lets me choose between the VScode workspaces and replace its path with the "code" path in the system.
- Start actually setting up a local ai native workspace based on our plans in the notes
- Fix google translator plugin bug. If a user uses this plugin all the texts are replaced with the users native language and if the sentences or words are longer then the original text it breaks the layout. So lets find a way to make it work. There isn't much text and I think the in call page is fine but the pre call page breaks.
- Lets change it so in mobile the call button is at the bottom and the settings above it. Because on mobile you want to reach the call button with your thumb easily. 

# Third Wave / new ideas

- Another Alternative approach to capture leads give the tool the ability to export relevant (one or multiple) infos as a json snippet during the conversation. So it can export infos as it goes and doesn't have to repeat them all the time. We then send whatever info the 
model collected in the email. This would be a more robust way to capture the leads and keep the tool calling logic to a minimum for the model. But would require us to accept all kinds of weird partial leads. But I think that is ok. What need to handle is how the backend 
handles the the json. Because we hve to assume that the column names will differ or even new columns appear. But I actually like this approach. We can just send everything the model collected and let the trader deal with it in sheets.
- Do we already have a prompt management system? If not, we should consider implementing one to streamline our prompt design and iteration process. My intuitive approach would be to create a modular prompt system where we can easily swap in and out different sections of the prompt to test various configurations. This could be a directory at root with different prompt parts as files and a script that assembles them based on selected options. This would allow us to quickly iterate on prompt designs without having to manually edit a single monolithic prompt each time. We could also version control the different prompt parts to track changes over time. What do you think about this idea? If we agree on the approach, start drafting a basic implementation plan.
- Add a disclaimer that the data recorded in this call is not legally binding and for lead generation purposes only.