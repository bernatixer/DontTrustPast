const UNITS = Object.freeze({WARRIOR: "warrior", CHARIOT: "chariot", SPY: "spy", WIZARD: "wizard"});

const WARRIOR_SPEED = 50;
const CHARIOT_SPEED = 150;
const SPY_SPEED = 400;
const WIZARD_SPEED = 65;

const getUnitSpeed = function (team, type) {
    let speed = 0;
    switch (type) {
        case UNITS.WARRIOR:
            speed = team === 1 ? WARRIOR_SPEED : -WARRIOR_SPEED;
            break;
        case UNITS.CHARIOT:
            speed = team === 1 ? CHARIOT_SPEED : -CHARIOT_SPEED;
            break;
        case UNITS.SPY:
            speed = team === 1 ? SPY_SPEED : -SPY_SPEED;
            break;
        case UNITS.WIZARD:
            speed = team === 1 ? WIZARD_SPEED : -WIZARD_SPEED;
            break;
    }
    return speed;
};


const getRandomUnit = function() {
    return UNITS[Object.keys(UNITS)[Math.floor(Math.random()*Object.keys(UNITS).length)]];
};