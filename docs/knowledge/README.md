# Project Knowledge Base

The engineering handbook explains how this codebase is built. This folder records what the project is about: the domain words people use, the decisions already made, and the questions still open. Agents read it before planning, so a new session starts from the agreed facts instead of re-asking them or guessing.

| File                                   | Holds                                                     | Update it when                                          |
| -------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| [glossary.md](glossary.md)             | Domain terms and their exact meaning in this project      | A term appears in a story, screen or API name           |
| [decisions.md](decisions.md)           | Decisions that shape behavior or architecture, with dates | Someone decides something a later change must respect   |
| [open-questions.md](open-questions.md) | Questions waiting for an owner's answer                   | A plan meets a question code and documents can't answer |

Rules:

- Write the current truth. When a decision changes, rewrite its entry and add the date; Git keeps the old version.
- Name the source of every decision (ticket, meeting, person) so it can be checked.
- Keep secrets, customer data and personal data out of this folder.
- The template ships these files empty. Fill them when the project starts, using the bootstrap prompt in [AI-assisted development](../engineering/ai-assisted-development.md#bootstrap-prompt-for-a-new-project).
