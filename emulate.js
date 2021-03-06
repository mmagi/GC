var ABI = (function () {
    var commonAbi = {
        notDisabledIn: function (card) {
            if (!card['abi' + this.id]) return true;
            else return false;
        },
        cast: function (log, card) {
            card.setMp(card._mp - this.mp);
            card['abi' + this.id] = true;
            if (log) log.log(card.name + "使用" + this.name + "，消耗MP" + this.mp + "剩余" + card._mp + "MP");
            return  null;
        }
    };
    var basicAtk = {
        __proto__: commonAbi,
        isDamageAtk: true,
        isPhysicAtk: true,
        name: "一般攻击",
        id: 0,
        exOrder: 0,
        enOrder: 0,
        mp: 0,
        power: 100,
        apply: function (log, from, to, ref) {
            var n = parseInt(
                    from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
            );
            if (n < 1) n = 1;
            to.setHp(to._hp - n);
            if (log) log.log(this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP");
            return  n;
        },
        score: function (from, to) {
            var n = parseInt(
                    from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
            );
            if (n < 1) n = 1;
            if (n > to._hp) n = to._hp;
            return n;
        }
    };
    var physicAtk = {
        __proto__: commonAbi,
        isDamageAtk: true,
        isPhysicAtk: true,
        isNormalAbi: true,
        apply: function (log, from, to, ref) {
            var n = parseInt(
                    from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
            );
            if (n < 1) n = 1;
            to.setHp(to._hp - n);
            var msg = "", power = 0;
            if (this.element == 11 && this.power2 > 0) {
                power = to.perSpd - 10;
                if (power < -50) power = -50;
                to.perSpd = power;
                if (log) msg = "，并使其急速降低" + this.power2 + "点至" + power + "%"
            }
            else if (this.element == 12 && this.power2 > 0) {
                power = to.perDef - 10;
                if (power < -50) power = -50;
                to.perDef = power;
                if (log) msg = "，并使其防御降低" + this.power2 + "点至" + power + "%"
            }
            if (log) log.log(this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP" + msg);
            return  n;
        },
        score: function (from, to) {
            var n = parseInt(
                    from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
            );
            if (n < 1) n = 1;
            if (n > to._hp) n = to._hp;
            return parseInt(n - this.mp / 50);
        }
    };
    var elementAtk = {
        __proto__: commonAbi,
        isDamageAtk: true,
        isNormalAbi: true,
        apply: function (log, from, to, ref) {
            var rate = to.elementAtkRate(this.element);
            var n = parseInt(
                    rate * from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
            );
            if (n < 1) n = 1;
            to.setHp(to._hp - n);
            if (log) log.log(this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP");
            return  n;
        },
        score: function (from, to) {
            var rate = to.elementAtkRate(this.element);
            var n = parseInt(
                    rate * from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
            );
            if (n < 1) n = 1;
            if (n > to._hp) n = to._hp;
            return parseInt(n - this.mp / 50);
        }
    };
    var buff = {
        __proto__: commonAbi,
        apply: function (log, from, to, ref) {
            var power = from[this.per] + this.power;
            from[this.per] = power;
            return  {
                msg: from.name + this.bname + "提高" + this.power + "点至" + power + "%"
            };
        },
        enOrder: 4
    };
    var debuff = {
        __proto__: commonAbi,
        apply: function (log, from, to, ref) {
            var power = to[this.per] - this.power;
            if (power < -50) power = -50;
            to[this.per] = power;
            if (log) log.log(to.name + this.bname + "降低" + this.power + "点至" + power + "%");
            return  null;
        },
        enOrder: 4
    };
    var buff2 = {
        __proto__: commonAbi,
        apply: function (log, from, to, ref) {
            var power = from[this.per] + this.power;
            from[this.per] = power;
            var power2 = from[this.per2] + this.power;
            from[this.per2] = power2;
            if (log) log.log(from.name + this.bname + "提高" + this.power + "点至" + power + "%，" + this.bname2 + "提高" + this.power + "点至" + power2 + "%");
            return  null;
            ;
        },
        enOrder: 4
    };
    var abiE = {
        0: physicAtk,
        1: elementAtk,
        2: elementAtk,
        3: elementAtk,
        4: elementAtk,
        5: elementAtk,
        6: elementAtk,
        7: {//不死
            __proto__: elementAtk,
            isDamageAtk:false,
            getOtherCase: function (from, to) {
                var rate = to.elementAtkRate(this.element);
                var n = parseInt(
                        rate * from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
                );
                var prop = parseInt(100 * n / to._hp);
                if (prop > this.power2) prop = this.power2;
                if (prop < 10) prop = 10;
                return {
                    __proto__: this,
                    getOtherCase: false,
                    apply: function (log, from, to, ref) {
                        if (log) log.log(this.name + "对" + to.name + "没有造成效果");
                        return  null;
                    },
                    prop: 100 - prop
                }
            },
            apply: function (log, from, to, ref) {
                to._hp = 0;
                if (log) log.log(this.name + "对" + to.name + "造成即死效果");
                return  null;
            }
        },
        8: elementAtk,
        9: elementAtk,
        10: elementAtk,
        11: physicAtk,
        12: physicAtk,
        13: {__proto__: buff, bname: '攻击', per: "perAtk"},
        14: {__proto__: buff, bname: '防御', per: "perDef"},
        15: {__proto__: buff, bname: '急速', per: "perSpd"},
        16: {__proto__: buff, bname: '智慧', per: "perItl"},
        17: {__proto__: debuff, bname: '攻击', per: "perAtk"},
        18: {__proto__: debuff, bname: '防御', per: "perDef"},
        19: {__proto__: debuff, bname: '急速', per: "perSpd"},
        20: {__proto__: debuff, bname: '智慧', per: "perItl"},
        21: {//回血
            __proto__: commonAbi,
            isNormalAbi: true,
            score: function (from, to) {
                var n = parseInt(from.maxHp * this.power / 100);
                if (from.maxHp - from._hp < n) n = from.maxHp - from._hp;
                return n;
            },
            apply: function (log, from, to, ref) {
                var n = parseInt(from.maxHp * this.power / 100);
                if (from.maxHp - from._hp < n) n = from.maxHp - from._hp;
                from.setHp(from._hp + n);
                if (log) log.log(this.name + "使" + from.name + "恢复了" + n + "HP，当前剩余" + from._hp + "HP");
                return  null;
            },
            isHeal: true
        },
        22: {//复活
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__: this,
                    getOtherCase: false,
                    apply: function (log, from, to, ref) {
                        if (log) log.log(from.name + "使用" + this.name + "失败");
                        return null;
                    },
                    prop: 100 - this.power
                }
            },
            apply: function (log, from, to, ref) {
                from._hp = from.maxHp;
                if (log) log.log(this.name + "技能使" + from.name + "复活了");
                return  null;
            },
            exOrder: 4
        },
        23: {//吸血
            __proto__: commonAbi,
            isNormalAbi: true,
            apply: function (log, from, to, ref) {
                var n = parseInt(
                        from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
                );
                if (n < 1) n = 1;
                to.setHp(to._hp - n);
                var n2 = parseInt(n * this.power2 / 100);
                from.setHp(from._hp + n2);
                if (log) log.log(this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP，" + from.name + "吸收了" + n2 + "HP，当前为" + from._hp + "HP");
                return  null;
            },
            score: function (from, to) {
                var n = parseInt(
                        from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
                );
                if (n < 1) n = 1;
                if (n > to._hp) n = to._hp;
                var n2 = parseInt(n * this.power2 / 100);
                if (from.maxHp - from._hp < n2) n2 = from.maxHp - from._hp;
                return n + n2;
            },
            isHeal: true
        },
        24: {//吸蓝
            __proto__: commonAbi,
            isNormalAbi: true,
            apply: function (log, from, to, ref) {
                var n = parseInt(
                        from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
                );
                if (n < 1) n = 1;
                to.setMp(to._mp - n);
                var n2 = parseInt(n * this.power2 / 100);
                from.setMp(from._mp + n2);
                if (log) log.log(this.name + "对" + to.name + "的MP造成了" + n + "点伤害，剩余" + to._mp + "MP，" + from.name + "吸收了" + n2 + "MP，当前为" + from._mp + "MP");
                return  null;
                ;
            },
            score: function (from, to) {
                var n = parseInt(
                        from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
                );
                if (n < 1) n = 1;
                if (n > to._mp) n = to._mp;
                var n2 = parseInt(n * this.power2 / 100);
                if (from.maxMp - from._mp < n2) n2 = from.maxMp - from._mp;
                return n + n2;
            },
            isHeal: true
        },
        25: {//先攻
            __proto__: basicAtk,
            enOrder: 5
        },
        26: {//自爆
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__: this,
                    getOtherCase: false,
                    apply: function (log, from, to, ref) {
                        if (log) log.log(from.name + "使用" + this.name + "失败");
                        return  null;
                    },
                    prop: 100 - this.power
                }
            },
            apply: function (log, from, to, ref) {
                var n = this.mp + from._mp;
                to.setHp(to._hp - n);
                from._hp = 0;
                from._mp = 0;
                if (log) log.log(this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP");
                return  null;
            },
            exOrder: 2
        },
        27: {//背水
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__: this,
                    getOtherCase: false,
                    apply: function (log, from, to, ref) {
                        if (log) log.log(from.name + "使用" + this.name + "失败");
                        return  null;
                    },
                    prop: 100 - this.power
                }
            },
            apply: function (log, from, to, ref) {
                from._hp = 1;
                from._mp = 0;
                if (log) log.log(this.name + "使" + from.name + "承受一击打，当前1HP、0MP");
                return  null;
            },
            exOrder: 3,
            is1hpRelive: true
        },
        28: {__proto__: buff2, bname: '攻击', bname2: '防御', per: "perAtk", per2: "perDef"},
        29: {__proto__: buff2, bname: '攻击', bname2: '急速', per: "perAtk", per2: "perSpd"},
        30: {__proto__: buff2, bname: '攻击', bname2: '智慧', per: "perAtk", per2: "perItl"},
        31: {__proto__: buff2, bname: '防御', bname2: '急速', per: "perDef", per2: "perSpd"},
        32: {__proto__: buff2, bname: '防御', bname2: '智慧', per: "perDef", per2: "perItl"},
        33: {__proto__: buff2, bname: '急速', bname2: '智慧', per: "perSpd", per2: "perItl"},
        34: {//猛击
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__: this,
                    getOtherCase: false,
                    apply: function (log, from, to, ref) {
                        var n = parseInt(
                                from.atk * (from.perAtk + 50) / 100
                        );
                        if (n < 1) n = 1;
                        to.setHp(to._hp - n);
                        if (log) log.log(this.name + "MISS！对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP");
                        return  n;
                    },
                    prop: 100 - this.power2
                };
            },
            apply: function (log, from, to, ref) {
                var n = parseInt(
                        from.atk * (from.perAtk + this.power) / 100
                );
                if (n < 1) n = 1;
                to.setHp(to._hp - n);
                if (log) log.log(this.name + "GOOD！对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP");
                return  n;
            },
            score: function (from, to) {
                var damageGood = from.atk * (from.perAtk + this.power) / 100;
                var damageBad = from.atk * (from.perAtk + 50) / 100;
                var n = parseInt((damageGood * this.power2 + damageBad * (100 - this.power2)) / 100);
                if (n > to._hp) n = to._hp;
                return parseInt(n - this.mp / 50);
            },
            isNormalAbi: true,
            isDamageAtk: true,
            isPhysicAtk: false
        },
        35: {//天界
            __proto__: commonAbi,
            apply: function (log, from, to, ref) {
                var msg = "";
                if (to.perAtk > 0) {
                    to.perAtk = 0;
                    msg += "攻击"
                }
                if (to.perDef > 0) {
                    to.perDef = 0;
                    msg += "防御"
                }
                if (to.perSpd > 0) {
                    to.perSpd = 0;
                    msg += "急速"
                }
                if (to.perItl > 0) {
                    to.perItl = 0;
                    msg += "智慧"
                }
                if (log) log.log(this.name + "使" + to.name + "的" + msg + "buff被消除");
                return  null;
            },
            enOrder: 3
        },
        36: {
            __proto__: commonAbi,
            isPhysicAtkAvoid: true,
            apply: function (log, from, to, ref) {
                if (log) log.log(this.name + "使" + to.name + "躲避了攻击");
                return  null;
            }
        },
        37: {//锁蓝
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__: this,
                    getOtherCase: false,
                    apply: function (log, from, to, ref) {
                        if (log) log.log(from.name + "使用" + this.name + "失败");
                        return  null;
                    },
                    prop: 100 - this.power
                }
            },
            apply: function (log, from, to, ref) {
                to.setMp(0);
                if (log) log.log(this.name + "使" + to.name + "的MP归零");
                return  null;
            },
            enOrder: 2
        },
        38: {//全防
            __proto__: commonAbi,
            apply: function (log, from, to, ref) {
                from.allDef = true;
                if (log) log.log(this.name + "使" + from.name + "的属性防御力上升了");
                return  null;
            },
            enOrder: 4
        },
        40: {//反击
            __proto__: commonAbi,
            apply: function (log, from, to, ref) {
                var n = parseInt(ref * this.power2 / 100);
                if (n < 1) n = 1;
                to.setHp(to._hp - n);
                if (log) log.log(this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP");
                return  null;
            },
            isAtkBack: true
        },
        41: {
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__: this,
                    getOtherCase: false,
                    apply: function (log, from, to, ref) {
                        if (log) log.log(from.name + "使用" + this.name + "失败");
                        return null;
                    },
                    prop: 100 - this.power
                }
            },
            apply: function (log, from, to, ref) {
                to.perConfuse = this.power2;
                if (log) log.log(this.name + "使" + to.name + "的进入" + this.power2 + "%的混乱状态");
                return  null;
            },
            enOrder: 1
        },
        //血斩
        43: {
            __proto__: physicAtk,
            cast: function (log, card) {
                card.setHp(card._hp - this.power2);
                card['abi' + this.id] = true;
                if (log) log.log(card.name + "使用" + this.name + "，消耗HP" + this.power2 + "剩余" + card._hp + "HP");
                return  null;
            },
            score: function (from, to) {
                if (from._hp < this.power2 || to._hp <= 1) {
                    return 0;
                }
                var n = parseInt(
                        from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
                );
                if (n < 1) n = 1;
                if (n > to._hp) n = to._hp;
                var rank = n - this.power2;
                if (rank < 1) rank = 1;
                return rank;
            },
            isPhysicAtk: false
        }

    };
    var ABI = {
        basicAtk: basicAtk
    };
    for (var idx in _db.skill) {
        var data = _db.skill[idx];
        ABI[idx] = {
            __proto__: abiE[data[5]],
            id: idx,
            name: data[0],
            mp: data[2],
            power: data[3],
            power2: data[4],
            element: data[5]
        };
        if (ABI[idx].isPhysicAtkAvoid) ABI[idx].prop = ABI[idx].power;
    }
    return ABI;
}());


var cardP = {
    element: 11,
    maxHp: 0,
    maxMp: 0,
    atk: 0,
    def: 0,
    itl: 0,
    spd: 0,
    abis: [],
    next: false,
    length: function () {
        var i = 1, c = this;
        while (c = c.next) i++;
        return i;
    },
    init: function () {
        this._hp = this.maxHp;
        this._mp = this.maxMp;
        this.perAtk = 0;
        this.perDef = 0;
        this.perItl = 0;
        this.perSpd = 0;
        this.actSpd = this.spd;
        this.perConfuse = 0;
        this.Abis = [];
        for (var idx in this.abi) {
            var id = this.abi[idx];
            this.Abis.push(ABI[id]);
        }
    },
    setHp: function (x) {
        this._hp = x;
        if (this._hp > this.maxHp) {
            this._hp = this.maxHp;
        } else if (this._hp < 0) {
            this._hp = 0;
        }
    },
    setMp: function (x) {
        this._mp = x;
        if (this._mp > this.maxMp) {
            this._mp = this.maxMp;
        } else if (this._mp < 0) {
            this._mp = 0;
        }
    },
    elementAtkRate: function (element) {
        if (!!this.allDef) return 0.85;
        else return _db.element[element][this.element];
    },
    selectExitAbi: function () {
        var bestOrder = 0, bestAbi = false;
        var multiAbi = false;
        for (var idx in this.Abis) {
            var abi = this.Abis[idx];
            if (abi.exOrder > bestOrder && abi.notDisabledIn(this) && abi.mp <= this._mp) {
                if ((bestAbi.is1hpRelive)) {
                    multiAbi = abi;
                } else {
                    bestAbi = abi;
                    bestOrder = abi.exOrder;
                }
            }
        }
        if (bestAbi && multiAbi) {
            if (multiAbi.exOrder > bestAbi.exOrder) {
                return {
                    __proto__: multiAbi,
                    othercase: {
                        __proto__: bestAbi,
                        getOtherCase: false,
                        prop: 100 - multiAbi.prop
                    },
                    getOtherCase: function (from, to) {
                        return this.othercase;
                    }
                };
            } else {
                return bestAbi;
            }
        } else if (multiAbi) {
            bestAbi = multiAbi;
        }
        return bestAbi;
    },
    selectEntranceAbi: function (tcard) {
        if (this.perConfuse > 0) return false;
        var bestOrder = 0, bestAbi = false;
        for (var idx in this.Abis) {
            var abi = this.Abis[idx];
            if (abi.enOrder > bestOrder && abi.notDisabledIn(this) && abi.mp <= this._mp) {
                if (!(abi.element == 35/*天界*/ && tcard.perAtk <= 0 && tcard.perDef <= 0 && tcard.perItl <= 0 && tcard.perSpd <= 0)) {
                    bestAbi = abi;
                    bestOrder = abi.enOrder;
                }
            }
        }
        return bestAbi;
    },
    selectFightbackAbi: function (tabi) {
        if (this.perConfuse > 0 || !tabi.isDamageAtk) return false;
        for (var idx in this.Abis) {
            var abi = this.Abis[idx];
            if (abi.isAtkBack && abi.mp <= this._mp) return abi;
        }
        return false;
    },
    selectMissAbi: function (tabi) {
        if (this.perConfuse > 0 || !tabi.isPhysicAtk) return false;
        for (var idx in this.Abis) {
            var abi = this.Abis[idx];
            if (abi.isPhysicAtkAvoid && abi.mp <= this._mp) return abi;
        }
        return false;
    },
    selectAbi: function (tcard) {
        var bestScore = 0, bestAbi = ABI.basicAtk;
        for (var idx in this.Abis) {
            var abi = this.Abis[idx];
            if (abi.isNormalAbi && abi.mp <= this._mp && (this.perConfuse <= 0 || !abi.isHeal)) {
                var score = abi.score(this, tcard)
                if (score > bestScore) {
                    bestAbi = abi;
                    bestScore = score;
                }
            }
        }
        return bestAbi;
    }
};
var stageP = function () {
    var swapCard = function () {
        var stage = this;
        var c = false;
        for (c = stage.left; c && c._hp <= 0; c = c.next)
            stage.logs && stage.logs.log(c.name + "退场");
        if (c) stage.left = {__proto__: c};
        else stage.left = false;
        for (c = stage.right; c && c._hp <= 0; c = c.next)
            stage.logs && stage.logs.log(c.name + "退场");
        if (c) stage.right = {__proto__: c};
        else stage.right = false;

        stage.nextRound = false;
        if (!stage.right) {
            stage.win = true;
            if (stage.left) stage.logs && stage.logs.log("战斗结束，左方胜" + stage.left.length() + "张卡", "end");
            else stage.logs && stage.logs.log("战斗结束，战平，判定先手胜", "end");
        }
        else if (!stage.left) {
            stage.win = false;
            stage.logs && stage.logs.log("战斗结束，右方胜" + stage.right.length() + "张卡", "end")
        }
        else stage.nextRound = entranceCast;
        return stage;
    };

    var entranceCast = function () {
        var stage = this;
        var abiL = stage.left.selectEntranceAbi(stage.right);
        var abiR = stage.right.selectEntranceAbi(stage.left);
        if (!!abiL && !!abiR) {
            if (abiL.enOrder > abiR.enOrder) abiR = null;
            else if (abiL.enOrder < abiR.enOrder) abiL = null;
            else if (stage.right.actSpd > stage.left.actSpd) abiL = null;
            else abiR = null;
        }
        if (!!abiL) {
            stage.casting = {
                from: true,
                to: false,
                abi: abiL
            };
        } else if (!!abiR) {
            stage.casting = {
                from: false,
                to: true,
                abi: abiR
            };
        } else {
            stage.nextRound = fightCast;
            return stage;
        }
        var ret = stage.casting.abi.cast(stage.logs, stage.get_from());
        stage.nextRound = entranceApply;
        return stage;
    };

    var entranceApply = function () {
        var stage = this;
        var abi, ret;
        abi = stage.casting.abi;
        if (!!abi.getOtherCase) {
            var newabi = abi.getOtherCase(stage.get_from(), stage.get_to());
            var newstage = stage.fork(newabi.prop);
            newstage.casting = {
                __proto__: stage.casting,
                abi: newabi
            };
//          stage.stages.push(newstage);
            stage = stage.fork(100 - newabi.prop);
        }
        ret = abi.apply(stage.logs, stage.get_from(), stage.get_to(), stage.casting.ref);
        if (stage.get_to()._hp > 0) {
            abi = stage.get_to().selectFightbackAbi(abi);
            if (!!abi) {
                stage.casting = {
                    from: stage.casting.to,
                    to: stage.casting.from,
                    abi: abi,
                    ref: ret
                };
                ret = stage.casting.abi.cast(stage.logs, stage.get_from());
                stage.nextRound = entranceApply;
            } else {
                stage.nextRound = entranceCast;
            }
        } else {
            abi = stage.get_to().selectExitAbi();
            if (!!abi) {
                stage.casting = {
                    from: stage.casting.to,
                    to: !stage.casting.to,
                    abi: abi,
                    ref: ret
                };
                ret = stage.casting.abi.cast(stage.logs, stage.get_from());
                stage.nextRound = exitApply;
            } else {
                stage.nextRound = swapCard;
            }
        }
        if (newstage && stage.prop < newstage.prop) {
            stage.stages.push(stage);
            return newstage;
        } else {
            if (newstage) stage.stages.push(newstage);
            return stage;
        }
    };
    var exitApply = function () {
        var stage = this;
        var abi, ret;
        abi = stage.casting.abi;
        if (!!abi.getOtherCase) {
            var newabi = abi.getOtherCase(stage.get_from(), stage.get_to());
            var newstage = stage.fork(newabi.prop);
            newstage.casting = {
                __proto__: this.casting,
                abi: newabi
            };
            stage = stage.fork(100 - newabi.prop);
        }
        ret = abi.apply(stage.logs, stage.get_from(), stage.get_to());
        if (stage.get_from()._hp > 0) {
            stage.nextRound = entranceCast;
        } else {
            stage.nextRound = swapCard;
        }
        if (newstage && stage.prop < newstage.prop) {
            stage.stages.push(stage);
            return newstage;
        } else {
            if (newstage) stage.stages.push(newstage);
            return stage;
        }
    };
    var fightCast = function () {
        var stage = this;
        var atk, def, dir;
        if (stage.left.actSpd >= stage.right.actSpd) {
            atk = stage.left;
            def = stage.right;
            dir = true;
        } else {
            def = stage.left;
            atk = stage.right;
            dir = false;
        }
        atk.actSpd -= def.actSpd;
        def.actSpd = parseInt(def.spd * (100 + def.perSpd) / 100);

        var abi = atk.selectAbi(def);
        var ret = abi.cast(stage.logs, atk);
        stage.nextRound = fightApply;
        if (atk.perConfuse > 0) {
            var newstage = stage.fork(atk.perConfuse);
            newstage.casting = {
                from: dir,
                to: dir,
                abi: abi
            };
            newstage.logs && newstage.logs.log("混乱生效");
            stage = stage.fork(100 - atk.perConfuse);
            stage.logs && stage.logs.log("混乱未生效");
        }
        stage.casting = {
            from: dir,
            to: !dir,
            abi: abi
        };
        if (newstage && stage.prop < newstage.prop) {
            stage.stages.push(stage);
            return newstage;
        } else {
            if (newstage) stage.stages.push(newstage);
            return stage;
        }
    };
    var fightApply = function () {
        var stage = this;
        var ret;
        var abi = stage.casting.abi;
        var abiBack = stage.get_to().selectMissAbi(abi);
        if (!!abiBack) {
            var newstage = stage.fork(abiBack.prop);
            ret = abiBack.cast(newstage.logs, newstage.get_to());
            ret = abiBack.apply(newstage.logs, newstage.get_from(), newstage.get_to());
            newstage.nextRound = fightCast;
            stage = stage.fork(100 - abiBack.prop);
        }
        if (!!abi.getOtherCase) {
            var newabi = abi.getOtherCase(stage.get_from(), stage.get_to());
            var newstage2 = stage.fork(newabi.prop);
            newstage2.casting.abi = newabi
            stage = stage.fork(100 - newabi.prop);
        }
        ret = abi.apply(stage.logs, stage.get_from(), stage.get_to(), stage.casting.ref);
        if (stage.get_to()._hp > 0) {
            abi = stage.get_to().selectFightbackAbi(abi);
            if (stage.casting.from != stage.casting.to && !!abi) {
                stage.casting = {
                    from: stage.casting.to,
                    to: stage.casting.from,
                    abi: abi,
                    ref: ret
                };
                ret = stage.casting.abi.cast(stage.logs, stage.get_from());
                stage.nextRound = fightApply;
            } else {
                stage.nextRound = fightCast;
            }
        } else {
            abi = stage.get_to().selectExitAbi();
            if (!!abi) {
                stage.casting = {
                    from: stage.casting.to,
                    to: !stage.casting.to,
                    abi: abi,
                    ref: ret
                };
                ret = stage.casting.abi.cast(stage.logs, stage.get_from());
                stage.nextRound = exitApply;
            } else {
                stage.nextRound = swapCard;
            }
        }
        if (newstage && stage.prop < newstage.prop) {
            if (newstage2 && newstage.prop < newstage2.prop) {
                stage.stages.push(stage);
                stage.stages.push(newstage);
                return newstage2;
            } else {
                stage.stages.push(stage);
                if (newstage2) stage.stages.push(newstage2);
                return newstage;
            }
        } else {
            if (newstage) stage.stages.push(newstage);
            if (newstage2 && stage.prop < newstage2.prop) {
                stage.stages.push(stage);
                return newstage2;
            } else {
                if (newstage2) stage.stages.push(newstage2);
                return stage;
            }
        }
    };
    return {
        nextRound: swapCard,
        get_from: function () {
            return this.casting.from ? this.left : this.right;//t=left,f=right
        },
        get_to: function () {
            return this.casting.to ? this.left : this.right;//t=left,f=right
        },
        fork: function (prop) {
            var stage = {
                __proto__: this,
                left: {__proto__: this.left},
                right: {__proto__: this.right}
            };
            stage.prop = this.prop * prop / 100;
            if (this.logs) {
                stage.logs = this.logs.sublog(stage.prop, "分支选择几率" + prop + "%，累计约" + stage.prop + "%");
            }
            return stage;
        }
    }
}();


var stageE = function () {
    var swapCard = function () {
        var stage = this;
        var c = false;
        for (c = stage.left; c && c._hp <= 0; c = c.next)
            stage.logs && stage.logs.log(c.name + "退场");
        if (c) stage.left = {__proto__: c};
        else stage.left = false;
        for (c = stage.right; c && c._hp <= 0; c = c.next)
            stage.logs && stage.logs.log(c.name + "退场");
        if (c) stage.right = {__proto__: c};
        else stage.right = false;

        stage.nextRound = false;
        if (!stage.right) {
            stage.win = true;
            if (stage.left) stage.logs && stage.logs.log("战斗结束，左方胜" + stage.left.length() + "张卡", "end");
            else stage.logs && stage.logs.log("战斗结束，战平，判定先手胜", "end");
        }
        else if (!stage.left) {
            stage.win = false;
            stage.logs && stage.logs.log("战斗结束，右方胜" + stage.right.length() + "张卡", "end")
        }
        else stage.nextRound = entranceCast;
        return stage;
    };

    var entranceCast = function () {
        var stage = this;
        var abiL = stage.left.selectEntranceAbi(stage.right);
        var abiR = stage.right.selectEntranceAbi(stage.left);
        if (!!abiL && !!abiR) {
            if (abiL.enOrder > abiR.enOrder) abiR = null;
            else if (abiL.enOrder < abiR.enOrder) abiL = null;
            else if (stage.right.actSpd > stage.left.actSpd) abiL = null;
            else abiR = null;
        }
        if (!!abiL) {
            stage.casting = {
                from: true,
                to: false,
                abi: abiL
            };
        } else if (!!abiR) {
            stage.casting = {
                from: false,
                to: true,
                abi: abiR
            };
        } else {
            stage.nextRound = fightCast;
            return stage;
        }
        var ret = stage.casting.abi.cast(stage.logs, stage.get_from());
        stage.nextRound = entranceApply;
        return stage;
    };

    var entranceApply = function () {
        var stage = this;
        var abi, ret;
        abi = stage.casting.abi;
        if (!!abi.getOtherCase) {
            var newabi = abi.getOtherCase(stage.get_from(), stage.get_to());
            if (Math.random() < newabi.prop / 100) abi = newabi;
        }
        ret = abi.apply(stage.logs, stage.get_from(), stage.get_to(), stage.casting.ref);
        if (stage.get_to()._hp > 0) {
            abi = stage.get_to().selectFightbackAbi(abi);
            if (!!abi) {
                stage.casting = {
                    from: stage.casting.to,
                    to: stage.casting.from,
                    abi: abi,
                    ref: ret
                };
                ret = stage.casting.abi.cast(stage.logs, stage.get_from());
                stage.nextRound = entranceApply;
            } else {
                stage.nextRound = entranceCast;
            }
        } else {
            abi = stage.get_to().selectExitAbi();
            if (!!abi) {
                stage.casting = {
                    from: stage.casting.to,
                    to: !stage.casting.to,
                    abi: abi,
                    ref: ret
                };
                ret = stage.casting.abi.cast(stage.logs, stage.get_from());
                stage.nextRound = exitApply;
            } else {
                stage.nextRound = swapCard;
            }
        }
        return stage;
    };
    var exitApply = function () {
        var stage = this;
        var abi, ret;
        abi = stage.casting.abi;
        if (!!abi.getOtherCase) {
            var newabi = abi.getOtherCase(stage.get_from(), stage.get_to());
            if (Math.random() < newabi.prop / 100) abi = newabi;
        }
        ret = abi.apply(stage.logs, stage.get_from(), stage.get_to());
        if (stage.get_from()._hp > 0) {
            stage.nextRound = entranceCast;
        } else {
            stage.nextRound = swapCard;
        }
        return stage;
    };
    var fightCast = function () {
        var stage = this;
        var atk, def, dir;
        if (stage.left.actSpd >= stage.right.actSpd) {
            atk = stage.left;
            def = stage.right;
            dir = true;
        } else {
            def = stage.left;
            atk = stage.right;
            dir = false;
        }
        atk.actSpd -= def.actSpd;
        def.actSpd = parseInt(def.spd * (100 + def.perSpd) / 100);

        var abi = atk.selectAbi(def);
        var ret = abi.cast(stage.logs, atk);
        stage.nextRound = fightApply;
        if (atk.perConfuse > 0) {
            if (Math.random() < atk.perConfuse / 100) {
                stage.casting = {
                    from: dir,
                    to: dir,
                    abi: abi
                };
                stage.logs && stage.logs.log("混乱生效");
                return stage;
            }
            else {
                stage.logs && stage.logs.log("混乱未生效");
            }
        }
        stage.casting = {
            from: dir,
            to: !dir,
            abi: abi
        };
        return stage;
    };
    var fightApply = function () {
        var stage = this;
        var ret;
        var abi = stage.casting.abi;
        var abiBack = stage.get_to().selectMissAbi(abi);
        if (!!abiBack) {
            if (Math.random() < abiBack.prop / 100) {
                ret = abiBack.cast(stage.logs, stage.get_to());
                abiBack.apply(stage.logs, stage.get_from(), stage.get_to());
                stage.nextRound = fightCast;
                return stage;
            }
        }
        if (!!abi.getOtherCase) {
            var newabi = abi.getOtherCase(stage.get_from(), stage.get_to());
            if (Math.random() < newabi.prop / 100) {
                abi = newabi;
            }
        }
        ret = abi.apply(stage.logs, stage.get_from(), stage.get_to(), stage.casting.ref);
        if (stage.get_to()._hp > 0) {
            abi = stage.get_to().selectFightbackAbi(abi);
            if (stage.casting.from != stage.casting.to && !!abi) {
                stage.casting = {
                    from: stage.casting.to,
                    to: stage.casting.from,
                    abi: abi,
                    ref: ret
                };
                ret = stage.casting.abi.cast(stage.logs, stage.get_from());
                stage.nextRound = fightApply;
            } else {
                stage.nextRound = fightCast;
            }
        } else {
            abi = stage.get_to().selectExitAbi();
            if (!!abi) {
                stage.casting = {
                    from: stage.casting.to,
                    to: !stage.casting.to,
                    abi: abi,
                    ref: ret
                };
                ret = stage.casting.abi.cast(stage.logs, stage.get_from());
                stage.nextRound = exitApply;
            } else {
                stage.nextRound = swapCard;
            }
        }
        return stage;
    };
    return {
        nextRound: swapCard,
        get_from: function () {
            return this.casting.from ? this.left : this.right;//t=left,f=right
        },
        get_to: function () {
            return this.casting.to ? this.left : this.right;//t=left,f=right
        }
    }
}();
function run(left, right, final, logs) {
    for (var idx in dps) {
        dps[idx].y = 0;
    }
    chart.options.title.text = "战斗模拟中";

    chart.options.axisY.suffix = null;
    chart.options.data[0].indexLabel = "{y}次";
    chart.options.data[0].yValueFormatString = "0";
    chart.aProgress = 0;
    chart.aWin = 0;
    chart.lastRTime = new Date().getTime();
    chart.render();
    var lh = false, rh = false;
    var idx, pre, cur;
    for (idx in left) {
        cur = left[idx];
        cur.__proto__ = cardP;
        cur.init();
        cur.name = "L" + idx + cur.name;
        if (!lh) lh = cur;
        else pre.next = cur;
        pre = cur;
    }
    for (idx in right) {
        cur = right[idx];
        cur.__proto__ = cardP;
        cur.init();
        cur.name = "R" + idx + cur.name;
        if (!rh) rh = cur;
        else pre.next = cur;
        pre = cur;
    }
    var Sstage =
        {
            __proto__: stageE,
            left: lh,
            right: rh,
            prop: 1,
            logs: logs
        }
        ;

    function nextRun() {
        var stage = {
            __proto__: Sstage
        };
        if (window.cancelRun) {
            window.cancelRun = false;
            chart.options.title.text = "已模拟战斗胜利" + chart.aWin + "/" + chart.aProgress + "次，约" + (chart.aWin * 100 / chart.aProgress).toFixed(2) + "%";
            chart.render();
            final && final();
            return;
        }
        while (!!stage.nextRound) stage = stage.nextRound();
        if (stage.right) dps[10 + stage.right.length()].y += 1;
        else {
            if (stage.left)  dps[10 - stage.left.length()].y += 1;
            else dps[10].y += 1;
            chart.aWin += 1;
        }
        chart.aProgress += 1;
        var now = new Date().getTime();
        if (now - chart.lastRTime > 500) {
            chart.options.title.text = "已模拟战斗胜利" + chart.aWin + "/" + chart.aProgress + "次，约" + (chart.aWin * 100 / chart.aProgress).toFixed(2) + "%";
            chart.render();
            chart.lastRTime = now
        }
        if (chart.aProgress == 20) {
            stage.logs && stage.logs.log("已模拟20次战斗，后续模拟记录将关闭");
            Sstage.logs = false;
        }
        setTimeout(nextRun, 0);

    }

    nextRun();


}

function analyse(left, right, final, logs) {
    for (var idx in dps) {
        dps[idx].y = 0;
    }
    chart.options.title.text = "胜率分析中";
    chart.options.axisY.suffix = " %";
    chart.options.data[0].indexLabel = "{y}%"
    chart.options.data[0].yValueFormatString = "0.0";
    chart.aProgress = 0;
    chart.aWin = 0;
    chart.lastRTime = new Date().getTime();
    chart.render();
    var lh = false, rh = false;
    var idx, pre, cur;
    for (idx in left) {
        cur = left[idx];
        cur.__proto__ = cardP;
        cur.init();
        cur.name = "L" + idx + cur.name;
        if (!lh) lh = cur;
        else pre.next = cur;
        pre = cur;
    }
    for (idx in right) {
        cur = right[idx];
        cur.__proto__ = cardP;
        cur.init();
        cur.name = "R" + idx + cur.name;
        if (!rh) rh = cur;
        else pre.next = cur;
        pre = cur;
    }
    var stages = [
        {
            __proto__: stageP,
            left: lh,
            right: rh,
            prop: 100,
            logs: logs
        }
    ];
    stages[0].stages = stages;
    function nextRun() {
        var stage = stages.shift();
        if (!stage) {
            chart.options.title.text = "胜率分析完毕，合计胜率" + chart.aWin.toFixed(2) + "%";
            chart.render();
            final && final();
        }
        else if (window.cancelRun) {
            window.cancelRun = false;
            chart.options.title.text = "胜率分析取消，完成度" + chart.aProgress.toFixed(3) + "%，理论胜率介于" + chart.aWin.toFixed(2) + "%至" + (chart.aWin + 100 - chart.aProgress).toFixed(2) + "%之间";
            chart.render();
            final && final();
        } else {
            while (!!stage.nextRound) stage = stage.nextRound();
            if (stage.right) dps[10 + stage.right.length()].y += stage.prop;
            else {
                if (stage.left)  dps[10 - stage.left.length()].y += stage.prop;
                else dps[10].y += stage.prop;
                chart.aWin += stage.prop;
            }
            chart.aProgress += stage.prop;

            var now = new Date().getTime();
            if (now - chart.lastRTime > 500) {
                chart.options.title.text = "胜率分析中已完成" + chart.aProgress + "%";
                chart.render();
                chart.lastRTime = now
            }
            ;
            setTimeout(nextRun, 0);
        }
    }

    nextRun();
}
