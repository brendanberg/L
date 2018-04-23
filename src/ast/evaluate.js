/*
    Evaluate AST node
    (Really an IR node)
 */

const { Map, List, Record } = require('immutable');

const _ = null;
const _map = Map({});
const _list = List([]);


let Evaluate = Record({target: _, tags: _map}, 'Evaluate');

Evaluate.prototype.eval = function(ctx) {
    let target = this.target;

    if (target._name === 'Block' /* && target.getIn(['tags', 'envelopeShape']) === '{}' */) {
        let result = [];

        for (let exp of target.exprs) {
            let r = exp.eval && exp.eval(ctx) || new AST.Bottom();
            result.push(r);
        }

        return result.pop();
    } else {
        return target.eval(ctx);
    }
};

module.exports = Evaluate;

