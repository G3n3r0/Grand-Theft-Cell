var fs = require('fs');
var ast = require('./ast');

module.exports = function() {
    var code = [];
    function write(src, eol) {
        code.push(src + (eol ? '\n' : ''));
    };

    function write_runtime() {
        var rt = fs.readFileSync('runtime.js', 'utf-8');
        write(rt, true);
    }

    function link(node1, node2, tag) {
        node2.link = node1;
        node1.tag = tag;
    }

    function unlink(node) {
        node.link = null;
    }

    function write_number(node) {
        // NUMBER
        write(node.data);
    }

    function write_string(node) {
        // STRING
        write('"' + node.data + '"');
    }

    function write_term(node) {
        // TERM (variable, keyword, etc)
        write(node.data.replace(/-/g, '_'));
    }

    function write_symbol(node) {
        // SYMBOL
        write('make_symbol("' + node.data + '")');
    }

    function write_set(node, parse) {
        // var TERM = EXPR;
        write('var ');
        write_set_excl(node, parse);
    }

    function write_set_excl(node, parse) {
        // TERM = EXPR;
        write(node.children[1].data + ' = ');
        parse(node.children[2]);
        write(';');
    }

    function write_lambda(node, parse) {
        // function(TERM1, TERM2, ...) { EXPR1; EXPR2; ...; return EXPRn; }
        var lst = node.children[1];
        var args = [];

        for(var i=0; i<lst.children.length; i++) {
            args.push(lst.children[i].data);
        }

        write('function(' + args.join(',') + '){', true);

        for(var i=2; i<node.children.length; i++) {
            if(i == node.children.length-1) {
                write('return ');
            }
            parse(node.children[i]);
        }

        write('}', true);
    }

    function write_if(node, parse) {
        // (function() { if(EXPR1) { return EXPR2; } else { return EXPR3; }})()
        write('(function() {');

        write('if(');
        parse(node.children[1]);
        write(') { return ');
        parse(node.children[2]);
        write(';}');

        if(node.children.length > 3) {
            write(' else { return ');
            parse(node.children[3]);
            write(';}');
        }

        write('})()', true);
    }

    function write_op(op, node, parse) {
        // (EXPR1 <op> EXPR2 <op> ... <op> EXPRn),
        write('(');
        for(var i=1; i<node.children.length; i++) {
            if(i > 1) {
                write(op);
            }

            // Link these nodes for context (big hack)
            var arg = node.children[i];
            link(node, arg, 'expr');
            parse(arg);
            unlink(arg);
        }

        write(')');
    }

    function write_plus(node, parse) {
        write_op('+', node, parse);
    }

    function write_minus(node, parse) {
        write_op('-', node, parse);
    }

    function write_mult(node, parse) {
        write_op('*', node, parse);
    }

    function write_divide(node, parse) {
        write_op('/', node, parse);
    }

    function write_equals(node, parse) {
        write_op('==', node, parse);
    }

    function write_gt(node, parse) {
        write_op('>', node, parse);
    }

    function write_lt(node, parse) {
        write_op('<', node, parse);
    }

    function write_func_call(node, parse) {
        write('(');
        parse(node.children[0]);
        write(')(');

        for(var i=1; i<node.children.length; i++) {
            if(i>1) {
                write(',');
            }

            var arg = node.children[i];

            // link these nodes for context (big hack)
            link(node, arg, 'expr');
            parse(arg);

            // unlink it to avoid circular references
            unlink(arg);
        }

        write(')');

        // if the parent node is not a function call, we should end
        // the expression. this solves ambiguities with the next
        // statement which could be another function call in the form
        // (foo)(x, y, z) where it tries to call the result of this
        // function
        if(!node.link ||
           (node.link && node.link.tag != 'expr')) {
            write(';');
        }
    }

    function write_array(node, quoted) {
        if(node.type == ast.TERM) {
            if(quoted) {
                write_symbol(node);
            }
            else {
                write_term(node);
            }
        }
        else if(node.type == ast.NUMBER) {
            write_number(node);
        }
        else if(node.type == ast.STRING) {
            write_string(node);
        }
        else if(node.type == ast.LIST) {
            write('[');
            for(var i=0; i<node.children.length; i++) {
                if(i > 0) {
                    write(',');
                }
                write_array(node.children[i], quoted);
            }
            write(']');
        }
    }

    return {
        write_runtime: write_runtime,
        write_number: write_number,
        write_string: write_string,
        write_term: write_term,
        write_set: write_set,
        write_set_excl: write_set_excl,
        write_lambda: write_lambda,
        write_if: write_if,
        write_plus: write_plus,
        write_minus: write_minus,
        write_mult: write_mult,
        write_divide: write_divide,
        write_equals: write_equals,
        write_gt: write_gt,
        write_lt: write_lt,
        write_func_call: write_func_call,
        write_array: write_array,
        write_symbol: write_symbol,

        get_code: function() {
            return code.join('');
        }
    };
};
