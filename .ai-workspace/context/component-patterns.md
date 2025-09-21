# Component Patterns

## State Management
```typescript
// Use local state with persistence
const [value, setValue] = useState(defaultValue);

useEffect(() => {
  // Load from localStorage
  const saved = localStorage.getItem('key');
  if (saved) setValue(JSON.parse(saved));
}, []);

useEffect(() => {
  // Save to localStorage
  localStorage.setItem('key', JSON.stringify(value));
}, [value]);
```

## Telemetry Integration
```typescript
import { emit } from '@/utils/telemetry';

// Emit events for user actions
const handleAction = () => {
  emit({ type: 'action_performed', context: 'specific' });
};
```

## Accessibility
```typescript
// Always include ARIA labels
<button 
  aria-label="Descriptive action"
  aria-describedby="help-text"
>
  Action
</button>
```

## Conditional Features
```typescript
// Use environment flags
const isFeatureEnabled = process.env.NEXT_PUBLIC_FEATURE_FLAG === '1';

if (isFeatureEnabled) {
  // Feature implementation
}
```
