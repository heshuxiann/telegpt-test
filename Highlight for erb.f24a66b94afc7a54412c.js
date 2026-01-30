(self["webpackChunkTelyAI"] = self["webpackChunkTelyAI"] || []).push([["Highlight for erb"],{

/***/ "./node_modules/highlight.js/lib/languages/erb.js"
/*!********************************************************!*\
  !*** ./node_modules/highlight.js/lib/languages/erb.js ***!
  \********************************************************/
(module) {

/*
Language: ERB (Embedded Ruby)
Requires: xml.js, ruby.js
Author: Lucas Mazza <lucastmazza@gmail.com>
Contributors: Kassio Borges <kassioborgesm@gmail.com>
Description: "Bridge" language defining fragments of Ruby in HTML within <% .. %>
Website: https://ruby-doc.org/stdlib-2.6.5/libdoc/erb/rdoc/ERB.html
Category: template
*/

/** @type LanguageFn */
function erb(hljs) {
  return {
    name: 'ERB',
    subLanguage: 'xml',
    contains: [
      hljs.COMMENT('<%#', '%>'),
      {
        begin: '<%[%=-]?',
        end: '[%-]?%>',
        subLanguage: 'ruby',
        excludeBegin: true,
        excludeEnd: true
      }
    ]
  };
}

module.exports = erb;


/***/ }

}]);
//# sourceMappingURL=Highlight for erb.f24a66b94afc7a54412c.js.map