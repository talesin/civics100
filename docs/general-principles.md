# General Principles

Core coding principles that apply across all technologies in this project.

## Naming Conventions

- Use **descriptive file names** - no abbreviations
- Use **descriptive variable names** - no abbreviations
- Use **descriptive function names** - no abbreviations
- Use **descriptive class names** - no abbreviations

```typescript
// Good
const customerEmailAddress = user.email;
const fetchCustomerOrders = (customerId: string) => { ... };

// Bad
const custEmail = user.email;
const fetchCustOrds = (cid: string) => { ... };
```

## Code Organization

### Before Writing New Code

1. **Check for existing implementations** - Search the codebase first
2. **Understand existing patterns** - Don't drastically change them; iterate instead
3. **Focus on the task** - Only modify code relevant to the current work

### Keep It Simple

- **Prefer simple solutions** over clever or complex ones
- **Avoid code duplication** - Extract shared logic into reusable functions
- **Keep the codebase easy to understand** - Future readers include AI assistants
- **Do not modify unrelated code** - Scope changes appropriately

### Avoid Over-Engineering

- Don't add features beyond what was asked
- Don't refactor code unless it's the task
- Don't add comments, docstrings, or type annotations to unchanged code
- Don't create abstractions for one-time operations
- Don't design for hypothetical future requirements

## Testing Philosophy

- **Write thorough tests** for all code
- **Test in isolation** - Mock dependencies
- **Co-locate tests** with implementation files
- Tests should cover core functionality: parsing, data fetching, construction

## Error Handling

- Do not throw errors - use Effect patterns
- Wrap unsafe code in `Effect.try` or `Effect.tryPromise`
- Be explicit about what can fail

## File Conventions

- Temporary scripts start with `temp_` and must be deleted after use
- Plans go in `plans/` directory in markdown format
- Never overwrite `.envrc` file
- Do not fix linting errors automatically - let maintainer address them first

## Project Structure

Refer to `README.md` for project description and `TASKS.md` for specific tasks when available. Use `PLAN.md` files for context on ongoing work.
