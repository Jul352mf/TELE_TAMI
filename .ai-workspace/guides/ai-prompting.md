# AI-Assisted Development Guide

## Effective Prompting for TELE_TAMI

### Context Setting
Always provide context about:
1. The component you're working on
2. The conversation flow state
3. Existing patterns to follow
4. Telemetry requirements

### Example Prompts

#### Feature Development
"I need to add a new UI component for [feature]. It should follow the existing pattern in [similar component], include telemetry events, and maintain accessibility standards. The component should integrate with the conversation state management."

#### Bug Fixing
"There's an issue with [specific behavior]. The expected behavior is [description]. Here's the current implementation: [code]. Please suggest a minimal fix that maintains backward compatibility."

#### Testing
"I need comprehensive tests for [component/function]. It should cover [scenarios] and follow the existing test patterns in the __tests__ directory."

### Best Practices
1. **Be Specific**: Mention exact file names and functions
2. **Provide Context**: Include relevant existing code
3. **State Constraints**: Mention minimal changes requirement
4. **Include Examples**: Reference similar implementations
5. **Specify Standards**: Mention accessibility, telemetry needs

### Code Review Prompts
"Review this code for:
- TypeScript best practices
- Accessibility compliance
- Telemetry integration
- Performance considerations
- Testing coverage"
