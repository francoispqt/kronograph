'use strict';

const moment = require('moment-timezone');
const assert = require('assert');
const tz = 'Europe/Paris';

const Kronograph = require('../')({
    tz,
    interval: 1
});

const now = moment.tz(tz);

Kronograph.addAction('testAction', (rule, done) => {
    let rT = moment.tz(tz);
    try {
        console.log(rT.diff(now, 'seconds'));
        assert(rT.diff(now, 'seconds') === 60 || rT.diff(now, 'seconds') === 61);
        console.log('\o/ Test interval succesful !');
        testDone();
    } catch(err) {
        console.error(err);
        console.error(':( Test failed.');
        process.exit(1);
    }
    done();
});

Kronograph.addAction('testActionTime', (rule, done) => {
    let rT = moment.tz(tz);
    try {
        assert(rT.minutes() === nM);
        console.log('\o/ Test time succesful !');
        testDone();
    } catch(err) {
        console.error(err);
        console.error(':( Test failed.');
        process.exit(1);
    }
    done();
});

Kronograph.addRule({
    name : 'testRuleInterval',
    calendar: 'interval',
    interval: 60,
    action: 'testAction',
    active: true,
});

let nM = now.clone().add(1, 'minutes').minutes()

Kronograph.addRule({
    name: 'testRuleTime',
    calendar: 'daily',
    hours: now.hours(),
    minutes: nM,
    action: 'testActionTime',
    active: true,
});

let testD = 0;
const testDone = () => {
    testD++;
    if (testD === 2) {
        console.log('\o/ Tests succesful !');
        process.exit(0);
    }
}
