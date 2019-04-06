var playState = {
    preload: function () {
        game.stage.backgroundColor = '#3498db';

        game.load.spritesheet('player', 'assets/player.png', 28, 22);
        game.load.image('wall', 'assets/wall.png');
        game.load.image('ground', 'assets/ground.png');
        game.load.image('dust', 'assets/dust.png');
        game.load.image('exp', 'assets/exp.png');
        game.load.image('enemy', 'assets/enemy.png');
        game.load.image('coin', 'assets/coin.png');

        game.load.image('castle1H', 'assets/Castles/Castle1H.png');
        game.load.image('castle1M', 'assets/Castles/Castle1M.png');
        game.load.image('castle1L', 'assets/Castles/Castle1L.png');
        game.load.image('castle2H', 'assets/Castles/Castle2H.png');
        game.load.image('castle2M', 'assets/Castles/Castle2M.png');
        game.load.image('castle2L', 'assets/Castles/Castle2L.png');

        game.load.image('warrior1', 'assets/Warriors/Warrior1_64.png');
        game.load.image('warrior2', 'assets/Warriors/Warrior2_64.png');
        game.load.image('chariot1', 'assets/Warriors/Chariot1_64.png');
        game.load.image('chariot2', 'assets/Warriors/Chariot2_64.png');

        if (!game.device.desktop) {
            game.load.image('right', 'assets/right.png');
            game.load.image('left', 'assets/left.png');
        }
        game.load.image('jump', 'assets/jump.png');

        // game.load.audio('dead', ['assets/dead.wav', 'assets/dead.mp3']);
        // game.load.audio('dust', ['assets/dust.wav', 'assets/dust.mp3']);
        // game.load.audio('jump', ['assets/jump.wav', 'assets/jump.mp3']);
        // game.load.audio('coin', ['assets/coin.wav', 'assets/coin.mp3']);
    },

    create: function () {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        this.cursor = game.input.keyboard.createCursorKeys();
        game.input.keyboard.addKeyCapture([Phaser.Keyboard.UP, Phaser.Keyboard.DOWN, Phaser.Keyboard.RIGHT, Phaser.Keyboard.LEFT]);

        this.level = 0;
        game.sound.mute = true;

        this.deadSound = game.add.audio('dead', 0.1);

        this.player = game.add.sprite(250, 50, 'player');
        this.player.anchor.setTo(0.5, 0.5);
        game.physics.arcade.enable(this.player);
        this.player.body.gravity.y = 600;
        this.player.animations.add('idle', [3, 4, 5, 4], 5, true);
        this.player.body.setSize(20, 20, 0, 0);
        this.playerDead = false;

        this.players = {
            one: {
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

        this.players.one.attack = game.add.group();
        this.players.one.attack.enableBody = true;
        this.players.second.attack = game.add.group();
        this.players.one.attack.enableBody = true;

        this.loadLevel();
        this.setParticles();

        this.spawnPlayer();
    },

    update: function () {
        game.physics.arcade.collide(this.player, this.level);
        //game.physics.arcade.overlap(this.player, this.enemy, this.spawnPlayer, null, this);
        //game.physics.arcade.overlap(this.player, this.coins, this.takeCoin, null, this);

        this.inputs();

        this.exp.forEachAlive(function (p) {
            p.alpha = game.math.clamp(p.lifespan / 100, 0, 1);
        }, this);

        game.physics.arcade.collide(this.players.one.attack, this.level);
        game.physics.arcade.collide(this.players.second.attack, this.level);
        game.physics.arcade.overlap(this.players.one.attack, this.players.second.attack, this.warriorsCollision, null, this);

    },

    inputs: function () {

        var space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        if (this.cursor.left.isDown || this.moveLeft) {
            this.player.body.velocity.x = -200;
            this.player.frame = 2;
            game.sound.mute = false;
        } else if (this.cursor.right.isDown || this.moveRight) {
            this.player.body.velocity.x = 200;
            this.player.frame = 1;
            game.sound.mute = false;
        } else {
            this.player.body.velocity.x = 0;
        }

        if (this.player.body.velocity.x === 0)
            this.player.animations.play('idle');

        if (this.player.body.touching.down && this.player.y > 100) {
            if (this.hasJumped) {
                this.dust.x = this.player.x;
                this.dust.y = this.player.y + 10;
                this.dust.start(true, 300, null, 8);
            }

            this.hasJumped = false;
        }

        if (this.cursor.up.isDown) {
            this.jumpPlayer();
        }

        if (space.isDown && !this.spaceDown) {
            console.log("Space down");
            this.spawnWarrior(1);
            this.spawnWarrior(2);
        }
        this.spaceDown = space.isDown;
    },
    spawnWarrior: function (x) {
        if (x === 1) {
            let tmp;
            tmp = game.add.sprite(this.players.one.spawnPos.y, this.players.one.spawnPos.x, 'warrior1', 0, this.players.one.attack);
            tmp.anchor.setTo(0.5, 0.5);
            game.physics.arcade.enable(tmp);
            tmp.body.gravity.y = 600;
            tmp.body.setSize(20, 20, 0, 0);
            tmp.body.velocity.x = 50;
        } else {
            let tmp;
            tmp = game.add.sprite(this.players.second.spawnPos.y, this.players.second.spawnPos.x, 'chariot2', 0, this.players.second.attack);
            tmp.anchor.setTo(0.5, 0.5);
            game.physics.arcade.enable(tmp);
            tmp.body.gravity.y = 600;
            tmp.body.setSize(20, 20, 0, 0);
            tmp.body.velocity.x = -50;
        }
    },

    warriorsCollision: function (a, b) {
        a.body.enable = false;
        b.body.enable = false;

        game.add.tween(a.scale).to({x: 0}, 150).start();
        game.add.tween(a).to({y: 50}, 150).start();

        game.add.tween(b.scale).to({x: 0}, 150).start();
        game.add.tween(b).to({y: 50}, 150).start();
    },

    jumpPlayer: function () {
        if (this.player.body.touching.down && this.player.y > 100) {
            game.sound.mute = false;
            this.hasJumped = true;
            this.player.body.velocity.y = -220;
        }
    },

    spawnPlayer: function () {
        if (this.playerDead) {
            this.exp.x = this.player.x;
            this.exp.y = this.player.y + 10;
            this.exp.start(true, 300, null, 20);

            this.shakeEffect(this.level);
            //this.shakeEffect(this.enemy);

            this.deadSound.play();
        }

        this.player.scale.setTo(0, 0);
        game.add.tween(this.player.scale).to({x: 1, y: 1}, 300).start();
        //this.player.reset(250, 50);

        this.hasJumped = true;
        this.playerDead = true;

        this.moveLeft = false;
        this.moveRight = false;

        //this.addCoins();
    },

    loadLevel: function (coins, enemies) {
        this.level = game.add.group();
        this.level.enableBody = true;
        this.enemies = game.add.group();

        for (var i = 0; i < level.length; i++) {
            for (var j = 0; j < level[i].length; j++) {
                switch (level[i][j]) {
                    case 'x':
                        var wallSprite = game.add.sprite(20 * j, 20 * i, 'wall', 0, this.level);
                        wallSprite.tint = 0x41aa31;
                        break;
                    case '1':
                        console.log("Spawn position of 1: " + 20 * i + " " + 20 * j);
                        this.players.one.spawnPos.x = 20 * i;
                        this.players.one.spawnPos.y = 20 * j;
                        break;
                    case '2':
                        console.log("Spawn position of 2: " + 20 * i + " " + 20 * j);
                        this.players.second.spawnPos.x = 20 * i;
                        this.players.second.spawnPos.y = 20 * j;
                        break;
                    case 'H':
                        game.add.sprite(20 * j, 20 * i, 'castle1H', 0, this.level);
                        break;
                    case 'M':
                        game.add.sprite(20 * j, 20 * i, 'castle1M', 0, this.level);
                        break;
                    case 'L':
                        game.add.sprite(20 * j, 20 * i, 'castle1L', 0, this.level);
                        break;
                    case 'h':
                        game.add.sprite(20 * j, 20 * i, 'castle2H', 0, this.level);
                        break;
                    case 'm':
                        game.add.sprite(20 * j, 20 * i, 'castle2M', 0, this.level);
                        break;
                    case 'l':
                        game.add.sprite(20 * j, 20 * i, 'castle2L', 0, this.level);
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

        this.exp = game.add.emitter(0, 0, 20);
        this.exp.makeParticles('exp');
        this.exp.setYSpeed(-150, 150);
        this.exp.setXSpeed(-150, 150);
        this.exp.gravity = 0;
    },

    shakeEffect: function (g) {
        var move = 5;
        var time = 20;

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

var width = window.innerWidth;
var height = window.innerHeight * 0.8;
var game = new Phaser.Game(width, height, Phaser.AUTO, 'joc');

game.state.add('play', playState);
game.state.start('play');
