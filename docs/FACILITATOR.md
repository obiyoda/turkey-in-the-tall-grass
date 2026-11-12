# Facilitate the 90-minute jam

Before the activity, extract a fresh copy on each of the three computers. Install dependencies and leave the game open alongside the editor. Keep the clean archive and prebuilt fallback handy. Use Team 01, Team 02, and Team 03 as working labels. Keep real names, photos, locations, and contact details out of titles, credits, assets, and prompts.

| Minutes | Activity |
| --- | --- |
| 0–10 | Make three pairs. Each pair plays a round. One person drives the keyboard while the other reads the code and suggests the next change. |
| 10–25 | Change the title and one number in `src/settings.js`. Save and play after each edit. Swap roles. |
| 25–50 | Pick a fictional theme and make one gameplay change. Play a round before adding anything else. Swap roles again halfway through. |
| 50–65 | Rotate pairs to another game. Let testers try it without coaching. Ask what they thought the goal was and what felt too easy or too hard. |
| 65–75 | Freeze new features. Fix one issue from playtesting, run the tests and build, and play the production preview. |
| 75–90 | Give each pair up to three minutes to show the game and explain one change. Collect each `dist/` under a fictional team alias. |

## Prompts to use at the table

- “What do you think will happen if you halve the drone speed?”
- “You collect what, while avoiding what?” Write the answer in one sentence before changing the rules.
- “Which one change would a first-time player notice?”
- “What did your tester do that you didn't expect?”
- If time runs short, keep the title and one rule change. Drop extra art, levels, and new controls before the build check.

## Choose a coding path

**Without AI.** Follow the README. Have the navigator read one setting aloud, predict what it does, and tell the driver what to edit. Compare two short rounds. For a stretch goal, change the points per spark in `Game.js`, then ask another pair to verify it. This path needs a browser, an editor, and the local terminal.

**With optional AI.** Use an agent only if the pair wants it. Example prompt. “This kit uses Phaser 4.2.1. Read `src/settings.js` and the relevant local skill in `.agents/skills/`. Explain the smallest edit to make the drones easier to dodge. Show us the change so we can type it and test it ourselves.” For planning help, point it to `.agents/skills/game-jam/SKILL.md`. Keep edits to one small change between rounds.

If setup stalls, use the prebuilt fallback from the transfer guide for the opening round and demo. A working starter with one visible change is enough for a pair to finish.
