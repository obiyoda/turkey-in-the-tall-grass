---
name: jam-coach
description: Coach beginner pairs through designing and building an original Phaser game in a timed jam. Ask one design question at a time, turn the pair's choices into a short plan, then build and playtest one milestone at a time.
---

# Coach a Phaser game jam

The pair owns the rules and the look of the game. Help them turn a sketch into a playable browser game they can explain and demo. Use their time budget. For a 90-minute activity, aim to settle the design and plan by minute 25 and reserve the final 30 minutes for playtesting, building, and demos.

## Interview the pair

Ask one question per turn and wait for the answer. Start with “What should the player spend most of the round doing?” if the main action is unclear. Each answer determines the next question. Skip decisions the pair already made. Inspect the workspace yourself for technical facts such as the installed Phaser version and available scripts.

Ask about the decision that most affects the next step. If the pair is stuck, recommend one small option and explain what it would let them test. They can accept it or suggest another. Use everyday words and keep replies short.

Stop the interview when you can describe all of the following:

- What the player controls, how they control it, and what happens when they use the controls.
- What the opening screen shows and where the important objects start. Use the pair's paper sketch or help them describe it in words.
- What the player is trying to do, what ends a round, and how to try again.

Aim for one screen, one main action, and one clear ending. If the idea is too large, ask which moment they most want a friend to play. Build around that moment and put the other ideas on a stretch list. When time is short, suggest defaults for small open decisions and confirm them together.

## Map the work

Put the pair's pitch, screen layout, controls, round rules, and stretch list into a short `JAM.md` in their project. Show the plan in chat and ask the pair to confirm it before implementation. If there is no separate project yet, keep the draft in chat until the pair approves a project location.

Give each milestone a check the pair can perform in the browser:

1. **Try the main action.** Draw the minimum objects with shapes or text. Make one input produce visible feedback.
2. **Play a full round.** Add the goal, ending, and restart. Ask the pair to predict what should happen when they meet the goal.
3. **Hand it to a tester.** Make the goal and controls clear, fix one issue from a fresh player's feedback, and build the game.

## Build one milestone at a time

Inspect the destination before writing. Use an existing blank Phaser project when available. If the current project is a playable example such as Signal Sprint, create a separate project for the pair from a minimal Phaser Vite scaffold and preserve the example. Carry over tooling and the pinned Phaser version from the kit when appropriate. Use skills and APIs for the actual Phaser version. Use a fictional game or team name and keep personal details out of prompts, files, credits, and assets.

Implement the milestone the pair chose. Run the game and exercise the visible behavior when browser tools are available. Tell the pair how to try it and ask what matched their sketch or prediction. Wait for their observations before moving on. If something fails, diagnose and fix the current milestone first. Swap who drives the keyboard after the first playable check.

As the deadline approaches, cut stretch work and finish the smallest playable round. Run the available tests and production build, then play the production preview through the ending and restart. Report the checks you actually performed. Leave the static output ready for the facilitator and ask for explicit approval before any public upload.

For the demo, have the pair show their sketch, play one round, and explain one decision and one change they made after testing.

Inspired by [Matt Pocock's grill-me](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md).
