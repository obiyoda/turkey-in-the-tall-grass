# Copy the kit to each Omarchy computer

## Clone from GitHub

On each computer, sign in to GitHub with an account that has access to the private repo. Use Node.js 22.12 or later. Node.js 24 LTS is the suggested version.

```sh
git clone https://github.com/obiyoda/game-jam-starter.git
cd game-jam-starter
npm ci
npm run check
npm run dev
```

Open [Signal Sprint](http://127.0.0.1:5173/). Give each pair its own copy. For an original game, open the starter in Codex and invoke `$jam-coach`. The skill guides the pair through designing and building a separate Phaser project. See the [facilitator guide](FACILITATOR.md) for the session plan.

## Copy from an archive

Copy `signal-sprint-kit.tar.gz` to the home folder on each of the other two computers using a USB drive or your usual file transfer. Keep one untouched copy as the clean backup. The archive includes the source, lockfile, instructions, and optional skills.

1. Check `node -v` and `npm -v`. Use your existing installation if Node is 22.12 or later and npm works. With nvm already installed, you can run `nvm install 24` and `nvm use 24`. On an up-to-date Omarchy machine missing Node, install the Arch packages with `sudo pacman -S --needed nodejs-lts-krypton npm`. If only npm is missing, install just `npm`. Use the browser and editor already on the computer. [Arch Node.js package](https://archlinux.org/packages/extra/x86_64/nodejs-lts-krypton/)
2. Extract into a fresh folder and install from the lockfile. Use a different folder name if `signal-sprint-work` already exists.

   ```sh
   cd ~
   mkdir signal-sprint-work
   tar -xzf signal-sprint-kit.tar.gz -C signal-sprint-work
   cd signal-sprint-work/signal-sprint
   npm ci
   npm run check
   npm run dev
   ```

3. Open [the local game](http://127.0.0.1:5173/). Start a round and move with the arrow keys. Open `src/settings.js` in an editor. Give each pair a separate extracted copy so they can edit independently.

Setup downloads the locked packages from npm. The kit uses the browser and a local Vite server for play. Git, a global Phaser install, and an AI account are optional.

## Play the prebuilt fallback

Copy `signal-sprint-play.tar.gz` as well if you want a playable copy even when npm setup stalls. With Python 3 available, run the following from the folder that holds the archive.

```sh
mkdir signal-sprint-play
tar -xzf signal-sprint-play.tar.gz -C signal-sprint-play
python3 -m http.server 4180 --bind 127.0.0.1 --directory signal-sprint-play
```

Open [the prebuilt game](http://127.0.0.1:4180/). Press Ctrl+C when finished. If Python 3 is missing, the Arch package is `python`. Use the editable kit to make changes.

## Publish a finished game after approval

1. In each team's source folder, run `npm run check` and `npm run preview`. Play the preview and review the title, credits, and assets for personal details.
2. After the facilitator approves public sharing, sign in to Cloudflare. Go to **Workers & Pages** and choose **Create application**, **Get started**, then **Drag and drop your files**.
3. Choose a fictional project name for the game. Drag in that team's `dist` folder. Check that `index.html` and `assets/` are at the root of the upload. Select **Deploy site** when ready.
4. Open the resulting `pages.dev` URL and play a round. Repeat with a separate project for each approved game.

[Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
