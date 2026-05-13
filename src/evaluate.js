import {
  INUMBER,
  IOP1,
  IOP2,
  IOP3,
  IVAR,
  IFUNCALL,
  IEXPR,
  IMEMBER,
} from "./instruction";

var DANGEROUS_PROPERTIES = {
  __proto__: true,
  prototype: true,
  constructor: true,
};

/**
 * Checks if a function reference 'f' is explicitly allowed to be executed.
 * This logic is the core security allowance gate.
 */
function isAllowedFunc(f, expr, values) {
  // function definition is included in registered functions
  if (Object.values(expr.functions).includes(f)) return true;

  for (const v of Object.values(values)) {
    if (typeof v === "object" && v !== null) {
      for (const subV of Object.values(v)) {
        if (subV === f) {
          const SAFE_MATH = Object.freeze({
            abs: Math.abs,
            acos: Math.acos,
            asin: Math.asin,
            atan: Math.atan,
            atan2: Math.atan2,
            ceil: Math.ceil,
            clz32: Math.clz32,
            cos: Math.cos,
            exp: Math.exp,
            floor: Math.floor,
            imul: Math.imul,
            fround: Math.fround,
            f16round: Math.f16round,
            log: Math.log,
            max: Math.max,
            min: Math.min,
            pow: Math.pow,
            random: Math.random,
            round: Math.round,
            sin: Math.sin,
            sqrt: Math.sqrt,
            tan: Math.tan,
            log10: Math.log10,
            log2: Math.log2,
            log1p: Math.log1p,
            expm1: Math.expm1,
            cosh: Math.cosh,
            sinh: Math.sinh,
            tanh: Math.tanh,
            acosh: Math.acosh,
            asinh: Math.asinh,
            atanh: Math.atanh,
            hypot: Math.hypot,
            trunc: Math.trunc,
            sign: Math.sign,
            cbrt: Math.cbrt,
          });
          // allow Math functions
          for (var key of Object.getOwnPropertyNames(SAFE_MATH)) {
            if (SAFE_MATH[key] === subV) return true;
          }
          // function definition is included in registered functions
          return Object.values(expr.functions).includes(subV);
        }
      }
    }
  }
  return false;
}
export default function evaluate(tokens, expr, values) {
  var nstack = [];
  var n1, n2, n3;
  var f;
  for (var i = 0; i < tokens.length; i++) {
    var item = tokens[i];
    var type = item.type;
    if (type === INUMBER) {
      nstack.push(item.value);
    } else if (type === IOP2) {
      n2 = nstack.pop();
      n1 = nstack.pop();
      if (item.value === "&&") {
        nstack.push(n1 ? !!evaluate(n2, expr, values) : false);
      } else if (item.value === "||") {
        nstack.push(n1 ? true : !!evaluate(n2, expr, values));
      } else {
        f = expr.binaryOps[item.value];
        nstack.push(f(n1, n2));
      }
    } else if (type === IOP3) {
      n3 = nstack.pop();
      n2 = nstack.pop();
      n1 = nstack.pop();
      if (item.value === "?") {
        nstack.push(evaluate(n1 ? n2 : n3, expr, values));
      } else {
        f = expr.ternaryOps[item.value];
        nstack.push(f(n1, n2, n3));
      }
    } else if (type === IVAR) {
      if (DANGEROUS_PROPERTIES[item.value]) {
        throw new Error("prototype access detected: " + item.value);
      }
      if (item.value in expr.functions) {
        nstack.push(expr.functions[item.value]);
      } else {
        var v = values[item.value];
        if (v !== undefined) {
          if (typeof v === "function" && !isAllowedFunc(v, expr, values)) {
            throw new Error(
              "calling unregistered functions is not allowed: " + item.value,
            );
          }
          nstack.push(v);
        } else {
          throw new Error("undefined variable: " + item.value);
        }
      }
    } else if (type === IOP1) {
      n1 = nstack.pop();
      f = expr.unaryOps[item.value];
      nstack.push(f(n1));
    } else if (type === IFUNCALL) {
      var argCount = item.value;
      var args = [];
      while (argCount-- > 0) {
        args.unshift(nstack.pop());
      }
      f = nstack.pop();
      if (f && f.apply && f.call) {
        if (!isAllowedFunc(f, expr, values)) {
          throw new Error("calling unregistered functions is not allowed");
        }
        nstack.push(f.apply(undefined, args));
      } else {
        throw new Error(f + " is not a function");
      }
    } else if (type === IEXPR) {
      nstack.push(item.value);
    } else if (type === IMEMBER) {
      if (DANGEROUS_PROPERTIES[item.value]) {
        throw new Error("prototype access detected: " + item.value);
      }
      n1 = nstack.pop();
      var member = n1 == null ? undefined : n1[item.value];
      if (
        typeof member === "function" &&
        !isAllowedFunc(member, expr, values)
      ) {
        throw new Error(
          "calling unregistered functions is not allowed: " + item.value,
        );
      }
      nstack.push(member);
    } else {
      throw new Error("invalid Expression");
    }
  }
  if (nstack.length > 1) {
    throw new Error("invalid Expression (parity)");
  }
  return nstack[0];
}
