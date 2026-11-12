import Phaser from 'phaser';
import { SETTINGS } from '../settings.js';
import { Game } from './scenes/Game.js';

export default function StartGame(parent) {
    return new Phaser.Game({
        type: Phaser.CANVAS,
        parent,
        width: 960,
        height: 560,
        backgroundColor: SETTINGS.colors.background,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [Game],
        audio: { noAudio: true },
        banner: false
    });
}
