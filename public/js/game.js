var playState = {
    preload: function () {
        game.stage.backgroundColor = '#E3D1FF';

        game.load.image('background', 'assets/Background_purple_mountains.png');

        game.load.spritesheet('player', 'assets/player.png', 28, 22);
        game.load.image('wall', 'assets/wall.png');
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

        this.units1 = ['warrior1', 'chariot1', 'spy1', 'wizard1'];
        this.units2 = ['warrior2', 'chariot2', 'spy2', 'wizard2'];


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

        this.loadLevel();
        this.setParticles();

        this.spawnPlayer();
    },

    update: function () {

        this.inputs();

        this.exp.forEachAlive(function (p) {
            p.alpha = game.math.clamp(p.lifespan / 100, 0, 1);
        }, this);

        game.physics.arcade.collide(this.players.one.attack, this.level);
        game.physics.arcade.collide(this.players.second.attack, this.level);
        game.physics.arcade.overlap(this.players.one.attack, this.players.second.attack, this.warriorsCollision, null, this);

    },

    inputs: function () {

        let space = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

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
        let tmp = x === 1 ? game.add.sprite(this.players.one.spawnPos.y, this.players.one.spawnPos.x, this.getRandomUnit(1), 0, this.players.one.attack) :
            game.add.sprite(this.players.second.spawnPos.y, this.players.second.spawnPos.x, this.getRandomUnit(2), 0, this.players.second.attack);
        tmp.anchor.setTo(1, 1);
        game.physics.arcade.enable(tmp);
        tmp.body.gravity.y = 600;
        tmp.body.setSize(20, 20, 0, 0);
        tmp.body.velocity.x = x === 1 ? 200 : -200;
    },

    getRandomUnit: function (player) {
        return player === 1 ? this.units1[Math.floor(Math.random() * this.units1.length)] : this.units2[Math.floor(Math.random() * this.units2.length)];
    },

    warriorsCollision: function (a, b) {
        a.body.enable = false;
        b.body.enable = false;

        this.blood.x = (a.x + b.x) / 2;
        this.blood.y = (a.y + b.y) / 2;
        this.blood.start(true, 300, null, 50);

        game.add.tween(a.scale).to({x: 0}, 1).start();
        game.add.tween(b.scale).to({x: 0}, 1).start();

        this.shakeEffect(this.background);

    },

    loadLevel: function (coins, enemies) {
        this.background = game.add.group();
        this.level = game.add.group();
        this.level.enableBody = true;
        this.castles = game.add.group();
        this.background.enableBody = true;
        game.add.sprite(0, 0, 'background', 0, this.background);
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


        for (var i = 0; i < level.length; i++) {
            for (var j = 0; j < level[i].length; j++) {
                switch (level[i][j]) {
                    case 'x':
                        let wallSprite = game.add.sprite(20 * j, 20 * i, 'wall', 0, this.level);
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

var width = window.innerWidth;
var height = window.innerHeight * 0.8;
var game = new Phaser.Game(width, height, Phaser.AUTO, 'joc');

game.state.add('play', playState);
game.state.start('play');
