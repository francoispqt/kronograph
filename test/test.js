'use strict';

const moment = require('moment-timezone');
const assert = require('assert');
const tz = 'Europe/Paris';

const Kronograph = require('../lib/kronograph-engine')({
    tz,
    interval: 60000
});

const now = moment.tz(tz);

Kronograph.addAction('testAction', (rule, done) => {
    let rT = moment.tz(tz);
    try {
        assert(rT.diff(now, 'minutes') === 1);
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
    calendar: 'daily',
    hour: moment.tz(tz).hour(),
    minutes: moment.tz(tz).add(1, 'minutes').minutes(),
    action: 'testAction',
    active: true,
});
