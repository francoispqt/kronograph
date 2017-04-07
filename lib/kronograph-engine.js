'use strict';

const EventEmitter = require('events');
const moment = require('moment-timezone');


const checkDate = function(date, rule, tz){
    if (!rule.interval)
        return ( date.date() === rule.day && date.hour() === rule.hour && date.minute() === rule.minutes);
    else
        return  date.isSame(moment.tz(tz));
};

// Getting next date when rule must trigger
// if no last start from now
// else start from last
const getNextDate = function(type, rule, toSet, config){
    if (!rule.last && !rule.next) {
            let now = moment.tz(config.tz);
            if (typeof toSet === 'number') {
                let thisD = moment.tz(config.tz).add(toSet, type);
                return now.diff(thisD, 'seconds') > 0 ? thisD.add(toSet, type) : thisD;
            } else {
                let thisD = moment.tz(config.tz).set(toSet);
                return now.diff(thisD, 'seconds') > 0 ? thisD.add(1, type) : thisD;
            }
    } else if (rule.last) {
        let lastD = moment.tz(rule.last, config.tz);
        return checkDate(lastD, rule, config.tz) ? lastD.add(rule.interval || 1, type) : (() => {
            if (typeof toSet === 'number') {
                return lastD.add(toSet, 'seconds');
            } else {
                return lastD.add(1, type).set(toSet);
            }
        })();
    }
    return rule.next;
};

const CALENDARS = {
    monthly: {
        getNextDate: function(rule, config){
            rule.next = getNextDate('month', rule, { 'date': rule.day_of_month || 1, 'hour': rule.hour, 'minutes': rule.minutes }, config);
            return rule.next;
        },
    },
    weekly: {
        getNextDate: function(rule, config){
            rule.next = getNextDate('week', rule, { 'day': rule.day_of_week || 1, 'hour': rule.hour, 'minutes': rule.minutes }, config);
            return rule.next;
        }
    },
    daily: {
        getNextDate: function(rule, config){
            rule.next = getNextDate('day', rule, { 'hour': rule.hour, 'minutes': rule.minutes, 'seconds': 0 }, config);
            return rule.next;
        }
    },
    interval : {
        getNextDate: function(rule, config){
            rule.next = getNextDate('seconds', rule, rule.interval, config);
            return rule.next;
        }
    }
};

class KronographEmitter extends EventEmitter {}

class KronographScheduler {
    constructor(config){
        this.config = config;
        this.timer;
        this.rules;
        this.actions;
        this.emitter = new KronographEmitter();
        this.run();
    }

    run(Elle){
        let nextTick = this.config.nextTick || (result => {
            if (this.config.verbose) {
                console.info(result);
            }
        });
        this.timer = setInterval(() => {
            this.checkRules.bind(this)()
            .then(result => {
                this.emitter.emit('nextTick', result);
                return;
            })
            .catch(err => {
                this.emitter.emit('error', err);
            });
        }, this.config.interval*1000 || 60000);
        return;
    }

    checkRule(name, now){
        let rule = this.rules[name];
        let self = this;
        return new Promise((resolve, reject) => {
            let date = rule.calendar.getNextDate(rule, this.config);
            if (date.isBefore(now) || date.isSame(now)) {
                rule.last = date;
                rule.action.func.bind(null, rule)(function(err, result) {
                    if (err) {
                        if (self.config.verbose) {
                            console.error(err);
                        }
                        self.emitter.emit('error', err);
                        resolve();
                    }
                    resolve({message: `Rule ${name}, triggered.`, result});
                });
            }
            resolve({message: `Rule ${name}, not triggered. Next trigger on ${date.format('YYYY-MM-DD hh:mm:ss')}`});
        });
    }

    checkRules(){
        let now = moment.tz(this.config.tz);
        if (this.rules && Object.keys(this.rules).length > 0) {
            return Promise.all(Object.keys(this.rules).reduce((agg, k) => {
                if (this.rules[k].active) {
                    agg.push(this.checkRule(k, now));
                }
                return agg;
            }, []));
        }
        return Promise.resolve();
    }

    addRules(rules){
        if (rules instanceof Array === false || rules.length === 0) {
            throw new Error('addRules : Must provide a non-epty array of rules.')
        }
        this.rules = this.rules || {};
        for (let rule of rules) {
            if (!this.rules[rule.name]) {
                this.addRule(rule.name, rule);
            }
        }
        return this;
    }


    addRule(rule){
        let ruleBuild = {};
        let name = rule.name;
        if (this.rules && this.rules[name]){
            throw new Error('Rule ' + name + ' already exist.');
        }
        if (!this.actions || !this.actions[rule.action]){
            throw new Error('Action ' + rule.action + ' does not exist.');
        }
        ruleBuild.action = this.actions[rule.action];
        if (!CALENDARS[rule.calendar]){
            throw new Error('Calendar ' + rule.calendar + ' does not exist.');
        }
        ruleBuild.calendar = CALENDARS[rule.calendar];
        this.rules = this.rules || [];
        this.rules[name] = Object.assign(rule, ruleBuild);
    }

    removeRules(names){
        names.forEach(name => delete this.rules[name]);
        return this;
    }

    removeRule(name){
        delete this.rules[name];
        return this;
    }

    addAction(name, ...params){
        let func = params.splice(params.length - 1, 1)[0];
        if (this.actions && this.actions[name]){
            throw new Error('Action ' + name + ' already exist.');
        }
        this.actions = this.actions || [];
        this.actions[name] = {func};
        return this;
    }

    addActions(actions){
        if (actions instanceof Array === false || actions.length === 0) {
            throw new Error('addRules : Must provide a non-epty array of rules.')
        }
        this.actions = this.actions || {};
        for (let action of actions) {
            this.addAction(action.name, action.func, ...actions.params);
        }
        return this;
    }

    removeAction(name) {
        delete this.actions[name];
        return this;
    }

    removeActions(names){
        names.forEach(name => delete this.actions[name]);
        return this;
    }

    toggle(ruleName){
        this.rules[name].active = this.rules[name].active ? false : true;
        return this;
    }

    // EMITTER
    on(event, callback){
        this.emitter.on(event, callback);
        return this;
    }

}


module.exports = (config) => new KronographScheduler(config);
