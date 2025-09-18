# Configs

### Voice selection / design

- Lets make all the default voices settable in the UI

### Event messages

- `on_inactivity`: polite “still there?” prompt before hang-up
- `on_max_duration`: final message if session hits limit.

### Timeouts

- Inactivity default = 120s silence; we should shorten this to 60s.
- `max_duration` : lets set this to 10min with a warning after 8min to wrap up.

### **Model choice**

- Default: `hume-evi-3`.
- Can swap in external models (Claude, GPT-4, Gemini) via frontend dropdown if user needs stricter slot-filling or more complex reasoning — trade-off: higher latency/cost. We use the same instructions for all models.