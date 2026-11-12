import Phaser from 'phaser';
import { SETTINGS } from '../../settings.js';
import { ARENA, clamp, movementVector, overlaps, roundResult, safePosition } from '../../rules.js';

export class Game extends Phaser.Scene {
    create() {
        const { colors, title, team } = SETTINGS;
        document.title = title;
        document.querySelector('h1').textContent = title;
        document.querySelector('#team').textContent = team;
        document.querySelector('#goal').textContent = `Collect ${SETTINGS.targetScore} sparks in ${SETTINGS.roundSeconds} seconds. Dodge the drones.`;
        this.status = document.querySelector('#game-status');
        this.hud = document.querySelector('#hud');
        this.stage = document.querySelector('#game-container');

        const grid = this.add.graphics().lineStyle(1, colors.grid);
        for (let x = 16; x <= 944; x += 32) grid.lineBetween(x, 84, x, 536);
        for (let y = 84; y <= 536; y += 32) grid.lineBetween(16, y, 944, y);
        grid.lineStyle(2, colors.grid).strokeRect(16, 84, 928, 452);
        this.add.text(32, 29, 'SIGNAL FIELD', {
            fontFamily: 'monospace', fontSize: '24px', color: '#afc5db'
        });

        this.player = this.add.circle(480, 310, 15, colors.player).setDepth(1);
        this.sparks = Array.from({ length: SETTINGS.sparkCount }, () =>
            this.add.star(0, 0, 4, 5, 14, colors.spark));
        this.drones = Array.from({ length: SETTINGS.droneCount }, () =>
            this.add.rectangle(0, 0, 25, 25, colors.drone).setAngle(45));

        this.arrows = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
        this.input.keyboard.removeCapture('SPACE');
        this.input.keyboard.on('keydown-SPACE', event => {
            if (document.activeElement !== this.stage) return;
            event.preventDefault();
            if (!event.repeat) this.startOrResume();
        });
        this.input.keyboard.on('keydown-ESC', event => {
            if (!event.repeat) this.togglePause();
        });
        this.input.keyboard.on('keydown-R', event => {
            if (!event.repeat) this.startRound();
        });

        document.querySelector('#start').onclick = () => this.startOrResume();
        document.querySelector('#pause').onclick = () => this.togglePause();
        document.querySelector('#restart').onclick = () => this.startRound();
        this.resetRound('ready', 'Ready. Press Start to play.');
    }

    resetRound(phase, message) {
        this.round = {
            phase,
            score: 0,
            lives: SETTINGS.startingLives,
            seconds: SETTINGS.roundSeconds,
            invincible: 0
        };
        this.player.setPosition(480, 310).setAlpha(1);
        for (const object of [...this.sparks, ...this.drones]) this.respawn(object);
        this.status.textContent = message;
        this.showScore();
    }

    respawn(object) {
        const { x, y } = safePosition(Math.random, this.player);
        object.setPosition(x, y);
    }

    startRound() {
        this.resetRound('playing', 'Run started.');
        this.stage.focus();
    }

    startOrResume() {
        if (this.round.phase === 'paused') {
            this.togglePause();
        } else if (this.round.phase !== 'playing') {
            this.startRound();
        } else {
            this.stage.focus();
        }
    }

    togglePause() {
        if (this.round.phase === 'playing') {
            this.round.phase = 'paused';
            this.status.textContent = 'Paused.';
        } else if (this.round.phase === 'paused') {
            this.round.phase = 'playing';
            this.status.textContent = 'Run resumed.';
            this.stage.focus();
        }
    }

    showScore() {
        const { score, lives, seconds } = this.round;
        const text = `Sparks ${score}/${SETTINGS.targetScore} · Lives ${lives} · ${Math.ceil(seconds)}s`;
        if (this.hud.textContent !== text) this.hud.textContent = text;
    }

    update(_time, delta) {
        const round = this.round;
        if (round.phase !== 'playing') return;

        const seconds = delta / 1000;
        const { left, right, up, down } = this.arrows;
        const { W, A, S, D } = this.wasd;
        const horizontal = Number(right.isDown || D.isDown) - Number(left.isDown || A.isDown);
        const vertical = Number(down.isDown || S.isDown) - Number(up.isDown || W.isDown);
        const direction = movementVector(horizontal, vertical);
        this.player.x = clamp(this.player.x + direction.x * SETTINGS.playerSpeed * seconds, ARENA.left, ARENA.right);
        this.player.y = clamp(this.player.y + direction.y * SETTINGS.playerSpeed * seconds, ARENA.top, ARENA.bottom);

        for (const spark of this.sparks) {
            if (overlaps(spark, this.player, 25)) {
                round.score += 1;
                this.respawn(spark);
            }
        }

        round.invincible = Math.max(0, round.invincible - seconds);
        for (const drone of this.drones) {
            const chase = movementVector(this.player.x - drone.x, this.player.y - drone.y);
            drone.x += chase.x * SETTINGS.droneSpeed * seconds;
            drone.y += chase.y * SETTINGS.droneSpeed * seconds;
            if (round.invincible === 0 && overlaps(drone, this.player, 28)) {
                round.lives -= 1;
                round.invincible = SETTINGS.invincibleSeconds;
                this.respawn(drone);
                if (round.lives <= 0) break;
            }
        }
        this.player.setAlpha(round.invincible > 0 ? 0.55 : 1);

        round.seconds = Math.max(0, round.seconds - seconds);
        round.phase = roundResult(round.score, round.lives, round.seconds, SETTINGS.targetScore);
        if (round.phase === 'won') this.status.textContent = 'You win! Press R to play again.';
        if (round.phase === 'lost') {
            const reason = round.lives <= 0 ? 'Out of lives.' : 'Time is up.';
            this.status.textContent = `${reason} Press R to try again.`;
        }
        this.showScore();
    }
}
