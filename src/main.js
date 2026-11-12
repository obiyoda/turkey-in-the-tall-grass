import Phaser from 'phaser';

const width = 960;
const height = 560;
const worldWidth = 1450;
const worldHeight = 990;
const sight = 240;
const tree = { x: 515, y: 455 };
const ringRadius = 180;
const campfires = [{ x: 370, y: 470 }, { x: 880, y: 605 }];
const demonHome = { x: 1260, y: 797 };
const teleportSpots = [{ x: 185, y: 215 }, { x: 460, y: 670 }, { x: 780, y: 195 }, { x: 1070, y: 735 }];
const chest = { x: 929, y: 605 };
const apple = { x: 1310, y: 825 };
const patches = [
    [155, 120, 160, 105], [390, 265, 205, 100], [655, 95, 165, 130],
    [965, 250, 230, 105], [205, 510, 185, 130], [555, 540, 185, 140],
    [855, 680, 210, 145], [1210, 775, 170, 130], [405, 790, 185, 100],
];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function moveToward(actor, target, amount) {
    const gap = distance(actor, target);
    if (gap === 0) return;
    const fraction = Math.min(amount / gap, 1);
    actor.x += (target.x - actor.x) * fraction;
    actor.y += (target.y - actor.y) * fraction;
}

class Woods extends Phaser.Scene {
    create() {
        this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT,SPACE,R,ENTER,E,F,G');
        this.input.keyboard.addCapture('SPACE,UP,LEFT,DOWN,RIGHT');
        this.field = this.add.graphics();
        this.fog = this.add.graphics();
        this.status = document.querySelector('#game-status');
        this.reset('ready');
        document.querySelector('#start').onclick = () => this.reset('playing');
        document.querySelector('#restart').onclick = () => this.reset('playing');
    }

    reset(state) {
        this.state = state;
        this.insideTree = false;
        this.ringFound = false;
        this.ringPulse = 0;
        this.chestOpened = false;
        this.gear = new Set();
        this.armorGrace = 0;
        this.gearNotice = '';
        this.gearNoticeTime = 0;
        this.attackFlash = null;
        const spots = [{ x: 240, y: 280 }, { x: 350, y: 685 }, { x: 620, y: 210 },
            { x: 820, y: 450 }, { x: 1110, y: 700 }, { x: 1170, y: 430 }];
        this.lootChests = Phaser.Utils.Array.Shuffle(spots).slice(0, 3)
            .map((spot, i) => ({ ...spot, item: ['Armor', 'Sword', 'Bow'][i], opened: false }));
        this.triton = null;
        this.chestMessage = 0;
        this.bisonCaughtPlayer = false;
        this.demonCaughtPlayer = false;
        this.pythonCaughtPlayer = false;
        this.python = { x: 610, y: 730, cooldown: 2, warning: 0, lunge: 0 };
        this.chicken = { x: 330, y: 340 };
        this.teleportNotice = 0;
        this.demon = { ...demonHome, concealed: true };
        this.player = { x: 95, y: 100, facing: 1, hidden: false };
        this.hunters = [
            { x: 495, y: 195, patrol: [{ x: 740, y: 440 }, { x: 290, y: 395 }, { x: 495, y: 195 }], next: 0 },
            { x: 1090, y: 590, patrol: [{ x: 1290, y: 490 }, { x: 1190, y: 890 }, { x: 890, y: 605 }], next: 0, ranged: true, aim: 0 },
        ];
        this.grass = patches.map(bounds => ({ bounds, warning: 0, gone: 0 }));
        this.wizard = { x: 815, y: 400, next: 0, route: [
            { x: 650, y: 590 }, { x: 945, y: 745 }, { x: 1090, y: 300 }, { x: 490, y: 310 },
        ] };
        this.foodBoost = 1;
        this.rawBison = false;
        this.mooseArmor = 0;
        this.moose = { name: 'Moose', x: 1010, y: 420, home: { x: 1010, y: 420 }, target: null, facing: 1 };
        this.bison = { name: 'Bison', x: 700, y: 480, home: { x: 700, y: 480 }, target: null, facing: 1 };
        this.draw();
    }

    updateChargingAnimal(bison, dt) {
        const targets = this.hunters.filter(hunter => !hunter.knockedOut);
        if (!this.player.hidden && !this.insideTree) targets.push(this.player);
        if (!targets.includes(bison.target) || distance(bison, bison.target) > 260) {
            bison.target = targets.reduce((nearest, target) => {
                return distance(bison, target) < (nearest ? distance(bison, nearest) : 145)
                    ? target : nearest;
            }, null);
        }
        const destination = bison.target ?? bison.home;
        bison.facing = Math.sign(destination.x - bison.x) || bison.facing;
        moveToward(bison, destination, (bison.target ? 195 : 65) * dt);
        if (bison.target && distance(bison, bison.target) < 27) {
            if (bison.target === this.player) {
                if (this.absorbHit()) {
                    bison.target = null;
                    return;
                }
                this.state = 'lost';
                this.bisonCaughtPlayer = bison.name;
            } else {
                bison.target.knockedOut = true;
            }
            bison.target = null;
        }
    }

    updateWizard(dt) {
        const wizard = this.wizard;
        const waypoint = wizard.route[wizard.next];
        if (!this.tickStun(wizard, dt)) moveToward(wizard, waypoint, 82 * dt);
        if (distance(wizard, waypoint) < 1) wizard.next = (wizard.next + 1) % wizard.route.length;

        for (const patch of this.grass) {
            if (patch.gone > 0) {
                patch.gone = Math.max(0, patch.gone - dt);
            } else if (patch.warning > 0) {
                patch.warning -= dt;
                if (patch.warning <= 0) patch.gone = 7;
            } else {
                const [x, y, w, h] = patch.bounds;
                if (!wizard.stun && distance(wizard, { x: x + w / 2, y: y + h / 2 }) < 100) patch.warning = 1.3;
            }
        }
    }

    notifyGear(message) {
        this.gearNotice = message;
        this.gearNoticeTime = 2;
    }

    absorbHit() {
        if (this.armorGrace > 0) return true;
        if (this.mooseArmor > 0) this.mooseArmor--;
        else if (!this.gear.delete('Armor')) return false;
        this.armorGrace = 1.5;
        this.notifyGear('Armor absorbed the hit!');
        return true;
    }

    useWeapon(item, reach) {
        if (!this.gear.has(item) || this.insideTree || this.attackFlash) return;
        const p = this.player;
        const targets = [...this.hunters, this.bison, this.moose, this.wizard, this.demon, this.python]
            .filter(actor => !actor.knockedOut && (!actor.concealed || actor.stun) && distance(p, actor) <= reach)
            .sort((a, b) => distance(p, a) - distance(p, b));
        const target = targets[0];
        if (target === this.bison || target === this.moose) {
            target.knockedOut = true;
            target.target = null;
            this.notifyGear(target.name + ' defeated · Press E nearby to collect');
        } else if (target) {
            target.stun = Math.max(target.stun ?? 0, 2.5);
            target.spotted = false;
            if (target.ranged) target.aim = 0;
            if (target === this.bison || target === this.moose) target.target = null;
        }
        this.attackFlash = { item, reach, target, time: 0.35 };
    }

    nearbyDrop() {
        return [this.bison, this.moose].find(animal =>
            animal.knockedOut && !animal.collected && distance(this.player, animal) < 48);
    }

    nearCampfire() {
        return campfires.some(fire => distance(this.player, fire) < 48);
    }

    interact() {
        if (this.insideTree) {
            this.insideTree = false;
            return;
        }
        const animal = this.nearbyDrop();
        if (animal) {
            animal.collected = true;
            if (animal === this.bison) {
                this.rawBison = true;
                this.notifyGear('Bison meat collected · Find a campfire');
            } else {
                this.foodBoost = 1.89;
                this.mooseArmor = 2;
                this.notifyGear('Moose upgrade · 89% faster and two armor hits');
            }
            return;
        }
        if (this.rawBison && this.nearCampfire()) {
            this.rawBison = false;
            this.foodBoost = Math.max(this.foodBoost, 1.56);
            this.notifyGear('Smoked bison meat eaten · 56% speed boost');
            return;
        }
        const loot = this.lootChests.find(box => !box.opened && distance(this.player, box) < 48);
        if (loot) {
            loot.opened = true;
            this.gear.add(loot.item);
            this.notifyGear(loot.item + ' equipped!');
            return;
        }
        if (!this.chestOpened && distance(this.player, chest) < 48) {
            this.chestOpened = true;
            this.chestMessage = 3;
            if (Math.random() < 0.5) {
                this.triton = { time: 0.8, strikes: [] };
                for (const actor of [...this.hunters, this.bison, this.moose, this.wizard, this.demon, this.python]) {
                    if (!actor.knockedOut && distance(actor, chest) < 240) {
                        actor.stun = Math.max(actor.stun ?? 0, 4);
                        actor.spotted = false;
                        if (actor.ranged) actor.aim = 0;
                        if (actor === this.bison || actor === this.moose) actor.target = null;
                        this.triton.strikes.push({ x: actor.x, y: actor.y });
                    }
                }
                if (!this.triton.strikes.length) this.triton.strikes.push({ x: chest.x + 75, y: chest.y - 35 });
            }
            return;
        }
        if (distance(this.player, tree) < 48) {
            this.insideTree = true;
            this.player.hidden = false;
            this.player.x = tree.x;
            this.player.y = tree.y + 15;
            if (this.ringFound) return;
            this.ringFound = true;
            this.insideTree = false;
            this.ringPulse = 0.65;
            for (const actor of [...this.hunters, this.bison, this.moose, this.wizard, this.demon, this.python]) {
                if (distance(actor, tree) <= ringRadius) {
                    actor.stun = 4;
                    actor.spotted = false;
                    if (actor.ranged) actor.aim = 0;
                    if (actor === this.bison || actor === this.moose) actor.target = null;
                }
            }
        }
    }

    tickStun(actor, dt) {
        actor.stun = Math.max(0, (actor.stun ?? 0) - dt);
        return actor.stun > 0;
    }

    updateNewCharacters(dt) {
        const p = this.player;
        this.teleportNotice = Math.max(0, this.teleportNotice - dt);
        if (!this.insideTree && distance(p, this.chicken) < 25) {
            Object.assign(p, Phaser.Utils.Array.GetRandom(teleportSpots), { hidden: false });
            this.teleportNotice = 2;
        }

        const demon = this.demon;
        if (this.tickStun(demon, dt)) return;
        const guarding = !p.hidden && !this.insideTree && distance(p, apple) < 155;
        moveToward(demon, guarding ? p : demonHome, (guarding ? 120 : 85) * dt);
        demon.concealed = !guarding && distance(demon, demonHome) < 1;
        if (guarding && distance(p, demon) < 22 && !this.absorbHit()) {
            this.demonCaughtPlayer = true;
            this.state = 'lost';
        }
    }

    updatePython(dt) {
        const snake = this.python;
        if (this.tickStun(snake, dt)) return;
        const p = this.player;
        const visible = !p.hidden && !this.insideTree;
        snake.cooldown = Math.max(0, snake.cooldown - dt);

        if (snake.warning > 0) {
            snake.warning = Math.max(0, snake.warning - dt);
            if (snake.warning === 0 && visible) {
                snake.destination = { x: p.x, y: p.y };
                snake.lunge = 0.45;
            }
        } else if (snake.lunge > 0) {
            snake.lunge = Math.max(0, snake.lunge - dt);
            moveToward(snake, snake.destination, 320 * dt);
            if (visible && distance(snake, p) < 23 && !this.absorbHit()) {
                this.pythonCaughtPlayer = true;
                this.state = 'lost';
            }
        } else if (visible && snake.cooldown === 0 && distance(snake, p) < 235) {
            const angle = Math.random() * Math.PI * 2;
            snake.x = Phaser.Math.Clamp(p.x + Math.cos(angle) * 105, 18, worldWidth - 18);
            snake.y = Phaser.Math.Clamp(p.y + Math.sin(angle) * 105, 18, worldHeight - 18);
            snake.warning = 0.7;
            snake.cooldown = 4;
        }
    }

    inGrass() {
        const { x, y } = this.player;
        return this.grass.some(({ bounds: [left, top, w, h], gone }) =>
            gone === 0 && x >= left && x <= left + w && y >= top && y <= top + h);
    }

    update(_time, delta) {
        const k = this.keys;
        const pressed = Phaser.Input.Keyboard.JustDown;
        if (pressed(k.R) || (pressed(k.ENTER) && this.state !== 'playing')) this.reset('playing');
        if (this.state !== 'playing') return;
        const dt = Math.min(delta, 50) / 1000;
        this.armorGrace = Math.max(0, this.armorGrace - dt);
        this.gearNoticeTime = Math.max(0, this.gearNoticeTime - dt);
        if (this.attackFlash && (this.attackFlash.time -= dt) <= 0) this.attackFlash = null;
        if (pressed(k.F)) this.useWeapon('Sword', 66);
        if (pressed(k.G)) this.useWeapon('Bow', 225);
        if (pressed(k.E)) this.interact();
        this.ringPulse = Math.max(0, this.ringPulse - dt);
        this.chestMessage = Math.max(0, this.chestMessage - dt);
        if (this.triton) this.triton.time = Math.max(0, this.triton.time - dt);
        this.updateWizard(dt);
        const p = this.player;
        if (!this.inGrass()) p.hidden = false;
        if (pressed(k.SPACE) && this.inGrass()) p.hidden = !p.hidden;
        const dx = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
        const dy = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
        const length = Math.hypot(dx, dy) || 1;
        const moveSpeed = p.hidden ? 66 : 172;
        const ringBoost = this.ringFound ? 1.35 : 1;
        const speed = this.insideTree ? 0 : moveSpeed * Math.max(ringBoost, this.foodBoost) * dt / length;
        p.x = Phaser.Math.Clamp(p.x + dx * speed, 18, worldWidth - 18);
        p.y = Phaser.Math.Clamp(p.y + dy * speed, 18, worldHeight - 18);
        if (dx) p.facing = dx;
        if (!this.inGrass()) p.hidden = false;

        this.updateNewCharacters(dt);
        if (this.state === 'playing') this.updatePython(dt);
        for (const animal of [this.bison, this.moose]) {
            if (this.state === 'playing' && !animal.knockedOut && !this.tickStun(animal, dt)) {
                this.updateChargingAnimal(animal, dt);
            }
        }
        for (const hunter of this.hunters) {
            if (hunter.knockedOut || this.tickStun(hunter, dt) || this.state !== 'playing') continue;
            const gap = distance(hunter, p);
            hunter.spotted = !p.hidden && !this.insideTree && gap < (hunter.ranged ? 205 : 155);
            if (hunter.ranged) {
                hunter.aim = hunter.spotted ? hunter.aim + dt : 0;
                if (hunter.aim >= 1.15) {
                    hunter.aim = 0;
                    if (!this.absorbHit()) this.state = 'lost';
                }
            }
            if (hunter.spotted && !hunter.ranged) {
                moveToward(hunter, p, 148 * dt);
                if (distance(hunter, p) < 24 && !this.absorbHit()) this.state = 'lost';
            } else if (!hunter.spotted) {
                const waypoint = hunter.patrol[hunter.next];
                moveToward(hunter, waypoint, 69 * dt);
                if (distance(hunter, waypoint) < 1) hunter.next = (hunter.next + 1) % hunter.patrol.length;
            }
        }
        if (this.state === 'playing' && distance(p, apple) < 24) this.state = 'won';
        this.draw();
    }

    draw() {
        const p = this.player;
        const ox = width / 2 - p.x;
        const oy = height / 2 - p.y;
        const g = this.field.clear();
        const dot = (x, y, radius, color) => g.fillStyle(color).fillCircle(x + ox, y + oy, radius);
        g.fillStyle(0x344a35).fillRect(ox, oy, worldWidth, worldHeight);
        for (let i = 0; i < 215; i++) {
            const x = (i * 139 + 71) % worldWidth;
            const y = (i * 173 + 29) % worldHeight;
            dot(x, y, 2 + i % 3, 0x53644a);
        }
        for (const { bounds: [x, y, w, h], gone, warning } of this.grass) {
            if (gone > 0) {
                g.fillStyle(0x544756).fillRoundedRect(x + ox, y + oy, w, h, 16);
                continue;
            }
            g.fillStyle(0x536b37).fillRoundedRect(x + ox, y + oy, w, h, 16);
            g.lineStyle(2, warning > 0 ? 0xefacf8 : 0x96a953);
            for (let i = 0; i < 38; i++) {
                const gx = x + ox + 12 + (i * 37) % (w - 24);
                const gy = y + oy + 16 + (i * 29) % (h - 24);
                g.lineBetween(gx, gy, gx - 4, gy - 9);
                g.lineBetween(gx, gy, gx + 4, gy - 12);
            }
        }
        for (const box of this.lootChests) {
            const x = box.x + ox;
            const y = box.y + oy;
            g.fillStyle(box.opened ? 0x464d59 : 0x425973).fillRoundedRect(x - 15, y - 10, 30, 20, 4);
            g.lineStyle(2, 0xa6c4dc).lineBetween(x - 14, y, x + 14, y);
            if (!box.opened) dot(box.x, box.y, 3, 0xe2efff);
        }
        const cx = chest.x + ox;
        const cy = chest.y + oy;
        g.fillStyle(0x734a2a).fillRoundedRect(cx - 16, cy - 10, 32, 22, 4);
        g.lineStyle(3, 0xd9ac59).lineBetween(cx - 15, cy, cx + 15, cy);
        if (!this.chestOpened) g.fillStyle(0xffdc88).fillRect(cx - 3, cy - 4, 6, 9);
        if (this.triton && this.chestMessage > 0) {
            for (let i = -2; i <= 2; i++) {
                dot(chest.x - 24, chest.y - 38 + i * 7, 9, i % 2 ? 0x9f6943 : 0x69432c);
            }
            dot(chest.x - 12, chest.y - 38, 12, 0x825236);
            dot(chest.x - 6, chest.y - 49, 7, 0xba8756);
            if (this.triton.time > 0) {
                g.lineStyle(4, 0xffe59e, Math.min(1, this.triton.time * 4));
                for (const strike of this.triton.strikes) {
                    const x = strike.x + ox;
                    const y = strike.y + oy;
                    g.lineBetween(x - 16, y - 155, x + 12, y - 81);
                    g.lineBetween(x + 12, y - 81, x - 14, y - 48);
                    g.lineBetween(x - 14, y - 48, x, y);
                }
            }
        }

        dot(tree.x, tree.y, 36, 0x244129);
        dot(tree.x - 16, tree.y - 18, 27, 0x365f35);
        dot(tree.x + 16, tree.y - 21, 27, 0x456d36);
        g.fillStyle(0x604331).fillRoundedRect(tree.x + ox - 15, tree.y + oy - 4, 30, 33, 8);
        dot(tree.x, tree.y + 15, 10, 0x201c18);
        if (!this.ringFound) g.lineStyle(3, 0xffd57d).strokeCircle(tree.x + ox, tree.y + oy + 15, 5);
        if (this.ringPulse > 0) {
            const progress = 1 - this.ringPulse / 0.65;
            g.lineStyle(4, 0xffdc88, 1 - progress).strokeCircle(tree.x + ox, tree.y + oy, 8 + progress * ringRadius);
        }

        dot(apple.x, apple.y, 15, 0x344122);
        dot(apple.x - 4, apple.y, 9, 0xa9f350);
        dot(apple.x + 4, apple.y, 9, 0x85d33f);
        g.fillStyle(0xd0ed87).fillEllipse(apple.x + ox + 4, apple.y + oy - 10, 9, 4);

        for (const h of this.hunters) {
            if (h.knockedOut) continue;
            if (h.spotted && h.ranged) {
                g.lineStyle(2 + h.aim * 3, 0xff9a71, 0.75)
                    .lineBetween(h.x + ox, h.y + oy, width / 2, height / 2);
            }
            dot(h.x, h.y, 17, h.spotted ? 0xd56549 : h.ranged ? 0x8c6eaa : 0x9b5b38);
            dot(h.x, h.y - 10, 8, 0xdab58c);
            g.fillStyle(h.ranged ? 0x4c355f : 0x62351f)
                .fillRoundedRect(h.x + ox - 13, h.y + oy - 17, 26, 8, 3);
        }

        const wizard = this.wizard;
        dot(wizard.x, wizard.y, 15, 0x7852a0);
        dot(wizard.x, wizard.y - 11, 8, 0xe5c2a5);
        g.fillStyle(0x9d71c3).fillTriangle(wizard.x + ox - 13, wizard.y + oy - 14,
            wizard.x + ox + 12, wizard.y + oy - 14, wizard.x + ox - 2, wizard.y + oy - 34);

        for (const fire of campfires) {
            dot(fire.x, fire.y, 21, 0x65564b);
            dot(fire.x, fire.y, 14, 0xe76e37);
            dot(fire.x, fire.y + 3, 8, 0xffcc67);
        }
        for (const animal of [this.bison, this.moose]) {
            const { x, y, facing } = animal;
            if (animal.knockedOut) {
                if (!animal.collected) dot(x, y, 10, 0xf1b76d);
                continue;
            }
            if (animal.target) g.lineStyle(2, 0xf2aa58).strokeCircle(x + ox, y + oy, 29);
            g.fillStyle(0x805938).fillEllipse(x + ox, y + oy, 47, 29);
            dot(x + facing * 9, y - 4, 16, 0x654027);
            dot(x + facing * 22, y + 1, 11, 0x4b3224);
            const hornX = x + ox + facing * 23;
            g.lineStyle(3, 0xe8d4a6).lineBetween(hornX, y + oy - 6, hornX + facing * 5, y + oy - 13);
            if (animal === this.moose) {
                g.lineBetween(hornX + facing * 5, y + oy - 13, hornX, y + oy - 26);
                g.lineBetween(hornX + facing * 5, y + oy - 13, hornX + facing * 12, y + oy - 23);
            }
        }

        const chicken = this.chicken;
        dot(chicken.x, chicken.y, 12, 0xfff8e9);
        dot(chicken.x + 8, chicken.y - 8, 7, 0xffffff);
        dot(chicken.x + 7, chicken.y - 16, 3, 0xe25550);
        dot(chicken.x + 11, chicken.y - 9, 2, 0x211c19);
        dot(chicken.x + 15, chicken.y - 6, 3, 0xf1af52);

        const demon = this.demon;
        if (!demon.concealed || demon.stun) {
            for (let i = -2; i <= 2; i++) dot(demon.x - 12, demon.y + i * 6, 8, 0x773450);
            dot(demon.x, demon.y, 13, 0x36253b);
            dot(demon.x + 9, demon.y - 9, 8, 0x53314a);
            dot(demon.x + 12, demon.y - 10, 3, 0xff6b66);
            g.lineStyle(3, 0xc26977).lineBetween(demon.x + ox + 7, demon.y + oy - 14,
                demon.x + ox + 4, demon.y + oy - 22);
        }
        const snake = this.python;
        const sx = snake.x + ox;
        const sy = snake.y + oy;
        if (snake.warning > 0 && !snake.stun) g.lineStyle(2, 0xffc670).strokeCircle(sx, sy, 26);
        for (let i = 0; i < 6; i++) {
            dot(snake.x - i * 5, snake.y + Math.sin(i) * 7, 8 - i * 0.7, i % 2 ? 0xbaa15b : 0x74622d);
        }
        dot(snake.x + 5, snake.y - 2, 8, 0xc5ad65);
        dot(snake.x + 8, snake.y - 4, 2, 0x231e15);
        for (const actor of [...this.hunters, wizard, this.bison, this.moose, demon, snake]) {
            if (actor.stun && !actor.knockedOut) {
                g.lineStyle(2, 0xffdc88).strokeCircle(actor.x + ox, actor.y + oy, 28);
            }
        }

        for (let i = -2; i <= 2; i++) {
            dot(p.x - p.facing * (15 - Math.abs(i) * 2), p.y - 5 + i * 6, 8, i % 2 ? 0xe19d58 : 0xa95435);
        }
        dot(p.x, p.y, 13, p.hidden ? 0xbaa86c : 0x85553c);
        dot(p.x + p.facing * 10, p.y - 10, 7, 0xddad80);
        dot(p.x + p.facing * 13, p.y - 12, 2, 0x211c19);
        g.fillStyle(0xf3bf54).fillTriangle(width / 2 + p.facing * 15, height / 2 - 10,
            width / 2 + p.facing * 24, height / 2 - 7, width / 2 + p.facing * 15, height / 2 - 5);
        if (p.hidden) g.lineStyle(2, 0xc5df80).strokeCircle(width / 2, height / 2, 26);

        if (this.attackFlash) {
            const { item, reach, target, time } = this.attackFlash;
            g.lineStyle(3, 0xe4efff, time / 0.35);
            if (item === 'Sword') g.strokeCircle(width / 2, height / 2, reach);
            else g.lineBetween(width / 2, height / 2,
                target ? target.x + ox : width / 2 + p.facing * reach, target ? target.y + oy : height / 2);
        }
        const fog = this.fog.clear().fillStyle(0x101a15);
        for (let y = 0; y < height; y += 2) {
            const radius = Math.sqrt(Math.max(0, sight ** 2 - (y + 1 - height / 2) ** 2));
            fog.fillRect(0, y, width / 2 - radius, 2);
            fog.fillRect(width / 2 + radius, y, width / 2 - radius, 2);
        }
        const message = {
            ready: 'Press Enter or Start to explore.',
            won: 'You found the green apple! Press R to play again.',
            lost: this.pythonCaughtPlayer ? 'The python caught you. Press R to try again.'
                : this.demonCaughtPlayer ? 'The demon turkey caught you. Press R to try again.'
                : this.bisonCaughtPlayer ? `The ${this.bisonCaughtPlayer.toLowerCase()} caught you. Press R to try again.`
                : 'The hunters got you. Press R to try again.',
            playing: this.insideTree ? 'Inside the apple tree · Press E to leave'
                : this.ringPulse > 0 ? 'Magic ring found · Movement speed increased'
                : snake.warning > 0 && !snake.stun ? 'The python teleported nearby! Dodge or hide.'
                : this.teleportNotice > 0 ? 'The white chicken teleported you!'
                : this.gearNoticeTime > 0 ? this.gearNotice
                : this.nearbyDrop() ? 'Press E to collect the animal drop'
                : this.rawBison && this.nearCampfire() ? 'Campfire · Press E to smoke and eat bison meat'
                : this.lootChests.some(box => !box.opened && distance(p, box) < 48) ? 'Gear chest · Press E to open'
                : this.chestMessage > 0 ? (this.triton ? 'Triton summoned lightning!' : 'The chest was empty.')
                : !this.chestOpened && distance(p, chest) < 48 ? 'Chest · Press E to open'
                : distance(p, tree) < 48 ? 'Hollow apple tree · Press E to enter'
                : p.hidden ? 'Hidden · Move slowly through the grass'
                : this.moose.target === p ? 'The moose is charging! Hide in tall grass.'
                : this.bison.target === p ? 'The bison is charging! Hide in tall grass.'
                : !this.hunters[1].knockedOut && this.hunters[1].spotted ? 'Spotted! Break the line or hide in tall grass.'
                : this.inGrass() ? 'Tall grass · Press Space to hide' : 'Search the woods for the green apple.',
        }[this.state];
        document.querySelector('#gear').textContent = [...this.gear, ...(this.rawBison ? ['Bison meat'] : []), ...(this.mooseArmor ? [`Moose armor ×${this.mooseArmor}`] : [])].join(' · ');
        if (this.status.textContent !== message) this.status.textContent = message;
    }
}

new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'game-container',
    backgroundColor: '#202b21',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width, height },
    scene: Woods,
});
