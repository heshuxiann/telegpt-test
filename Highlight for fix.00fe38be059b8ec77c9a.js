(self["webpackChunkTelyAI"] = self["webpackChunkTelyAI"] || []).push([["Highlight for fix"],{

/***/ "./node_modules/highlight.js/lib/languages/fix.js"
/*!********************************************************!*\
  !*** ./node_modules/highlight.js/lib/languages/fix.js ***!
  \********************************************************/
(module) {

/*
Language: FIX
Author: Brent Bradbury <brent@brentium.com>
*/

/** @type LanguageFn */
function fix(hljs) {
  return {
    name: 'FIX',
    contains: [
      {
        begin: /[^\u2401\u0001]+/,
        end: /[\u2401\u0001]/,
        excludeEnd: true,
        returnBegin: true,
        returnEnd: false,
        contains: [
          {
            begin: /([^\u2401\u0001=]+)/,
            end: /=([^\u2401\u0001=]+)/,
            returnEnd: true,
            returnBegin: false,
            className: 'attr'
          },
          {
            begin: /=/,
            end: /([\u2401\u0001])/,
            excludeEnd: true,
            excludeBegin: true,
            className: 'string'
          }
        ]
      }
    ],
    case_insensitive: true
  };
}

module.exports = fix;


/***/ }

}]);
//# sourceMappingURL=Highlight for fix.00fe38be059b8ec77c9a.js.map