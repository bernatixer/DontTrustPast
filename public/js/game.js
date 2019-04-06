var playState = {
    preload: function () {
        game.stage.backgroundColor = BACKGROUND_6;

        game.load.image('background', 'assets/Background_purple_mountains.png');

        game.load.spritesheet('player', 'assets/player.png', 28, 22);
        game.load.image('grass', 'assets/grass.png');
        game.load.image('grass2', 'assets/grass2.png');
        game.load.image('ground', 'assets/ground.png');
        game.load.image('dust', 'assets/dust.png');
        game.load.image('blood', 'assets/blood.png');
        game.load.image('exp', 'assets/exp.png');
        game.load.image('enemy', 'assets/enemy.png');
        game.load.image('coin', 'assets/coin.png');

        game.load.image('castle1H', 'assets/Castles/Castle1H.png');
        game.load.image('castle1M', 'assets/Castles/Castle1M.png');
        game.load.image('castle1L', 'assets/Castles/Castle1L.png');
        game.load.image('castle2H', 'assets/Castles/Castle2H.png');
        game.load.image('castle2M', 'assets/Castles/Castle2M.png');
        game.load.image('castle2L', 'assets/Castles/Castle2L.png');

        game.load.image('warrior1', 'assets/Warriors/Warrior1_32.png');
        game.load.image('warrior2', 'assets/Warriors/Warrior2_32.png');
        game.load.image('chariot1', 'assets/Warriors/Chariot1_32.png');
        game.load.image('chariot2', 'assets/Warriors/Chariot2_32.png');
        game.load.image('spy1', 'assets/Warriors/Spy1_32.png');
        game.load.image('spy2', 'assets/Warriors/Spy2_32.png');
        game.load.image('wizard1', 'assets/Warriors/Wizard1_32.png');
        game.load.image('wizard2', 'assets/Warriors/Wizard2_32.png');


        if (!game.device.desktop) {
            game.load.image('right', 'assets/right.png');
            game.load.image('left', 'assets/left.png');
        }
        game.load.image('jump', 'assets/jump.png');
    },

    create: function () {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.cursor = game.input.keyboard.createCursorKeys();
        game.input.keyboard.addKeyCapture([Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, Phaser.Keyboard.RIGHT, Phaser.Keyboard.LEFT]);

        this.level = 0;
        game.sound.mute = true;

        this.loadLevel();
        this.setParticles();
        },

    update: function () {
        this.inputs();

        this.exp.forEachAlive(function (p) {
            p.alpha = game.math.clamp(p.lifespan / 100, 0, 1);
        }, this);

        game.physics.arcade.collide(this.players.first.attack, this.level);
        game.physics.arcade.collide(this.players.second.attack, this.level);
        game.physics.arcade.overlap(this.players.first.attack, this.players.second.attack, this.warriorsCollision, null, this);
    },

    inputs: function () {
        let attackUnit = game.input.keyboard.addKey(Phaser.KeyCode.A);
        let spy = game.input.keyboard.addKey(Phaser.KeyCode.S);
        let defend = game.input.keyboard.addKey(Phaser.KeyCode.D);
        let wizard = game.input.keyboard.addKey(Phaser.KeyCode.W);

        if (attackUnit.isDown && !this.attackDown) {
          attack('attack');
        }

        if (spy.isDown && !this.spyDown) {
          attack('spy');
        }

        if (defend.isDown && !this.defendDown) {
          attack('deffense');
        }

        if (wizard.isDown && !this.wizardDown) {
          // attack('wizard');
        }
        this.attackDown = attackUnit.isDown;
        this.spyDown = spy.isDown;
        this.defendDown = defend.isDown;
        this.wizardDown = wizard.isDown;
    },

    spawnUnit: function (team, type) {
        const Team = team === 1 ? this.players.first : this.players.second;
        let tmp = game.add.sprite(Team.spawnPos.y, Team.spawnPos.x, type + team.toString(), 0, Team.attack);
        tmp.anchor.setTo(1, 1);
        game.physics.arcade.enable(tmp);
        tmp.body.gravity.y = 600;
        tmp.body.setSize(20, 20, 0, 0);
        tmp.body.velocity.x = getUnitSpeed(team, type);
    },

    warriorsCollision: function (a, b) {
        a.body.enable = false;
        b.body.enable = false;

        this.blood.x = (a.x + b.x) / 2;
        this.blood.y = (a.y + b.y) / 2;
        this.blood.start(true, 300, null, 50);

        game.add.tween(a.scale).to({x: 0}, 1).start();
        game.add.tween(b.scale).to({x: 0}, 1).start();

        // this.shakeEffect(this.background);
    },

    loadLevel: function () {
        this.background = game.add.group();
        this.level = game.add.group();
        this.level.enableBody = true;
        this.castles = game.add.group();
        this.background.enableBody = true;
        game.add.sprite(0, 0, 'background', 0, this.background);
        this.players = {
            first: {
                spawnPos: {
                    x: null,
                    y: null
                },
                attack: null
            },
            second: {
                spawnPos: {
                    x: null,
                    y: null
                },
                attack: null
            }
        };

        this.players.first.attack = game.add.group();
        this.players.first.attack.enableBody = true;
        this.players.second.attack = game.add.group();
        this.players.first.attack.enableBody = true;


        for (let i = 0; i < level.length; i++) {
            for (let j = 0; j < level[i].length; j++) {
                switch (level[i][j]) {
                    case 'x':
                        game.add.sprite(20 * j, 20 * i, 'grass', 0, this.level);
                        break;
                    case 'y':
                        game.add.sprite(20 * j, 20 * i, 'grass2', 0, this.level);
                        break;
                    case '1':
                        this.players.first.spawnPos.x = 20 * i;
                        this.players.first.spawnPos.y = 20 * j;
                        break;
                    case '2':
                        this.players.second.spawnPos.x = 20 * i;
                        this.players.second.spawnPos.y = 20 * j;
                        break;
                    case 'H':
                        game.add.sprite(20 * j, 20 * i, 'castle1H', 0, this.castles);
                        break;
                    case 'M':
                        game.add.sprite(20 * j, 20 * i, 'castle1M', 0, this.castles);
                        break;
                    case 'L':
                        game.add.sprite(20 * j, 20 * i, 'castle1L', 0, this.castles);
                        break;
                    case 'h':
                        game.add.sprite(20 * j, 20 * i, 'castle2H', 0, this.castles);
                        break;
                    case 'm':
                        game.add.sprite(20 * j, 20 * i, 'castle2M', 0, this.castles);
                        break;
                    case 'l':
                        game.add.sprite(20 * j, 20 * i, 'castle2L', 0, this.castles);
                        break;
                }
            }
        }
        this.level.setAll('body.immovable', true);
        //game.physics.arcade.enable(this.enemy);
    },

    /*addCoins: function() {
        if (!this.coins) {
            this.coins = game.add.group();
            this.coins.enableBody = true;
        }
        else {
            this.coins.forEachAlive(function(e){
                e.kill();
            }, this);
        }

        game.add.sprite(140, 120, 'coin', 0, this.coins);
        game.add.sprite(170, 120, 'coin', 0, this.coins);
        game.add.sprite(200, 120, 'coin', 0, this.coins);

        this.coins.forEachAlive(function(e){
            e.isTaken = false;
            e.scale.setTo(0,0);
            e.anchor.setTo(0.5);
            game.add.tween(e.scale).to({x:1, y:1}, 200).start();
        }, this);
    },

    takeCoin: function(a, b) {
        b.body.enable = false;
        game.add.tween(b.scale).to({x:0}, 150).start();
        game.add.tween(b).to({y:50}, 150).start();
        this.coinSound.play();
    },*/

    setParticles: function () {
        this.dust = game.add.emitter(0, 0, 20);
        this.dust.makeParticles('dust');
        this.dust.setYSpeed(-100, 100);
        this.dust.setXSpeed(-100, 100);
        this.dust.gravity = 0;

        this.blood = game.add.emitter(0, 0, 200);
        this.blood.makeParticles('blood');
        this.blood.setYSpeed(-100, 100);
        this.blood.setXSpeed(-100, 100);
        this.blood.gravity = 0;

        this.exp = game.add.emitter(0, 0, 20);
        this.exp.makeParticles('exp');
        this.exp.setYSpeed(-150, 150);
        this.exp.setXSpeed(-150, 150);
        this.exp.gravity = 0;
    },

    shakeEffect: function (g) {
        let move = 5;
        let time = 5;

        game.add.tween(g)
            .to({y: "-" + move}, time).to({y: "+" + move * 2}, time * 2).to({y: "-" + move}, time)
            .to({y: "-" + move}, time).to({y: "+" + move * 2}, time * 2).to({y: "-" + move}, time)
            .to({y: "-" + move / 2}, time).to({y: "+" + move}, time * 2).to({y: "-" + move / 2}, time)
            .start();

        game.add.tween(g)
            .to({x: "-" + move}, time).to({x: "+" + move * 2}, time * 2).to({x: "-" + move}, time)
            .to({x: "-" + move}, time).to({x: "+" + move * 2}, time * 2).to({x: "-" + move}, time)
            .to({x: "-" + move / 2}, time).to({x: "+" + move}, time * 2).to({x: "-" + move / 2}, time)
            .start();
    }
};

const width = window.innerWidth;
const height = window.innerHeight * 0.8;
const game = new Phaser.Game(width, height, Phaser.AUTO, 'joc');

game.state.add('play', playState);
game.state.start('play');
