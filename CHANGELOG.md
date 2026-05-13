# Changelog

## [3.0.0] - 2026-05-13

### Added

- BREAKING: `.evaluate()` no longer allows arbitrary and potentially malicious context to be passed for custom function strings. Such functions need to be defined on `Parser.functions`, e.g. `Parser.functions.f = () => {}` rather than `.evaluate({ f: () => {} })`. This fixes [CVE-2025-12735](https://github.com/advisories/GHSA-jc85-fpwf-qm7x).
- Block access to `__proto__`, `prototype`, and `constructor` properties during evaluation and simplification to prevent sandbox escape via prototype chain traversal. This fixes [GHSA-8gw3-rxh4-v6jx](https://github.com/advisories/GHSA-8gw3-rxh4-v6jx).
