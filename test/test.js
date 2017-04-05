'use strict';

const moment = require('moment-timezone');
const assert = require('assert');
const tz = 'Europe/Paris';

const Kronograph = require('../lib/kronograph-engine')({
    tz,
    interval: 1000
});

const now = moment.tz(tz);

Kronograph.addAction('testAction', (rule, done) => {
    let rT = moment.tz(tz);
    try {
        console.log(rT.diff(now, 'seconds'));
        assert(rT.diff(now, 'seconds') === 60);
        console.log('\o/ Test succesful !');
        process.exit(0);
    } catch(err) {
        console.error(err);
        console.error(':( Test failed.');
        process.exit(1);
    }
    done();
});

Kronograph.addRule({
    name : 'testRule',
    calendar: 'interval',
    interval: 60,
    action: 'testAction',
    active: true,
});
