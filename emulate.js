var ABI = (function () {
    var commonAbi = {
        notDisabledIn: function (card) {
            if (!card['abi' + this.id]) return true;
            else return false;
        },
        cast: function (card) {
            card.setMp(card._mp - this.mp);
            card['abi' + this.id] = true;
            return  {
                msg: card.name + "使用" + this.name+"，消耗MP"+this.mp+"剩余"+card._mp+"MP"
            };
        }
    };
    var basicAtk = {
        __proto__: commonAbi,
        isDamageAtk:true,
        isPhysicAtk:true,
        name: "一般攻击",
        id: 0,
        exOrder: 0,
        enOrder: 0,
        mp: 0,
        power: 100,
        apply: function (from, to, ref) {
            var n = parseInt(
                    from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
            );
            if (n < 1) n = 1;
            to.setHp(to._hp - n);
            return  {
                power: n,
                msg: this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP"
            };
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
        isDamageAtk:true,
        isPhysicAtk:true,
        isNormalAbi:true,
        apply: function (from, to, ref) {
            var n = parseInt(
                    from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
            );
            if (n < 1) n = 1;
            to.setHp(to._hp - n);
            var msg = "",power = 0;
            if(this.element == 11 && this.power2>0) {
                power = to.perSpd-10;
                if (power<-50) power = -50;
                to.perSpd = power;
                msg = "，并使其急速降低"+this.power2+"点至"+power+"%"
            }
            else if(this.element == 12 && this.power2>0) {
                power = to.perDef-10;
                if (power<-50) power = -50;
                to.perDef = power;
                msg = "，并使其防御降低"+this.power2+"点至"+power+"%"
            }
            return  {
                power: n,
                msg: this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP"+msg
            };
        },
        score: function (from, to) {
            var n = parseInt(
                    from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
            );
            if (n < 1) n = 1;
            if (n > to._hp) n = to._hp;
            return parseInt(n-this.mp/50);
        }
    };
    var elementAtk = {
        __proto__: commonAbi,
        isNormalAbi:true,
        apply: function (from, to, ref) {
            var rate = to.elementAtkRate(this.element);
            var n = parseInt(
                    rate * from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
            );
            if (n < 1) n = 1;
            to.setHp(to._hp - n);
            return  {
                power: n,
                msg: this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP"
            };
        },
        score: function (from, to) {
            var rate = to.elementAtkRate(this.element);
            var n = parseInt(
                    rate * from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
            );
            if (n < 1) n = 1;
            if (n > to._hp) n = to._hp;
            return parseInt(n-this.mp/50);
        }
    };
    var buff = {
        __proto__: commonAbi,
        apply: function (from, to, ref) {
            var power = from[this.per] + this.power;
            from[this.per]=power;
            return  {
                msg: from.name + this.bname+"提高"+this.power+"点至"+power+"%"
            };
        },
        enOrder: 4
    };
    var debuff = {
        __proto__: commonAbi,
        apply: function (from, to, ref) {
            var power = to[this.per] - this.power;
            if (power<-50) power=-50;
            to[this.per]=power;
            return  {
                msg: to.name + this.bname+"降低"+this.power+"点至"+power+"%"
            };
        },
        enOrder: 4
    };
    var buff2 = {
        __proto__: commonAbi,
        apply: function (from, to, ref) {
            var power = from[this.per] + this.power;
            from[this.per]=power;
            var power2 = from[this.per2] + this.power;
            from[this.per2]=power2;
            return  {
                msg: from.name + this.bname+"提高"+this.power+"点至"+power+"%，" + this.bname2+"提高"+this.power+"点至"+power2+"%"
            };
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
            getOtherCase: function (from, to) {
                var rate = to.elementAtkRate(this.element);
                var n = parseInt(
                        rate * from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
                );
                var prop = parseInt(100 * n / to._hp);
                if (prop>this.power2) prop =this.power2;
                if(prop < 10) prop = 10;
                return {
                    __proto__:this,
                    getOtherCase:false,
                    apply:function(from, to, ref) {
                        return  {
                            msg: this.name +"对"+ to.name+"没有造成效果"
                        };
                    },
                    prop:100-prop
                }
            },
            apply:function(from, to, ref) {
                to._hp = 0;
                return  {
                    msg: this.name +"对"+ to.name+"造成即死效果"
                };
            }
        },
        8: elementAtk,
        9: elementAtk,
        10: elementAtk,
        11: physicAtk,
        12: physicAtk,
        13: {__proto__: buff,bname:'攻击', per: "perAtk"},
        14: {__proto__: buff,bname:'防御', per: "perDef"},
        15: {__proto__: buff,bname:'急速', per: "perSpd"},
        16: {__proto__: buff,bname:'智慧', per: "perItl"},
        17: {__proto__: debuff,bname:'攻击', per: "perAtk"},
        18: {__proto__: debuff,bname:'防御', per: "perDef"},
        19: {__proto__: debuff,bname:'急速', per: "perSpd"},
        20: {__proto__: debuff,bname:'智慧', per: "perItl"},
        21: {//回血
            __proto__:commonAbi,
            isNormalAbi:true,
            score: function (from, to) {
                var n = parseInt(from.maxHp * this.power / 100);
                if (from.maxHp - from._hp > n) n = from.maxHp - from._hp;
                return n;
            },
            apply: function (from, to, ref) {
                var n = parseInt(from.maxHp * this.power / 100);
                from.setHp(from._hp+n);
                return  {
                    msg: this.name +"使"+ from.name+"恢复了"+n+"HP，当前剩余"+from._hp+"HP"
                };
            },
            isHeal:true
        },
        22: {//复活
            __proto__:commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__:this,
                    getOtherCase:false,
                    apply:function(from, to, ref) {
                        return  {
                            msg: from.name+"使用"+this.name +"失败"
                        };
                    },
                    prop:100-this.power
                }
            },
            apply:function(from, to, ref) {
                from._hp = from.maxHp;
                return  {
                    msg: this.name +"技能使"+ from.name+"复活了"
                };
            },
            exOrder:4
        },
        23: {//吸血
            __proto__:commonAbi,
            isNormalAbi:true,
            apply: function (from, to, ref) {
                var n = parseInt(
                        from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
                );
                if (n < 1) n = 1;
                to.setHp(to._hp - n);
                var n2 = parseInt(n * this.power2/100);
                from.setHp(from._hp+n2);
                return  {
                    msg: this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP，"+from.name+"吸收了"+n2+"HP，当前为"+from._hp+"HP"
                };
            },
            score: function (from, to) {
                var n = parseInt(
                        from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
                );
                if (n < 1) n = 1;
                if (n > to._hp) n = to._hp;
                var n2 = parseInt(n * this.power2/100);
                if (from.maxHp - from._hp > n2) n2 = from.maxHp - from._hp;
                return n+n2;
            },
            isHeal: true
        },
        24: {//吸蓝
            __proto__:commonAbi,
            isNormalAbi:true,
            apply: function (from, to, ref) {
                var n = parseInt(
                    from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
                );
                if (n < 1) n = 1;
                to.setMp(to._mp - n);
                var n2 = parseInt(n * this.power2/100);
                from.setMp(from._mp+n2);
                return  {
                    msg: this.name + "对" + to.name + "的MP造成了" + n + "点伤害，剩余" + to._mp + "MP，"+from.name+"吸收了"+n2+"MP，当前为"+from._mp+"MP"
                };
            },
            score: function (from, to) {
                var n = parseInt(
                        from.itl * (from.perItl + this.power) / 100 - to.itl * (100 + to.perItl) / 200
                );
                if (n < 1) n = 1;
                if (n > to._mp) n = to._mp;
                var n2 = parseInt(n * this.power2/100);
                if (from.maxMp - from._mp > n2) n2 = from.maxMp - from._mp;
                return n+n2;
            },
            isHeal: true
        },
        25: {//先攻
            __proto__: basicAtk,
            enOrder: 5
        },
        26: {//自爆
            __proto__:commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__:this,
                    getOtherCase:false,
                    apply:function(from, to, ref) {
                        return  {
                            msg: from.name+"使用"+this.name +"失败"
                        };
                    },
                    prop:100-this.power
                }
            },
            apply: function (from, to, ref) {
                var n = this.mp+from._mp;
                to.setHp(to._hp - n);
                from._hp=0;
                from._mp=0;
                return  {
                    msg: this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP"
                };
            },
            exOrder: 2
        },
        27: {//背水
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__:this,
                    getOtherCase:false,
                    apply:function(from, to, ref) {
                        return  {
                            msg: from.name+"使用"+this.name +"失败"
                        };
                    },
                    prop:100-this.power
                }
            },
            apply: function (from, to, ref) {
                from._hp = 1;
                from._mp = 0;
                return  {
                    msg: this.name + "使" + from.name + "承受一击打，当前1HP、0MP"
                };
            },
            exOrder: 3,
            is1hpRelive: true
        },
        28: {__proto__: buff2,bname:'攻击',bname2:'防御', per: "perAtk",per2: "perDef"},
        29: {__proto__: buff2,bname:'攻击',bname2:'急速', per: "perAtk",per2: "perSpd"},
        30: {__proto__: buff2,bname:'攻击',bname2:'智慧', per: "perAtk",per2: "perItl"},
        31: {__proto__: buff2,bname:'防御',bname2:'急速', per: "perDef",per2: "perSpd"},
        32: {__proto__: buff2,bname:'防御',bname2:'智慧', per: "perDef",per2: "perItl"},
        33: {__proto__: buff2,bname:'急速',bname2:'智慧', per: "perSpd",per2: "perItl"},
        34:{//猛击
            __proto__: commonAbi,
            getOtherCase:function (from, to) {
                return {
                    __proto__:this,
                    getOtherCase:false,
                    apply: function (from, to, ref) {
                        var n = parseInt(
                                from.atk * (from.perAtk + 50) / 100
                        );
                        if (n < 1) n = 1;
                        to.setHp(to._hp - n);
                        return  {
                            msg: this.name + "MISS！对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP",
                            power:n
                        };
                    },
                    prop: 100 - this.power2
                };
            },
            apply: function (from, to, ref) {
                var n = parseInt(
                        from.atk * (from.perAtk + this.power) / 100
                );
                if (n < 1) n = 1;
                to.setHp(to._hp - n);
                return  {
                    msg: this.name + "GOOD！对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP",
                    power:n
                };
            },
            score: function (from, to) {
                var damageGood = from.atk * (from.perAtk + this.power) / 100;
                var damageBad = from.atk * (from.perAtk + 50) / 100;
                var n = parseInt((damageGood * this.power2 + damageBad * (100 - this.power2))/100);
                if (n> to._hp) n = to._hp;
                return parseInt(n-this.mp/50);
            },
            isNormalAbi:true,
            isDamageAtk:true,
            isPhysicAtk:false
        },
        35: {//天界
            __proto__: commonAbi,
            apply: function (from, to, ref) {
                var msg = "";
                if (to.perAtk > 0) {to.perAtk = 0;msg+="攻击"}
                if (to.perDef > 0) {to.perDef = 0;msg+="防御"}
                if (to.perSpd > 0) {to.perSpd = 0;msg+="急速"}
                if (to.perItl > 0) {to.perItl = 0;msg+="智慧"}
                return  {
                    msg: this.name + "使" + to.name + "的" + msg  + "buff被消除"
                };
            },
            enOrder: 3
        },
        36:{
            __proto__: commonAbi,
            isPhysicAtkAvoid:true,
            apply: function (from, to, ref) {
                return  {
                    msg: this.name + "使" + to.name + "躲避了攻击"
                };
            }
        },
        37: {//锁蓝
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
                return {
                    __proto__:this,
                    getOtherCase:false,
                    apply:function(from, to, ref) {
                        return  {
                            msg: from.name+"使用"+this.name +"失败"
                        };
                    },
                    prop:100-this.power
                }
            },
            apply: function (from, to, ref) {
                to.setMp(0);
                return  {
                    msg: this.name + "使" + to.name + "的MP归零"
                };
            },
            enOrder: 2
        },
        38: {//全防
            __proto__: commonAbi,
            apply: function (from, to, ref) {
                from.allDef = true;
                return  {
                    msg: this.name + "使" + from.name + "的属性防御力上升了"
                };
            },
            enOrder: 4
        },
        40: {//反击
            __proto__: commonAbi,
            apply: function (from, to, ref) {
                var n = parseInt(ref.power * this.power2 / 100);
                if (n<1) n = 1;
                to.setHp(to._hp-n);
                return  {
                    msg: this.name + "对" + to.name + "造成了" + n + "点伤害，剩余" + to._hp + "HP"
                };
            },
            isAtkBack : true
        },
        41: {
            __proto__: commonAbi,
            getOtherCase: function (from, to) {
            return {
                __proto__:this,
                getOtherCase:false,
                apply:function(from, to, ref) {
                    return  {
                        msg: from.name+"使用"+this.name +"失败"
                    };
                },
                prop:100-this.power
            }
        },
            apply: function (from, to, ref) {
                to.perConfuse = this.power2
                return  {
                    msg: this.name + "使" + to.name + "的进入"+this.power2+"%的混乱状态"
                };
            },
            enOrder: 1
        },
        //血斩
        43: {
            __proto__:physicAtk,
            cast: function (card) {
                card.setHp(card._hp - this.power2);
                card['abi' + this.id] = true;
                return  {
                    msg: card.name + "使用" + this.name +"，消耗HP"+this.power2+"剩余"+card._hp+"HP"
                };
            },
            score: function (from, to) {
                var n = parseInt(
                        from.atk * (from.perAtk + this.power) / 100 - to.def * (100 + to.perDef) / 200
                );
                if (n < 1) n = 1;
                if (n > to._hp) n = to._hp;
                var rank = n-this.power2;
                if (from._hp<this.power2){
                    return 0;
                }else if (rank<1) rank = 1;
                return rank;
            },
            isPhysicAtk:false
        }

    };
    var ABI = {
        basicAtk: basicAtk
    };
    for (var idx in _db.skill) {
        var data = _db.skill[idx];
        ABI[idx] = {
            __proto__: abiE[data[5]],
            id:idx,
            name:data[0],
            mp: data[2],
            power: data[3],
            power2: data[4],
            element: data[5]
        }
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
                        getOtherCase:false,
                        prop: 1 - multiAbi.prop
                    },
                    getOtherCase: function (from,to) {
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
                if (!(abi.element==35/*天界*/ && tcard.perAtk <= 0 && tcard.perDef <= 0 && tcard.perItl <= 0 && tcard.perSpd <= 0)) {
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
var stageP = {
    get_from: function () {
        return this.casting.from ? this.left[0] : this.right[0];//t=left,f=right
    },
    get_to: function () {
        return this.casting.to ? this.left[0] : this.right[0];//t=left,f=right
    },
    fork: function (prop) {
        var stage = {
            __proto__: this,
            left: this.left.slice(0),
            right: this.right.slice(0)
        };
        stage.left[0] = {__proto__: this.left[0]};
        stage.right[0] = {__proto__: this.right[0]};
        stage.prop = this.prop * prop / 100;
        if (!this.logs){
        }else if (stage.prop<0.1) {
            $("<li class='end'>分支选择几率" + prop + "%，累计约" + stage.prop + "%，分支过多，后续日将关闭</li>").appendTo(this.logs.msg);
            stage.logs = false;
        }else{
            var sublog = $("<ul>").hide();
            stage.logs =  {
                msg: sublog,
                sub: []
            };
            $("<li class='branch'>分支选择几率" + prop + "%，累计约" + stage.prop + "%</li>").appendTo(this.logs.msg).click(function (){sublog.toggle()});
            sublog.appendTo(this.logs.msg);
            this.logs.sub.push(stage.logs);
        }
        return stage;
    },
    log: function (text,cls) {
        if (!this.logs) return;
        if (!cls) this.logs.msg.append("<li class='log'>"+text+"</li>");
        else this.logs.msg.append("<li class='"+cls+"'>"+text+"</li>");
    }
};
var swapCard = function () {
    var stage = this;
    var idx, length;
    for (idx = 0, length = stage.left.length; idx < length; idx++) {
        if (stage.left[idx]._hp > 0) break;
        stage.log(stage.left[idx].name+"退场");
    }
    if (idx > 0) {
        stage.left = stage.left.slice(idx);
        if (stage.left.length > 0) stage.left[0] = {__proto__:stage.left[0]};
    }

    for (idx = 0, length = stage.right.length; idx < length; idx++) {
        if (stage.right[idx]._hp > 0) break;
        stage.log(stage.right[idx].name+"退场");
    }
    if (idx > 0) {
        stage.right = stage.right.slice(idx);
        if (stage.right.length > 0) stage.right[0] = {__proto__:stage.right[0]};
    }
    stage.nextRound = false;
    if (stage.right.length < 1) {
        stage.win = true;
        stage.log("战斗结束，左方胜"+stage.left.length+"张卡","end")
    }
    else if (stage.left.length < 1) {
        stage.win = false;
        stage.log("战斗结束，右方胜"+stage.right.length+"张卡","end")
    }
    else stage.nextRound = entranceCast;
    return stage;
};

var entranceCast = function () {
    var stage = this;
    var abiL = stage.left[0].selectEntranceAbi(stage.right[0]);
    var abiR = stage.right[0].selectEntranceAbi(stage.left[0]);
    if (!!abiL && !!abiR) {
        if (abiL.enOrder > abiR.enOrder) abiR = null;
        else if (abiL.enOrder < abiR.enOrder) abiL = null;
        else if (stage.right[0].actSpd > stage.left[0].actSpd) abiL = null;
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
    var ret = stage.casting.abi.cast(stage.get_from());
    stage.log(ret.msg);
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
        newstage.casting.abi = newabi;
//        stage.stages.push(newstage);
        stage = stage.fork(100-newabi.prop);
    }
    ret = abi.apply(stage.get_from(), stage.get_to(), stage.casting.ref);
    stage.log(ret.msg);
    if (stage.get_to()._hp > 0) {
        abi = stage.get_to().selectFightbackAbi(abi);
        if (!!abi) {
            stage.casting = {
                from: stage.casting.to,
                to: stage.casting.from,
                abi: abi,
                ref: ret
            };
            ret = stage.casting.abi.cast(stage.get_from());
            stage.log(ret.msg);
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
            ret = stage.casting.abi.cast(stage.get_from());
            stage.log(ret.msg);
            stage.nextRound = exitApply;
        } else {
            stage.nextRound = swapCard;
        }
    }
    if(newstage && stage.prop<newstage.prop){
        stage.stages.push(stage);
        return newstage;
    }else {
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
        stage = stage.fork(100-newabi.prop);
    }
    ret = abi.apply(stage.get_from(), stage.get_to());
    stage.log(ret.msg);
    if (stage.get_from()._hp > 0) {
        stage.nextRound = entranceCast;
    } else {
        stage.nextRound = swapCard;
    }
    if(newstage && stage.prop<newstage.prop){
        stage.stages.push(stage);
        return newstage;
    }else {
        if (newstage) stage.stages.push(newstage);
        return stage;
    }
};
var fightCast = function () {
    var stage = this;
    var atk, def, dir;
    if (stage.left[0].actSpd >= stage.right[0].actSpd) {
        atk = stage.left[0];
        def = stage.right[0];
        dir = true;
    } else {
        def = stage.left[0];
        atk = stage.right[0];
        dir = false;
    }
    atk.actSpd -= def.actSpd;
    def.actSpd = parseInt(def.spd * (100 + def.perSpd) / 100);

    var abi = atk.selectAbi(def);
    var ret = abi.cast(atk);
    stage.log(ret.msg);
    stage.nextRound = fightApply;
    if (atk.perConfuse > 0) {
        var newstage = stage.fork(atk.perConfuse);
        newstage.casting = {
            from: dir,
            to: dir,
            abi: abi
        };
        newstage.log("混乱生效");
        stage = stage.fork(100 - atk.perConfuse);
        stage.log("混乱未生效");
    }
    stage.casting = {
        from: dir,
        to: !dir,
        abi: abi
    };
    if(newstage && stage.prop<newstage.prop){
        stage.stages.push(stage);
        return newstage;
    }else {
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
        ret = abiBack.cast(newstage.get_to());
        newstage.log(ret.msg);
        abiBack.apply(newstage.get_from(), newstage.get_to());
        newstage.nextRound = fightCast;
//        stage.stages.push(newstage);
        stage = stage.fork(100 - abiBack.prop);
    }
    if (!!abi.getOtherCase) {
        var newabi = abi.getOtherCase(stage.get_from(), stage.get_to());
        var newstage2 = stage.fork( newabi.prop);
        newstage2.casting.abi = newabi
//        stage.stages.push(newstage2);
        stage = stage.fork(100 - newabi.prop);
    }
    ret = abi.apply(stage.get_from(), stage.get_to(), stage.casting.ref);
    stage.log(ret.msg);
    if (stage.get_to()._hp > 0) {
        abi = stage.get_to().selectFightbackAbi(abi);
        if (stage.casting.from != stage.casting.to && !!abi) {
            stage.casting = {
                from: stage.casting.to,
                to: stage.casting.from,
                abi: abi,
                ref: ret
            };
            ret = stage.casting.abi.cast(stage.get_from());
            stage.log(ret.msg);
            stage.nextRound = fightApply;
        } else {
            stage.nextRound = fightCast;
        }
    } else {
        abi = stage.get_to().selectExitAbi();
        if (!!abi) {
            stage.casting = {
                from: stage.casting.to,
                to:  !stage.casting.to,
                abi: abi,
                ref: ret
            };
            ret = stage.casting.abi.cast(stage.get_from());
            stage.log(ret.msg);
            stage.nextRound = exitApply;
        } else {
            stage.nextRound = swapCard;
        }
    }
    if (newstage && stage.prop<newstage.prop){
        if(newstage2 && newstage.prop<newstage2.prop){
            stage.stages.push(stage);
            stage.stages.push(newstage);
            return newstage2;
        }else{
            stage.stages.push(stage);
            if (newstage2) stage.stages.push(newstage2);
            return newstage;
        }
    }else{
        if (newstage) stage.stages.push(newstage);
        if(newstage2 && stage.prop<newstage2.prop){
            stage.stages.push(stage);
            return newstage2;
        }else{
            if (newstage2) stage.stages.push(newstage2);
            return stage;
        }
    }
};


function analyse(left, right) {
    for (var idx in dps) {
        dps[idx].y = 0;
    }
    chart.options.title.text="胜率分析中";
    chart.aProgress = 0;
    chart.aWin = 0;
    chart.render();
    var msg=$("#logContainer").empty();
    window.log = {
        msg: msg,
        sub: []
    };
    var idx;
    for (idx in left) {
        left[idx].__proto__ = cardP;
        left[idx].init();
        left[idx].name = "左"+idx+left[idx].name;
    }
    for (idx in right) {
        right[idx].__proto__ = cardP;
        right[idx].init();
        right[idx].name = "右"+idx+right[idx].name;
    }
    var stages = [
        {
            __proto__: stageP,
            left: left,
            right: right,
            prop: 100,
            logs: window.log,
            nextRound: swapCard
        }
    ];
    stageP.stages = stages;
    function nextRun() {
        var stage = stages.shift();
        if (!stage){
            chart.options.title.text="胜率分析完毕，合计胜率"+chart.aWin +"%";
            $("#bt1").removeAttr("disabled");
            $("#bt2").removeAttr("disabled");
            $("#btc").hide();
            chart.render();
        }
        else if (window.cancelRun){
            window.cancelRun = false;
            chart.options.title.text="胜率分析取消，完成度"+chart.aProgress +"%";
            $("#bt1").removeAttr("disabled");
            $("#bt2").removeAttr("disabled");
            $("#btc").hide();
            chart.render();
        }else {
            while (!!stage.nextRound) stage=stage.nextRound();
            if (stage.right.length > 0) dps[10 + stage.right.length].y += stage.prop;
            else {
                dps[10 - stage.left.length].y += stage.prop;
                chart.aWin += stage.prop;
            }
            chart.aProgress += stage.prop;
            chart.options.title.text="胜率分析中已完成"+chart.aProgress +"%";
            chart.render();
            setTimeout(nextRun, 0);
        }
    }

    nextRun();
}
