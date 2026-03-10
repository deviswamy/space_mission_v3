---
name: magic
description: "Maximum throughput through planned parallelization. Plan first to identify independent work streams, then execute aggressively in parallel. Use for any non-trivial task. Triggers include /magic, complex tasks, large changes."
---

# Magic

Prepare a plan suitable for massive paralelization first. Then delegate to sub-agents to parallelize aggressively. Leverage agents and skills 

## Why This Works

- **Planning prevents overlap** - Each agent knows exactly what to do
- **Focused scope prevents overload** - No single agent tries to do everything and exhausts context window
- **Parallel execution = speed** - 5 focused agents > 1 overloaded agent
- **User approval = control** - You sign off before the swarm launches

## Anti-Patterns

❌ Parallelizing without planning first (causes overlap/overload)
❌ One agent trying to explore entire codebase
❌ Sequential execution when parallel is possible
❌ Using Opus for simple exploration (waste of capability)