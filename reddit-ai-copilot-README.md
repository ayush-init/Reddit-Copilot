# Reddit AI Copilot

> **An AI operating layer for your Reddit account.**
>
> Connect your Reddit account, understand your communities and activity, and let AI help you decide what to post, comment, message, or avoid — before you act.

---

## 🚀 Product Vision

Reddit AI Copilot is not a Reddit clone and not a simple AI chatbot.

The goal is to build a personalized AI layer between the user and Reddit.

The system understands:

- The user's Reddit account and activity
- Communities the user participates in
- Community rules and culture
- The content the user wants to interact with
- The user's previous actions and outcomes

Then, before an important action, the AI answers:

> **Should I do this?**
>
> **Where should I do it?**
>
> **How risky is it?**
>
> **What should I change?**

The user remains in control. AI recommends and explains; the user approves the final action.

---

# 🎯 Core Product Experience

A typical flow:

```text
Connect Reddit
      ↓
Understand My Account
      ↓
Browse Reddit from the platform
      ↓
Choose an action
      ↓
AI analyzes context
      ↓
Account + Community + Content + History
      ↓
Recommendation
      ↓
User approves / edits
      ↓
Action goes to Reddit
      ↓
Result is observed
      ↓
System learns from the outcome
```

---

# ⭐ Main User Flows

## 1. "I want to comment on this post"

User pastes a Reddit post link or opens a post inside the platform.

```text
Reddit Post
   ↓
Analyze Post
   ↓
Understand Community
   ↓
Understand User Account
   ↓
Retrieve Relevant Memory
   ↓
Decide:
   - Comment
   - Don't comment
   - Wait
   - Choose another community
   ↓
Generate suggested reply
   ↓
User edits / approves
   ↓
Post comment to Reddit
```

The AI should not blindly generate a comment.

It should first decide whether commenting is a good idea **for this specific user**.

---

## 2. "I want to make a post today"

User says:

> "I want to post something today."

The system checks:

- User's current account/activity state
- User's previous activity
- Communities the user knows
- Community rules
- Community culture
- Current topics/discussions
- Potential moderation/self-promotion risk

Then it recommends:

```text
Community A
Topic fit: High
Account fit: High
Rule risk: Low
Recommendation: ✅

Community B
Topic fit: High
Account fit: Low
Rule risk: Medium
Recommendation: 🟡

Community C
Topic fit: Medium
Account fit: Low
Rule risk: High
Recommendation: ❌
```

The key idea is:

> **Do not recommend the best community globally. Recommend the best community for this user's account right now.**

---

## 3. "Can I post this?"

Before publishing:

```text
Draft
  ↓
Community Rules
  ↓
Community Culture
  ↓
Account Context
  ↓
Past User Behavior
  ↓
AI Preflight
```

Possible result:

```text
🟢 LOW RISK
Post appears compatible.

or

🟡 MODIFY
The topic fits, but the wording may look promotional.

or

🔴 HIGH RISK
Potential rule conflict / poor account fit / high moderation risk.
```

The system should explain **why** rather than only returning a score.

---

## 4. "I want to DM this person"

User opens a profile or pastes a Reddit profile/post link and says:

> "I want to DM them."

The AI checks:

- Recipient context
- Existing interaction
- Message intent
- External links
- Promotional language
- User's account state
- Previous outreach behavior

Then it may recommend:

```text
🟢 Send
🟡 Rewrite first
🔴 Don't send this version
```

The system can also suggest a safer alternative.

---

## 5. "What should I do on Reddit today?"

This is the proactive AI Coach.

The AI looks at:

- Current account state
- Recent activity
- Communities
- Relevant discussions
- Previous outcomes
- Current opportunities

Then creates:

```text
YOUR REDDIT PLAN

1. 💬 Comment on this discussion
   Strong match with your experience.

2. 🔖 Save this post
   Interesting, but not worth entering yet.

3. 📝 Create a post in r/...
   Good account + topic fit.

4. ⚠️ Avoid posting in r/...
   Low account fit and stricter rules.
```

---

# 🧠 Core Intelligence Model

The product should combine four major signals:

```text
                ┌──────────────────┐
                │  USER ACCOUNT     │
                │  history/activity │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │    COMMUNITY     │
                │ rules + culture  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │     CONTENT      │
                │ post/comment/DM  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │     MEMORY       │
                │ past actions     │
                │ past outcomes    │
                └────────┬─────────┘
                         │
                         ▼
                 AI DECISION ENGINE
                         │
                         ▼
                   RECOMMENDATION
```

---

# 🏗️ High-Level Architecture

```text
                         REDDIT
                           │
                      OAuth / API
                           │
                           ▼
                  ┌─────────────────┐
                  │ Python Backend  │
                  │     FastAPI     │
                  └────────┬────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        PostgreSQL      Reddit Data    AI Layer
        + pgvector                     LangGraph
             │                           │
             │                    ┌──────┼──────┐
             │                    │      │      │
             │                    ▼      ▼      ▼
             │                 Account Community Content
             │                 Analysis Analysis Analysis
             │                    │      │      │
             │                    └──────┼──────┘
             │                           ▼
             │                      Risk Engine
             │                           │
             │                    Recommendation
             │                           │
             └───────────────────────────┘
                                         │
                                         ▼
                                  User Approval
                                         │
                                         ▼
                                      Reddit
```

---

# 🛠️ Planned Technology Stack

## Frontend

- Next.js
- React
- Tailwind CSS
- shadcn/ui

The first UI will intentionally be simple. Visual polish will be added later.

## Backend

- Python
- FastAPI

## Database

- PostgreSQL
- pgvector for embeddings/retrieval

## AI

- OpenAI models
- Structured outputs
- Prompting and evaluation

## Agent Orchestration

- LangChain
- LangGraph

## Memory

- PostgreSQL
- pgvector
- Persistent LangGraph state / application-level memory

## Background Work

- Redis
- BullMQ or a Python-compatible job queue

## Observability

- LangSmith

## Reddit

- Reddit OAuth
- Reddit API
- Supported user-action capabilities

## Deployment

- Docker
- Vercel for frontend
- Managed PostgreSQL
- Container-based backend hosting

---

# 🧩 Product Modules

The final product is planned around these modules:

```text
1. Reddit Account
2. Home / Feed
3. Communities
4. Post Detail
5. Create Post
6. Messages
7. Link Analyzer
8. AI Coach
9. Account Intelligence
10. Community Intelligence
11. Memory
12. Notifications
```

---

# 🗺️ Phase-Wise Development Roadmap

The project will be built one feature at a time.

Do **not** build everything at once.

Every phase should leave behind a working feature that can be tested before moving forward.

---

## Phase 0 — Project Foundation

### Goal

Create the basic application structure.

### Build

- Repository
- Python environment
- FastAPI backend
- Basic frontend
- Environment variables
- Basic frontend ↔ backend communication
- PostgreSQL connection

### Result

A simple page:

```text
Reddit AI Copilot

[Connect Reddit]
```

### Learn

- Python project structure
- FastAPI basics
- API requests/responses
- Environment variables
- Database basics

---

# Phase 1 — Reddit OAuth

### Goal

Connect a real Reddit account.

### Build

- "Connect Reddit"
- OAuth authorization
- Callback handling
- Store authenticated Reddit account information
- Secure token handling

### Result

After login:

```text
Username: ...
Karma: ...
Account information: ...
```

### Learn

- OAuth
- Authentication
- API integration
- JSON data handling

---

# Phase 2 — Account Data

### Goal

Build a local representation of the Reddit account.

### Collect / store

- Profile information
- Posts
- Comments
- Relevant communities
- Activity history

### Result

The application understands the connected user's account.

### Learn

- PostgreSQL schema design
- CRUD operations
- Data normalization
- API synchronization

---

# Phase 3 — Reddit Feed

### Goal

Make the platform useful before introducing AI.

### Build

- Home feed
- Post cards
- Voting UI where supported
- Open post
- Community information

### Result

The user can browse Reddit through the platform.

### Learn

- Frontend data fetching
- Pagination
- Loading/error states
- Backend API design

---

# Phase 4 — Post Detail

### Goal

Build complete post context.

### Build

- Post detail page
- Comments
- Community information
- User information
- Existing discussion context

### Result

The application has the full context required for future AI analysis.

---

# Phase 5 — First AI Feature: Analyze Post

### Goal

Introduce GenAI without adding agents yet.

Add:

```text
🤖 Analyze with AI
```

AI should explain:

- What the post is about
- What the user is asking
- Main discussion points
- What kind of contribution would be useful

### Result

The first real GenAI feature works end-to-end.

### Learn

- LLM API integration
- Prompt design
- Structured outputs
- AI response handling

---

# Phase 6 — Comment Intelligence

### Goal

Build the first "AI Copilot" workflow.

User:

> "I want to comment."

AI checks the current post and recommends:

```text
Should you comment?
      ↓
YES / NO / WAIT

Why?

Recommended approach:
...

Suggested comment:
...
```

User can:

- Edit
- Approve
- Cancel

After approval, the comment is sent through the supported Reddit action flow.

### Result

**Post → AI recommendation → comment → Reddit**

This is the first major product milestone.

---

# Phase 7 — Community Rules / RAG

### Goal

Introduce retrieval properly.

Collect relevant community rules and guidance.

Store them for retrieval.

Before posting/commenting:

```text
Content
  +
Community Rules
  ↓
Retrieval
  ↓
LLM Analysis
  ↓
Rule-aware Recommendation
```

### Check

- Required flair
- Content restrictions
- Self-promotion rules
- External link restrictions
- Community-specific requirements

### Result

The AI can explain:

> "This may be a problem because of this community rule."

### Learn

- Chunking
- Embeddings
- Vector retrieval
- pgvector
- RAG

---

# Phase 8 — Account-Aware Risk Analysis

### Goal

Make recommendations personal.

The AI now receives:

```text
Post
+
Community
+
Rules
+
User Account
+
User History
```

Possible output:

```text
Topic fit: High
Account fit: Low
Community risk: Medium

Recommendation:
Do not post here yet.
```

### Result

The system no longer gives generic Reddit advice.

It gives:

> **Advice for this specific user's account.**

---

# Phase 9 — Community Recommendation Engine

### Goal

Answer:

> "Where should I post this?"

Compare multiple communities.

Example:

```text
Community       Topic Fit    Account Fit    Risk      Recommendation

r/webdev        High         High           Low       ✅
r/SaaS          High         Medium         Medium    🟡
r/XYZ            High         Low            High      ❌
```

### Result

The product recommends the best community **for the user's current situation**.

---

# Phase 10 — Create Post + AI Preflight

### Goal

Allow users to create posts inside the platform.

Flow:

```text
Create Post
    ↓
Write Draft
    ↓
Choose Community
    ↓
AI Preflight
    ↓
Check Account
    ↓
Check Rules
    ↓
Check Culture
    ↓
Risk + Recommendations
    ↓
User approves
    ↓
Publish to Reddit
```

### Result

The user can create and safely review a Reddit post without leaving the platform.

---

# Phase 11 — LangGraph Workflows

### Goal

Introduce stateful agentic workflows when the product actually needs them.

Example:

```text
User Request
     ↓
Intent
     ↓
Fetch Post
     ↓
Fetch Community
     ↓
Fetch Rules
     ↓
Fetch User Context
     ↓
Retrieve Memory
     ↓
Analyze
     ↓
Risk Check
     ↓
Recommendation
     ↓
Generate Response
     ↓
Human Approval
     ↓
Reddit Action
```

### Learn

- LangGraph state
- Nodes
- Edges
- Conditional routing
- Persistence
- Human-in-the-loop

---

# Phase 12 — Personal Memory

### Goal

Make the system remember the user.

Store useful long-term information such as:

- Communities the user understands well
- Communities where the user frequently participates
- Successful content patterns
- Previous mistakes
- Previous moderation outcomes
- User preferences

Example:

```text
Previous event:
Promotional post + direct link
→ removed in community

Future recommendation:
⚠️ Avoid repeating this pattern
```

### Result

The AI becomes personalized over time.

---

# Phase 13 — DM Intelligence

### Goal

Add AI-assisted messaging.

Flow:

```text
Write DM
   ↓
Analyze recipient/context
   ↓
Analyze user's account
   ↓
Check promotional/spam signals
   ↓
Risk recommendation
   ↓
Rewrite if necessary
   ↓
User approves
   ↓
Send through supported Reddit action
```

---

# Phase 14 — Inbox Inside the Platform

### Goal

Bring Reddit messaging into the application.

The user can:

- View messages
- Open conversations
- Reply
- Start messages where supported
- Use AI assistance

AI can also prioritize:

```text
Needs response
Interesting
Low priority
Potential risk
```

---

# Phase 15 — Notifications

### Goal

Keep the user informed inside the platform.

Examples:

```text
🔔 Someone replied to your comment
🔔 Your post received a reply
🤖 AI found a relevant conversation
⚠️ A draft needs attention
```

AI can prioritize notifications based on importance.

---

# Phase 16 — AI Coach

### Goal

Make the assistant proactive.

User asks:

> "What should I do on Reddit today?"

The system analyzes the current account and Reddit context and recommends:

```text
1. Comment here
2. Save this
3. Post in this community
4. Avoid this community for now
```

### Result

The product becomes a Reddit strategist instead of just a writing assistant.

---

# Phase 17 — Account Intelligence

### Goal

Create a personal account dashboard.

Example:

```text
ACCOUNT READINESS

Community participation     84
Content fit                 91
Promotion risk              64
Recent moderation issues    78

Overall AI readiness        76/100
```

These are application-level heuristic signals, not official Reddit scores.

The system should explain each recommendation.

---

# Phase 18 — Community DNA

### Goal

Go beyond written rules.

For each community, build a changing profile based on available data.

Example:

```text
COMMUNITY DNA

Rules:
Strict

Typical content:
Technical discussions

Promotion tolerance:
Low

External links:
Moderate restriction

Popular formats:
Questions
Technical writeups
Experience-based discussions

Your fit:
91%
```

The system should learn:

> **Rules tell you what is allowed. Community DNA helps you understand what usually works.**

---

# Phase 19 — Outcome Learning

### Goal

Close the learning loop.

Every important action becomes:

```text
Recommendation
      ↓
User Action
      ↓
Reddit Outcome
      ↓
Observe
      ↓
Store Result
      ↓
Update Memory
      ↓
Improve Future Recommendations
```

Example:

```text
Recommended:
Technical comment

Result:
High engagement

Learning:
User's technical comments perform well
```

Or:

```text
Recommended:
Promotional post

Result:
Removed

Learning:
This community + this content pattern is risky
```

This is one of the most important long-term product capabilities.

---

# Phase 20 — Full Reddit AI Copilot

At this point the full product comes together.

```text
                        USER
                         │
                         ▼
                  REDDIT AI COPILOT
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
      READ             CREATE           ACT
        │                │                │
        ▼                ▼                ▼
      Feed             Post             Comment
      Inbox            Draft            DM
      Communities      Preflight        Save
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                  PERSONAL AI BRAIN
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Account        Community       Content
     Intelligence   Intelligence    Intelligence
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                       Memory
                         │
                         ▼
                    Recommendation
                         │
                         ▼
                    User Approval
                         │
                         ▼
                       Reddit
                         │
                         ▼
                       Outcome
                         │
                         ▼
                    Learn / Update
```

---

# 📌 Recommended Build Order

Do not jump randomly between technologies.

Follow this order:

```text
1. Python
2. FastAPI
3. PostgreSQL
4. Reddit OAuth
5. Reddit API
6. Account sync
7. Feed
8. Post detail
9. Direct LLM integration
10. AI post analysis
11. Comment workflow
12. Community rules
13. RAG / embeddings / pgvector
14. Personalized account analysis
15. Community recommendation
16. Create post + preflight
17. LangGraph
18. Memory
19. DM intelligence
20. Inbox / notifications
21. AI Coach
22. Account Intelligence
23. Community DNA
24. Outcome learning
25. Product polish / deployment
```

---

# 🎯 First MVP

The first usable MVP should **not** include everything.

Build only:

```text
Connect Reddit
      ↓
View account
      ↓
View feed
      ↓
Open post
      ↓
"Analyze with AI"
      ↓
"Should I comment?"
      ↓
Suggested comment
      ↓
User approval
      ↓
Comment on Reddit
```

Once this works reliably, expand feature by feature.

---

# 🔒 Product Principle

The system should follow:

> **AI recommends. Human approves.**

The AI should never silently perform important actions.

For actions that publish, message, or otherwise act as the user, the implementation must respect Reddit's current API/developer rules and supported user-action capabilities.

---

# 💡 Long-Term Vision

The first version is Reddit-focused.

Later, the underlying concept could expand into a general:

> **Personal AI social-media operating layer**

Possible future platforms:

- Reddit
- Discord
- X
- LinkedIn
- Other communities

But the initial product should stay focused on **Reddit** and become extremely good at understanding one platform first.

---

# 🧠 Why This Project Is Interesting

This project is not primarily:

- A Reddit clone
- A chatbot
- A post generator
- A simple RAG application
- A spam bot

The core idea is:

> **An AI system that understands a user's account, the community, the content and past outcomes, then helps the user make better decisions before acting.**

That gives the project room to demonstrate:

- Python
- API integration
- OAuth
- Backend engineering
- PostgreSQL
- RAG
- Embeddings
- LangChain
- LangGraph
- Memory
- Human-in-the-loop
- AI evaluation
- Product thinking
- Real-world automation

---

# ✅ Current Development Strategy

**Build small → test → understand → improve → move to the next phase.**

Do not optimize the final UI too early.

The first priority is:

> **Make the core user experience work.**

Then continuously improve:

```text
Functionality
    ↓
Reliability
    ↓
AI quality
    ↓
Memory
    ↓
Automation
    ↓
UX
    ↓
Visual polish
    ↓
Production readiness
```

---

## Project Status

### Phase 0 — ✅ Completed
### Phase 1 — ✅ Completed
### Phase 2 — 🔄 Next Up
### Phase 3 — ⬜ Not started
### Phase 4 — ⬜ Not started
### Phase 5 — ⬜ Not started
### Phase 6 — ⬜ Not started
### Phase 7 — ⬜ Not started
### Phase 8 — ⬜ Not started
### Phase 9 — ⬜ Not started
### Phase 10 — ⬜ Not started
### Phase 11 — ⬜ Not started
### Phase 12 — ⬜ Not started
### Phase 13 — ⬜ Not started
### Phase 14 — ⬜ Not started
### Phase 15 — ⬜ Not started
### Phase 16 — ⬜ Not started
### Phase 17 — ⬜ Not started
### Phase 18 — ⬜ Not started
### Phase 19 — ⬜ Not started
### Phase 20 — ⬜ Not started

---

# License

To be decided.
