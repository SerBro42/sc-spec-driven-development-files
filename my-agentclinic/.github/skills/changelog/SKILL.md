---
name: changelog
description: 'Create and maintain a date-based CHANGELOG.md for the project. Use when documenting work, reviewing recent changes, or preparing a merge.'
argument-hint: 'Optional: specify the work being added to the changelog or the date to record'
user-invocable: true
disable-model-invocation: false
---

# Changelog maintenance

## When to use
- Start a project change log when the repo does not yet have one.
- Update the project root `CHANGELOG.md` before a merge or release checkpoint.
- Record recent work in a consistent date-based format for teammates and reviewers.

## Required behavior
1. Check whether a project-root `CHANGELOG.md` exists.
2. If it does not exist, inspect the repository commit history for dates and messages.
3. Group commit messages by date and convert them into brief bullet points.
4. Keep headings in the format `## YYYY-MM-DD`.
5. Put the newest date first.
6. Use concise, plain-language bullets that describe the work done.
7. If a changelog already exists, prepend new date sections and keep older entries intact.
8. Do not invent work or claim changes that are not supported by code or commit history.

## Procedure
1. Run:
   `git --no-pager log --date=short --pretty=format:"%ad %s"`
2. Review the dates and commit summaries.
3. Group the entries by date.
4. Convert each commit summary into a bullet in the relevant date section.
5. Write the file at the project root as `CHANGELOG.md`.
6. Keep markdown headings and bullets consistent and readable.

## Template
```md
# Changelog

## 2026-10-08
- Added Vitest validation workflow and route tests.
- Updated responsive UI requirements and CSS layout guidance.

## 2026-10-07
- Completed the Hello Hono phase and validation work.
```

## Merge reminder
Before merging changes, manually invoke this skill and review the changelog to ensure it reflects the branch accurately.
