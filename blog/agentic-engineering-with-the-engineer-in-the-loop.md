---
title: Agentic Engineering With the Engineer in the Loop
slug: agentic-engineering-with-the-engineer-in-the-loop
date: 2026-09-26
summary: I open-sourced the Claude Code workflow I use on most of my projects. The AI plans, builds, and ships; I stay on the decisions that matter; and the codebase stays something I can fix and extend by hand.
---

I open-sourced my Claude Code workflow this week. It is called Sanoy (my name backwards, nothing deeper than that), it installs with one command, and it is the way I have been building software with AI agents for most of this year.

Before I explain it, one thing up front: this is not an ultimate guide. There are a lot of good ways to do agentic engineering right now. Loop-based flows, graph-based orchestration, fully autonomous agents that run for hours, and tightly scoped setups where the agent only ever gets small, well-defined tasks. I have used several of them. On some projects I let the agents run far ahead. On others I keep them on a short leash with small tasks and frequent checkpoints. What I am sharing here is the middle ground, the workflow I reach for on roughly two out of three projects. It works for most of my use cases. It may or may not work for yours.

## The problem I actually wanted to solve

Most of what I build is enterprise software. Aviation compliance systems, data platforms, internal tools that people depend on. These are not throwaway prototypes. Somebody has to keep them running, change them when the requirements change, and fix them at 9 pm when something breaks.

Letting an AI agent generate all of that code is easy now. The hard part is what comes after: a codebase you depend on but did not write. I wrote about this in my post on vibe coding. Speed is not the problem. Understanding is.

So the question I kept asking was: how do I get the speed of an agent without ending up with a system nobody on the team can explain?

The usual answer is "review everything." Let's be honest about that one. An agent produces more code in an afternoon than a team used to produce in a week. Nobody reads all of it, and nobody keeps reading it carefully for long. Review still matters, and I do it at the points where a decision has consequences. But a review habit that quietly decays is a false safety net, because you still believe you have it.

The other answer is "trust the agent." That works until the first change request.

What I wanted was not a better way to review the AI's code. It was a way to understand the system the AI produces, well enough that when something breaks I can find it and fix it, and when a feature is needed I can add it, with or without an agent in the room. Review tells you whether today's diff is right. Understanding tells you whether you can handle tomorrow's bug. So the workflow keeps the engineer in the loop at the two decisions that matter, lets the system verify the rest, and spends the saved time on understanding instead.

## What the workflow looks like

Two lanes.

For a new feature:

```
/feature <idea>   ->  you approve the plan  ->  /build  ->  /learn  ->  /ship
```

For a bug or a change to something that already exists:

```
/change <feature or description> <what needs to change>  ->  /ship
```

That is most of it. A few more skills exist (`/onboard`, `/status`), but those two lanes are the daily work.

Here is what happens inside them, and where I sit.

**`/feature` explores before it asks.** The agent reads the codebase, finds the most similar existing feature, and figures out what the new one will touch. Then it asks me questions, but only the ones that pass three tests: the code cannot answer it, a wrong guess would be expensive to undo, and reasonable engineers would choose differently. Data model, permissions, who sees what. Everything else it decides and writes down under a heading called "Decisions I made for you." I overrule by reading, not by answering twenty questions. The output is a one-page plan. No code yet.

**I approve the plan.** This is the first gate. It takes two minutes because the plan is short.

**`/build` writes tests first**, from the acceptance criteria in the plan, and confirms they fail for the right reason. Then it implements layer by layer with a local checkpoint commit after each one. It has an explicit list of things that make it stop and ask: an unplanned database migration, touching shared infrastructure or another module, any change to authentication or security behavior, scope growing beyond the plan. Outside that list it does not interrupt me.

**A build gate runs before the agent is allowed to stop.** This is a Claude Code hook. When source files have changed since the last green build, it rebuilds, and if the build fails it blocks the agent from finishing its turn and feeds the errors back. The agent cannot declare victory on broken code. It is a small script, but it removed a whole category of "it said it was done" surprises.

**A second agent reviews with fresh eyes.** Read-only, no memory of the conversation, checking correctness, architecture rules, data access, security, tests, and scope. It reports only what it can point to in the code.

**`/ship` asks me once**, shows me the summary and the test results, then commits, pushes, and opens the pull request. Second gate. Done.

For a bug, `/change` finds the feature from whatever I say ("the export button is broken" is enough), writes a failing test that reproduces the problem, finds the root cause, fixes it, and records all of that in the feature's document. Small changes run straight through. Medium ones show me a mini plan first. Large ones get bounced back as "this should be a new feature."

## One home per feature

The piece that took the longest to get right is not a skill. It is a file.

Every feature has a folder with a living document: what the feature does now (not what it did at launch), a code map of every file involved, the design decisions, a walkthrough, and a change log with every fix since. `C-001`, `C-002`, each with the request, the root cause, the files, the tests, and a two-line lesson.

Before this, my specs and plans were scattered across two folders with names that did not match, and none of them said which code actually implemented the feature. A month later, pointing the AI at "that feature" was guesswork. Now an index maps informal names, work item numbers, and slugs to the right document, and every commit carries a `Feature: <slug>` trailer, so `git log` can tell the story too.

This is what makes the fix-and-change lane possible. The agent loads the feature document, reads the code map, and starts from real context instead of re-discovering the codebase every time.

## The part I care about most

Planning, building, and shipping with an agent is a solved problem. Plenty of tools do it well. The part I wanted to solve is understanding: the codebase should stay something I can work in by hand.

If the agents disappeared tomorrow, I should still be able to fix a bug in this system, add a feature to it, and explain it on a whiteboard. When something goes wrong in production, the engineer should be able to find the cause without an AI. When the business asks for one more field on a form, the engineer should be able to add it without an AI. That is the bottom line of the whole workflow. Speed is nice. Owning the system is the point.

So the workflow makes the AI teach me what it implemented, while it is fresh:

- **A walkthrough after every build.** One real request traced through the code, file and line at each hop, the patterns used and why, and a recipe for the most likely next change. It goes into the feature document, not into a chat window that scrolls away.
- **Three ways to build.** In `auto` mode the agent writes everything and explains after. In `pair` mode it writes the tests, the scaffolding, and the wiring, then leaves the one to three core pieces for me with a hint and an example to copy. The tests already exist, so I know when I am done. Bug fixes in pair mode turned out to be the fastest way to learn a codebase I inherited from my own agents. In `coach` mode I write the code and the agent gives one step at a time and reviews each one.
- **A quiz.** Five questions, one at a time, graded honestly. Where does this live, what happens after that, why this pattern instead of throwing, what breaks if we change this. Scores go into the feature document so I know what to revisit.
- **A handbook written for a developer without AI.** A map of the system, one request traced end to end, recipes for doing things by hand, and a glossary the agent keeps current.

None of this slows the agent down. It changes what the agent produces at the end.

## Why a human stays in the loop

I want to be precise about this, because "human in the loop" can sound like an excuse for not trusting the tools.

On the enterprise systems I work on, someone has to confirm that what shipped is what was asked for, that the data model change is the one we want to live with, that the permission check is on the right action. Those are engineering decisions with consequences that outlast the sprint. An agent can propose them. It should not make them silently.

That is different from watching the agent type, and it is different from pretending to read every line. Two gates per feature, plan and ship, plus a short stop-and-ask list. Everything else is automated, verified by hooks and a second agent, and written down so I can understand it at my own pace. The engineer is in the loop at the decisions, not at the keystrokes, and stays capable of working in the code afterwards. That is what I mean by using AI in a safe, efficient, and productive way, and it is the opposite of babysitting.

## Where it came from

The workflow was not designed on a whiteboard. It grew inside a real project, a modular .NET platform with six modules and about fifty features, all built with Claude Code. The first version was a pile of slash commands and a 37 KB CLAUDE.md that loaded into every session. The second version, the one I open-sourced, is what survived: a short CLAUDE.md, rules that load only when relevant, one folder per feature, the build hook, the reviewer, and the learning steps.

Then I made it stack-agnostic. Every project-specific value (build command, test command, branch, how pull requests are opened) lives in one small profile file. An `/onboard` skill reads a codebase, proposes that file, fills in the project rules, writes the map and glossary, and adopts the features that already exist. It works on a blank project too, with a short interview instead of an exploration.

## Try it

```
npx sanoy-ai-workflow init
```

Then open the project in Claude Code and run `/onboard`. Existing files are never overwritten, there is no telemetry, and it is MIT licensed. The source, the docs, and a longer explanation are at [github.com/sanoylab/sanoy-ai-workflow](https://github.com/sanoylab/sanoy-ai-workflow).

If you try it on a project and something in the flow feels wrong, open an issue and tell me what you would have done differently. This is one workflow among many, and it is better because of the projects that pushed back on it.
