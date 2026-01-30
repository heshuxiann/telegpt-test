"use strict";
(self["webpackChunkTelyAI"] = self["webpackChunkTelyAI"] || []).push([["src_components_common_PeerBadge_tsx-src_components_common_pickers_PickerModal_tsx-src_compone-e47010"],{

/***/ "./src/assets/diamond.png"
/*!********************************!*\
  !*** ./src/assets/diamond.png ***!
  \********************************/
(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__.p + "diamond.9926e8364655a28cecf3.png";

/***/ },

/***/ "./src/components/common/InteractiveSparkles.module.scss"
/*!***************************************************************!*\
  !*** ./src/components/common/InteractiveSparkles.module.scss ***!
  \***************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"sparkles":"hHHgpBRr"});

/***/ },

/***/ "./src/components/common/InteractiveSparkles.tsx"
/*!*******************************************************!*\
  !*** ./src/components/common/InteractiveSparkles.tsx ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../lib/teact/teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _util_buildClassName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../util/buildClassName */ "./src/util/buildClassName.ts");
/* harmony import */ var _util_particles__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../util/particles */ "./src/util/particles.ts");
/* harmony import */ var _InteractiveSparkles_module_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./InteractiveSparkles.module.scss */ "./src/components/common/InteractiveSparkles.module.scss");





const DEFAULT_PARTICLE_PARAMS = {
  centerShift: [0, -36]
};
const InteractiveSparkles = ({
  color = 'purple',
  centerShift = DEFAULT_PARTICLE_PARAMS.centerShift,
  isDisabled,
  className,
  onRequestAnimation
}) => {
  const canvasRef = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useRef)();
  (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect)(() => {
    if (isDisabled) return undefined;
    return (0,_util_particles__WEBPACK_IMPORTED_MODULE_2__.setupParticles)(canvasRef.current, {
      color: _util_particles__WEBPACK_IMPORTED_MODULE_2__.PARTICLE_COLORS[`${color}Gradient`],
      centerShift
    });
  }, [centerShift, color, isDisabled]);
  (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!onRequestAnimation) return;
    const animate = () => {
      if (isDisabled) return;
      (0,_util_particles__WEBPACK_IMPORTED_MODULE_2__.setupParticles)(canvasRef.current, {
        color: _util_particles__WEBPACK_IMPORTED_MODULE_2__.PARTICLE_COLORS[`${color}Gradient`],
        centerShift,
        ..._util_particles__WEBPACK_IMPORTED_MODULE_2__.PARTICLE_BURST_PARAMS
      });
    };
    onRequestAnimation(animate);
  }, [centerShift, color, isDisabled, onRequestAnimation]);
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("canvas", {
    ref: canvasRef,
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_InteractiveSparkles_module_scss__WEBPACK_IMPORTED_MODULE_3__["default"].sparkles, className)
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(InteractiveSparkles));

/***/ },

/***/ "./src/components/common/PeerBadge.module.scss"
/*!*****************************************************!*\
  !*** ./src/components/common/PeerBadge.module.scss ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"root":"hyRfEyRz","top":"p_Ny8jqJ","badge":"QRrryqp4","text":"I5jdPgFL"});

/***/ },

/***/ "./src/components/common/PeerBadge.tsx"
/*!*********************************************!*\
  !*** ./src/components/common/PeerBadge.tsx ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../lib/teact/teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _util_buildClassName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../util/buildClassName */ "./src/util/buildClassName.ts");
/* harmony import */ var _hooks_useLang__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../hooks/useLang */ "./src/hooks/useLang.ts");
/* harmony import */ var _Avatar__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Avatar */ "./src/components/common/Avatar.tsx");
/* harmony import */ var _icons_Icon__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./icons/Icon */ "./src/components/common/icons/Icon.tsx");
/* harmony import */ var _PeerBadge_module_scss__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./PeerBadge.module.scss */ "./src/components/common/PeerBadge.module.scss");







const PeerBadge = ({
  peer: avatarPeer,
  avatarWebPhoto,
  avatarSize,
  text,
  badgeText,
  badgeIcon,
  className,
  badgeClassName,
  badgeIconClassName,
  textClassName,
  onClick
}) => {
  const lang = (0,_hooks_useLang__WEBPACK_IMPORTED_MODULE_2__["default"])();
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_PeerBadge_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].root, onClick && _PeerBadge_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].clickable, className),
    onClick: onClick
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: _PeerBadge_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].top
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_Avatar__WEBPACK_IMPORTED_MODULE_3__["default"], {
    size: avatarSize,
    peer: avatarPeer,
    webPhoto: avatarWebPhoto
  }), badgeText && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_PeerBadge_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].badge, badgeClassName),
    dir: lang.isRtl ? 'rtl' : 'ltr'
  }, badgeIcon && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_icons_Icon__WEBPACK_IMPORTED_MODULE_4__["default"], {
    name: badgeIcon,
    className: badgeIconClassName
  }), badgeText)), text && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("p", {
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_PeerBadge_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].text, textClassName)
  }, text));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(PeerBadge));

/***/ },

/***/ "./src/components/common/pickers/PickerModal.module.scss"
/*!***************************************************************!*\
  !*** ./src/components/common/pickers/PickerModal.module.scss ***!
  \***************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"content":"FuFYE0AA","fixedHeight":"CrEsDylb","withSearch":"WGSZ8u75","header":"iEptOmIp","buttonWrapper":"HqeDTaSr"});

/***/ },

/***/ "./src/components/common/pickers/PickerModal.tsx"
/*!*******************************************************!*\
  !*** ./src/components/common/pickers/PickerModal.tsx ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../lib/teact/teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _util_buildClassName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../util/buildClassName */ "./src/util/buildClassName.ts");
/* harmony import */ var _hooks_useOldLang__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../hooks/useOldLang */ "./src/hooks/useOldLang.ts");
/* harmony import */ var _ui_Button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../ui/Button */ "./src/components/ui/Button.tsx");
/* harmony import */ var _ui_Modal__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../ui/Modal */ "./src/components/ui/Modal.tsx");
/* harmony import */ var _PickerModal_module_scss__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./PickerModal.module.scss */ "./src/components/common/pickers/PickerModal.module.scss");
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }







const PickerModal = ({
  confirmButtonText,
  isConfirmDisabled,
  shouldAdaptToSearch,
  withFixedHeight,
  onConfirm,
  withPremiumGradient,
  ...modalProps
}) => {
  const lang = (0,_hooks_useOldLang__WEBPACK_IMPORTED_MODULE_2__["default"])();
  const hasButton = Boolean(confirmButtonText || onConfirm);
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_Modal__WEBPACK_IMPORTED_MODULE_4__["default"], _extends({}, modalProps, {
    isSlim: true,
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(shouldAdaptToSearch && _PickerModal_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].withSearch, withFixedHeight && _PickerModal_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].fixedHeight, modalProps.className),
    contentClassName: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_PickerModal_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].content, modalProps.contentClassName),
    headerClassName: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_PickerModal_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].header, modalProps.headerClassName)
  }), modalProps.children, hasButton && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: _PickerModal_module_scss__WEBPACK_IMPORTED_MODULE_5__["default"].buttonWrapper
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_Button__WEBPACK_IMPORTED_MODULE_3__["default"], {
    withPremiumGradient: withPremiumGradient,
    onClick: onConfirm || modalProps.onClose,
    color: "primary",
    size: "smaller",
    disabled: isConfirmDisabled
  }, confirmButtonText || lang('Confirm'))));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(PickerModal));

/***/ },

/***/ "./src/components/modals/common/ParticlesHeader.module.scss"
/*!******************************************************************!*\
  !*** ./src/components/modals/common/ParticlesHeader.module.scss ***!
  \******************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"root":"gibpMWRW","particles":"ptK2PtrY","title":"uHi7dzFK","description":"y4GHVbyq","stickerWrapper":"Kjblw3yb"});

/***/ },

/***/ "./src/components/modals/common/ParticlesHeader.tsx"
/*!**********************************************************!*\
  !*** ./src/components/modals/common/ParticlesHeader.tsx ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _util_buildClassName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../util/buildClassName */ "./src/util/buildClassName.ts");
/* harmony import */ var _common_helpers_mediaDimensions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../common/helpers/mediaDimensions */ "./src/components/common/helpers/mediaDimensions.ts");
/* harmony import */ var _hooks_useLastCallback_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../hooks/useLastCallback.ts */ "./src/hooks/useLastCallback.ts");
/* harmony import */ var _common_InteractiveSparkles__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../common/InteractiveSparkles */ "./src/components/common/InteractiveSparkles.tsx");
/* harmony import */ var _common_StickerView__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../common/StickerView */ "./src/components/common/StickerView.tsx");
/* harmony import */ var _SpeedingDiamond_tsx__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./SpeedingDiamond.tsx */ "./src/components/modals/common/SpeedingDiamond.tsx");
/* harmony import */ var _SwayingStar_tsx__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./SwayingStar.tsx */ "./src/components/modals/common/SwayingStar.tsx");
/* harmony import */ var _ParticlesHeader_module_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./ParticlesHeader.module.scss */ "./src/components/modals/common/ParticlesHeader.module.scss");










const GIFT_STICKER_SIZE = 8 * _common_helpers_mediaDimensions__WEBPACK_IMPORTED_MODULE_2__.REM;
const PARTICLE_PARAMS = {
  centerShift: [0, -36]
};
function ParticlesHeader({
  model,
  sticker,
  color,
  title,
  description,
  isDisabled,
  className
}) {
  const stickerRef = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useRef)();
  const triggerSparklesRef = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useRef)();
  const handleMouseMove = (0,_hooks_useLastCallback_ts__WEBPACK_IMPORTED_MODULE_3__["default"])(() => {
    triggerSparklesRef.current?.();
  });
  const handleRequestAnimation = (0,_hooks_useLastCallback_ts__WEBPACK_IMPORTED_MODULE_3__["default"])(animate => {
    triggerSparklesRef.current = animate;
  });
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_ParticlesHeader_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].root, className)
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_common_InteractiveSparkles__WEBPACK_IMPORTED_MODULE_4__["default"], {
    color: color,
    centerShift: PARTICLE_PARAMS.centerShift,
    isDisabled: isDisabled,
    className: _ParticlesHeader_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].particles,
    onRequestAnimation: handleRequestAnimation
  }), model === 'swaying-star' ? /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_SwayingStar_tsx__WEBPACK_IMPORTED_MODULE_7__["default"], {
    color: color,
    centerShift: PARTICLE_PARAMS.centerShift,
    onMouseMove: handleMouseMove
  }) : model === 'speeding-diamond' ? /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_SpeedingDiamond_tsx__WEBPACK_IMPORTED_MODULE_6__["default"], {
    onMouseMove: handleMouseMove
  }) : model === 'sticker' && sticker && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    ref: stickerRef,
    className: _ParticlesHeader_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].stickerWrapper,
    style: `width: ${GIFT_STICKER_SIZE}px; height: ${GIFT_STICKER_SIZE}px`,
    onMouseMove: handleMouseMove
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_common_StickerView__WEBPACK_IMPORTED_MODULE_5__["default"], {
    containerRef: stickerRef,
    sticker: sticker,
    size: GIFT_STICKER_SIZE,
    shouldPreloadPreview: true,
    shouldLoop: true
  })), /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("h2", {
    className: _ParticlesHeader_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].title
  }, title), /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: _ParticlesHeader_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].description
  }, description));
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(ParticlesHeader));

/***/ },

/***/ "./src/components/modals/common/SpeedingDiamond.module.scss"
/*!******************************************************************!*\
  !*** ./src/components/modals/common/SpeedingDiamond.module.scss ***!
  \******************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"root":"lIc96mwM","diamond":"vIrSZr0L"});

/***/ },

/***/ "./src/components/modals/common/SpeedingDiamond.tsx"
/*!**********************************************************!*\
  !*** ./src/components/modals/common/SpeedingDiamond.tsx ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _lib_fasterdom_fasterdom_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../lib/fasterdom/fasterdom.ts */ "./src/lib/fasterdom/fasterdom.ts");
/* harmony import */ var _util_animation_ts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../util/animation.ts */ "./src/util/animation.ts");
/* harmony import */ var _common_helpers_animatedAssets_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../common/helpers/animatedAssets.ts */ "./src/components/common/helpers/animatedAssets.ts");
/* harmony import */ var _hooks_useLastCallback_ts__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../hooks/useLastCallback.ts */ "./src/hooks/useLastCallback.ts");
/* harmony import */ var _common_AnimatedIconWithPreview_tsx__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../common/AnimatedIconWithPreview.tsx */ "./src/components/common/AnimatedIconWithPreview.tsx");
/* harmony import */ var _SpeedingDiamond_module_scss__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./SpeedingDiamond.module.scss */ "./src/components/modals/common/SpeedingDiamond.module.scss");
/* harmony import */ var _assets_diamond_png__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../assets/diamond.png */ "./src/assets/diamond.png");









const MAX_SPEED = 5;
const MIN_SPEED = 1;
const SLOWDOWN_DELAY = 300;
const SLOWDOWN_DURATION = 1500;
let slowdownTimeout;
let isAnimating = true;
function SpeedingDiamond({
  onMouseMove
}) {
  const [speed, setSpeed] = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useState)(MIN_SPEED);
  const handleMouseMove = (0,_hooks_useLastCallback_ts__WEBPACK_IMPORTED_MODULE_4__["default"])(() => {
    if (slowdownTimeout) {
      clearTimeout(slowdownTimeout);
      slowdownTimeout = undefined;
    }
    slowdownTimeout = window.setTimeout(() => {
      const startAt = Date.now();
      isAnimating = true;
      (0,_util_animation_ts__WEBPACK_IMPORTED_MODULE_2__.animateSingle)(() => {
        if (!isAnimating) return false;
        const t = Math.min((Date.now() - startAt) / SLOWDOWN_DURATION, 1);
        const speed = (MAX_SPEED - MIN_SPEED) * (1 - transition(t));
        setSpeed(speed);
        isAnimating = t < 1 && speed > 1;
        return isAnimating;
      }, _lib_fasterdom_fasterdom_ts__WEBPACK_IMPORTED_MODULE_1__.requestMutation);
    }, SLOWDOWN_DELAY);
    isAnimating = false;
    setSpeed(MAX_SPEED);
    onMouseMove();
  });
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: _SpeedingDiamond_module_scss__WEBPACK_IMPORTED_MODULE_6__["default"].root
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: _SpeedingDiamond_module_scss__WEBPACK_IMPORTED_MODULE_6__["default"].diamond,
    onMouseMove: handleMouseMove
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_common_AnimatedIconWithPreview_tsx__WEBPACK_IMPORTED_MODULE_5__["default"], {
    speed: speed,
    size: 130,
    tgsUrl: _common_helpers_animatedAssets_ts__WEBPACK_IMPORTED_MODULE_3__.LOCAL_TGS_URLS.Diamond,
    previewUrl: _assets_diamond_png__WEBPACK_IMPORTED_MODULE_7__,
    nonInteractive: true,
    noLoop: false
  })));
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(SpeedingDiamond));
function transition(t) {
  return 1 - (1 - t) ** 2;
}

/***/ },

/***/ "./src/components/modals/common/SwayingStar.module.scss"
/*!**************************************************************!*\
  !*** ./src/components/modals/common/SwayingStar.module.scss ***!
  \**************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"root":"KQ61en7j","star":"no11eFNA","star_purple":"NXn1Bbql","starPurple":"NXn1Bbql"});

/***/ },

/***/ "./src/components/modals/common/SwayingStar.tsx"
/*!******************************************************!*\
  !*** ./src/components/modals/common/SwayingStar.tsx ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _lib_fasterdom_fasterdom_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../lib/fasterdom/fasterdom.ts */ "./src/lib/fasterdom/fasterdom.ts");
/* harmony import */ var _util_buildClassName_ts__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../util/buildClassName.ts */ "./src/util/buildClassName.ts");
/* harmony import */ var _hooks_useLastCallback_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../hooks/useLastCallback.ts */ "./src/hooks/useLastCallback.ts");
/* harmony import */ var _SwayingStar_module_scss__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./SwayingStar.module.scss */ "./src/components/modals/common/SwayingStar.module.scss");






const INTERACTIVE_RADIUS = 50;
function SwayingStar({
  color,
  centerShift,
  onMouseMove
}) {
  const starRef = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useRef)();
  const handleMouseMove = (0,_hooks_useLastCallback_ts__WEBPACK_IMPORTED_MODULE_3__["default"])(e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 + centerShift[0];
    const centerY = rect.top + rect.height / 2 + centerShift[1];
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    const normalizedX = Math.max(-1, Math.min(1, mouseX / INTERACTIVE_RADIUS));
    const normalizedY = Math.max(-1, Math.min(1, mouseY / INTERACTIVE_RADIUS));
    const rotateY = normalizedX * 40;
    const rotateX = -normalizedY * 40;
    (0,_lib_fasterdom_fasterdom_ts__WEBPACK_IMPORTED_MODULE_1__.requestMutation)(() => {
      starRef.current.style.transform = `scale(1.1) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    onMouseMove();
  });
  const handleMouseLeave = (0,_hooks_useLastCallback_ts__WEBPACK_IMPORTED_MODULE_3__["default"])(() => {
    (0,_lib_fasterdom_fasterdom_ts__WEBPACK_IMPORTED_MODULE_1__.requestMutation)(() => {
      starRef.current.style.transform = '';
    });
  });
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: _SwayingStar_module_scss__WEBPACK_IMPORTED_MODULE_4__["default"].root,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    ref: starRef,
    className: (0,_util_buildClassName_ts__WEBPACK_IMPORTED_MODULE_2__["default"])(_SwayingStar_module_scss__WEBPACK_IMPORTED_MODULE_4__["default"].star, _SwayingStar_module_scss__WEBPACK_IMPORTED_MODULE_4__["default"][`star_${color}`]),
    role: "img",
    "aria-label": "Telegram Stars"
  }));
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(SwayingStar));

/***/ },

/***/ "./src/components/modals/common/TableAboutModal.module.scss"
/*!******************************************************************!*\
  !*** ./src/components/modals/common/TableAboutModal.module.scss ***!
  \******************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"root":"LAh8evux","title":"yfODVQ1M","description":"QaQn08BX","secondary":"sQZslvAr","topIcon":"jySLtQNG","listItemIcon":"hQbEPsTU","content":"hrizpMDe","separator":"En1zD2cT"});

/***/ },

/***/ "./src/components/modals/common/TableAboutModal.tsx"
/*!**********************************************************!*\
  !*** ./src/components/modals/common/TableAboutModal.tsx ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../lib/teact/teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _util_buildClassName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../util/buildClassName */ "./src/util/buildClassName.ts");
/* harmony import */ var _common_icons_Icon__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../common/icons/Icon */ "./src/components/common/icons/Icon.tsx");
/* harmony import */ var _ui_Button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../ui/Button */ "./src/components/ui/Button.tsx");
/* harmony import */ var _ui_ListItem__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../ui/ListItem */ "./src/components/ui/ListItem.tsx");
/* harmony import */ var _ui_Modal__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../ui/Modal */ "./src/components/ui/Modal.tsx");
/* harmony import */ var _ui_Separator__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../ui/Separator */ "./src/components/ui/Separator.tsx");
/* harmony import */ var _TableAboutModal_module_scss__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./TableAboutModal.module.scss */ "./src/components/modals/common/TableAboutModal.module.scss");









const TableAboutModal = ({
  isOpen,
  listItemData,
  headerIconName,
  header,
  footer,
  buttonText,
  hasBackdrop,
  withSeparator,
  onClose,
  onButtonClick,
  contentClassName
}) => {
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_Modal__WEBPACK_IMPORTED_MODULE_5__["default"], {
    isOpen: isOpen,
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_TableAboutModal_module_scss__WEBPACK_IMPORTED_MODULE_7__["default"].root, contentClassName),
    contentClassName: _TableAboutModal_module_scss__WEBPACK_IMPORTED_MODULE_7__["default"].content,
    hasAbsoluteCloseButton: true,
    absoluteCloseButtonColor: hasBackdrop ? 'translucent-white' : undefined,
    onClose: onClose
  }, headerIconName && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: _TableAboutModal_module_scss__WEBPACK_IMPORTED_MODULE_7__["default"].topIcon
  }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_common_icons_Icon__WEBPACK_IMPORTED_MODULE_2__["default"], {
    name: headerIconName
  })), header, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", null, listItemData?.map(([icon, title, subtitle]) => {
    return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_ListItem__WEBPACK_IMPORTED_MODULE_4__["default"], {
      isStatic: true,
      multiline: true,
      icon: icon,
      iconClassName: _TableAboutModal_module_scss__WEBPACK_IMPORTED_MODULE_7__["default"].listItemIcon
    }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("span", {
      className: "title"
    }, title), /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("span", {
      className: "subtitle"
    }, subtitle));
  })), withSeparator && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_Separator__WEBPACK_IMPORTED_MODULE_6__["default"], {
    className: _TableAboutModal_module_scss__WEBPACK_IMPORTED_MODULE_7__["default"].separator
  }), footer, buttonText && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_Button__WEBPACK_IMPORTED_MODULE_3__["default"], {
    size: "smaller",
    onClick: onButtonClick || onClose
  }, buttonText));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(TableAboutModal));

/***/ },

/***/ "./src/components/modals/common/TableInfoModal.module.scss"
/*!*****************************************************************!*\
  !*** ./src/components/modals/common/TableInfoModal.module.scss ***!
  \*****************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"content":"KYHkJ9Qf","title":"AwnUe4Qk","value":"JGH6P9Az","table":"DFRB0Ad4","noFooter":"cSamlkt9","cell":"Cnh5ENvm","fullWidth":"UssCZwgy","avatar":"SHQbPR5Y","chatItem":"aS9U4hiQ"});

/***/ },

/***/ "./src/components/modals/common/TableInfoModal.tsx"
/*!*********************************************************!*\
  !*** ./src/components/modals/common/TableInfoModal.tsx ***!
  \*********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../lib/teact/teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _global__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../global */ "./src/global/index.ts");
/* harmony import */ var _util_buildClassName__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../util/buildClassName */ "./src/util/buildClassName.ts");
/* harmony import */ var _hooks_useLastCallback__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../hooks/useLastCallback */ "./src/hooks/useLastCallback.ts");
/* harmony import */ var _common_Avatar__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../common/Avatar */ "./src/components/common/Avatar.tsx");
/* harmony import */ var _common_PeerChip__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../common/PeerChip */ "./src/components/common/PeerChip.tsx");
/* harmony import */ var _ui_Button__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../ui/Button */ "./src/components/ui/Button.tsx");
/* harmony import */ var _ui_Modal__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../ui/Modal */ "./src/components/ui/Modal.tsx");
/* harmony import */ var _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./TableInfoModal.module.scss */ "./src/components/modals/common/TableInfoModal.module.scss");










const TableInfoModal = ({
  isOpen,
  title,
  tableData,
  headerAvatarPeer,
  header,
  modalHeader,
  footer,
  buttonText,
  className,
  hasBackdrop,
  onClose,
  onButtonClick,
  withBalanceBar,
  isLowStackPriority,
  currencyInBalanceBar
}) => {
  const {
    openChat
  } = (0,_global__WEBPACK_IMPORTED_MODULE_1__.getActions)();
  const handleOpenChat = (0,_hooks_useLastCallback__WEBPACK_IMPORTED_MODULE_3__["default"])(peerId => {
    openChat({
      id: peerId
    });
    onClose();
  });
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_Modal__WEBPACK_IMPORTED_MODULE_7__["default"], {
    isOpen: isOpen,
    hasCloseButton: Boolean(title),
    hasAbsoluteCloseButton: !title,
    absoluteCloseButtonColor: hasBackdrop ? 'translucent-white' : undefined,
    isSlim: true,
    header: modalHeader,
    title: title,
    className: className,
    contentClassName: _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].content,
    onClose: onClose,
    withBalanceBar: withBalanceBar,
    currencyInBalanceBar: currencyInBalanceBar,
    isLowStackPriority: isLowStackPriority
  }, headerAvatarPeer && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_common_Avatar__WEBPACK_IMPORTED_MODULE_4__["default"], {
    peer: headerAvatarPeer,
    size: "jumbo",
    className: _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].avatar
  }), header, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].table
  }, tableData?.map(([label, value]) => /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_teact__WEBPACK_IMPORTED_MODULE_0__["default"].Fragment, null, Boolean(label) && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_2__["default"])(_TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].cell, _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].title)
  }, label), /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_2__["default"])(_TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].cell, _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].value, !label && _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].fullWidth)
  }, typeof value === 'object' && 'chatId' in value ? /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_common_PeerChip__WEBPACK_IMPORTED_MODULE_5__["default"], {
    peerId: value.chatId,
    className: _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].chatItem,
    forceShowSelf: true,
    withEmojiStatus: value.withEmojiStatus,
    clickArg: value.chatId,
    onClick: handleOpenChat
  }) : value)))), footer, buttonText && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_Button__WEBPACK_IMPORTED_MODULE_6__["default"], {
    className: !footer ? _TableInfoModal_module_scss__WEBPACK_IMPORTED_MODULE_8__["default"].noFooter : undefined,
    size: "smaller",
    onClick: onButtonClick || onClose
  }, buttonText));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(TableInfoModal));

/***/ },

/***/ "./src/components/modals/stars/StarTopupOptionList.module.scss"
/*!*********************************************************************!*\
  !*** ./src/components/modals/stars/StarTopupOptionList.module.scss ***!
  \*********************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// extracted by mini-css-extract-plugin
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({"options":"OnCj9kef","option":"tpTHQAUF","active":"U_9MXPG5","wideOption":"dJcJl33b","optionTop":"x9G4lqMf","stackedStars":"etXLebjM","stackedStar":"swttXv9P","optionBottom":"tK7La7L2","moreOptions":"AWXBaWLW","iconDown":"zWYHZJmd"});

/***/ },

/***/ "./src/components/modals/stars/StarTopupOptionList.tsx"
/*!*************************************************************!*\
  !*** ./src/components/modals/stars/StarTopupOptionList.tsx ***!
  \*************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../lib/teact/teact */ "./src/lib/teact/teact.ts");
/* harmony import */ var _util_buildClassName__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../util/buildClassName */ "./src/util/buildClassName.ts");
/* harmony import */ var _util_formatCurrency__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../util/formatCurrency */ "./src/util/formatCurrency.tsx");
/* harmony import */ var _util_textFormat__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../util/textFormat */ "./src/util/textFormat.ts");
/* harmony import */ var _common_helpers_renderText__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../common/helpers/renderText */ "./src/components/common/helpers/renderText.tsx");
/* harmony import */ var _hooks_useFlag__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../hooks/useFlag */ "./src/hooks/useFlag.ts");
/* harmony import */ var _hooks_useLang__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../../hooks/useLang */ "./src/hooks/useLang.ts");
/* harmony import */ var _hooks_useOldLang__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../../hooks/useOldLang */ "./src/hooks/useOldLang.ts");
/* harmony import */ var _common_icons_Icon__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../../common/icons/Icon */ "./src/components/common/icons/Icon.tsx");
/* harmony import */ var _common_icons_StarIcon__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../../common/icons/StarIcon */ "./src/components/common/icons/StarIcon.tsx");
/* harmony import */ var _ui_Button__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../../ui/Button */ "./src/components/ui/Button.tsx");
/* harmony import */ var _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./StarTopupOptionList.module.scss */ "./src/components/modals/stars/StarTopupOptionList.module.scss");













const MAX_STARS_COUNT = 6;
const StarTopupOptionList = ({
  isActive,
  className,
  options,
  selectedStarOption,
  selectedStarCount,
  starsNeeded,
  onClick
}) => {
  const oldLang = (0,_hooks_useOldLang__WEBPACK_IMPORTED_MODULE_7__["default"])();
  const lang = (0,_hooks_useLang__WEBPACK_IMPORTED_MODULE_6__["default"])();
  const [areOptionsExtended, markOptionsExtended, unmarkOptionsExtended] = (0,_hooks_useFlag__WEBPACK_IMPORTED_MODULE_5__["default"])();
  (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    if (!isActive) {
      unmarkOptionsExtended();
    }
  }, [isActive]);
  const [renderingOptions, canExtend] = (0,_teact__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    if (!options) return [undefined, false];
    const maxOption = options.reduce((max, option) => max.stars > option.stars ? max : option);
    const forceShowAll = starsNeeded && maxOption.stars < starsNeeded;
    const result = [];
    let currentStackedStarsCount = 0;
    let canExtendOptions = false;
    options.forEach((option, index) => {
      if (!option.isExtended) currentStackedStarsCount++;
      if (starsNeeded && !forceShowAll && option.stars < starsNeeded) return;
      if (!areOptionsExtended && option.isExtended) {
        canExtendOptions = true;
        return;
      }
      result.push({
        option,
        starsCount: Math.min(currentStackedStarsCount, MAX_STARS_COUNT),
        isWide: index === options.length - 1
      });
    });
    return [result, canExtendOptions];
  }, [areOptionsExtended, options, starsNeeded]);
  return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
    className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].options, className)
  }, renderingOptions?.map(({
    option,
    starsCount,
    isWide
  }) => {
    const length = renderingOptions?.length;
    const isOdd = length % 2 === 0;
    const isActiveOption = option === selectedStarOption;
    let perUserStarCount;
    if (option && 'winners' in option) {
      const winner = option.winners.find(opt => opt.users === selectedStarCount) || option.winners.reduce((max, opt) => opt.users > max.users ? opt : max, option.winners[0]);
      perUserStarCount = winner?.perUserStars;
    }
    return /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
      className: (0,_util_buildClassName__WEBPACK_IMPORTED_MODULE_1__["default"])(_StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].option, !isOdd && isWide && _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].wideOption, isActiveOption && _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].active),
      key: option.stars,
      onClick: () => onClick?.(option)
    }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
      className: _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].optionTop
    }, "+", (0,_util_textFormat__WEBPACK_IMPORTED_MODULE_3__.formatInteger)(option.stars), /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
      className: _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].stackedStars,
      dir: lang.isRtl ? 'ltr' : 'rtl'
    }, Array.from({
      length: starsCount
    }).map(() => /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_common_icons_StarIcon__WEBPACK_IMPORTED_MODULE_9__["default"], {
      className: _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].stackedStar,
      type: "gold",
      size: "big"
    })))), /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
      className: _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].optionBottom
    }, (0,_util_formatCurrency__WEBPACK_IMPORTED_MODULE_2__.formatCurrency)(lang, option.amount, option.currency)), (isActiveOption || selectedStarOption && 'winners' in selectedStarOption) && Boolean(perUserStarCount) && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
      className: _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].optionBottom
    }, /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement("div", {
      className: _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].perUserStars
    }, (0,_common_helpers_renderText__WEBPACK_IMPORTED_MODULE_4__["default"])(oldLang('BoostGift.Stars.PerUser', (0,_util_textFormat__WEBPACK_IMPORTED_MODULE_3__.formatInteger)(perUserStarCount))))));
  }), !areOptionsExtended && canExtend && /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_ui_Button__WEBPACK_IMPORTED_MODULE_10__["default"], {
    className: _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].moreOptions,
    isText: true,
    noForcedUpperCase: true,
    onClick: markOptionsExtended
  }, oldLang('Stars.Purchase.ShowMore'), /*#__PURE__*/_teact__WEBPACK_IMPORTED_MODULE_0__["default"].createElement(_common_icons_Icon__WEBPACK_IMPORTED_MODULE_8__["default"], {
    className: _StarTopupOptionList_module_scss__WEBPACK_IMPORTED_MODULE_11__["default"].iconDown,
    name: "down"
  })));
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_teact__WEBPACK_IMPORTED_MODULE_0__.memo)(StarTopupOptionList));

/***/ },

/***/ "./src/hooks/animations/useTransitionActiveKey.ts"
/*!********************************************************!*\
  !*** ./src/hooks/animations/useTransitionActiveKey.ts ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   useTransitionActiveKey: () => (/* binding */ useTransitionActiveKey)
/* harmony export */ });
/* harmony import */ var _lib_teact_teact__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../lib/teact/teact */ "./src/lib/teact/teact.ts");


/**
 * Use this hook to bind `<Transition />` animation to changes in the dependency array.
 * Use optional parameter `noAnimation` if you want to prevent the animation even if the dependency array changes.
*/
function useTransitionActiveKey(deps, noAnimation) {
  const activeKey = (0,_lib_teact_teact__WEBPACK_IMPORTED_MODULE_0__.useRef)(0);
  (0,_lib_teact_teact__WEBPACK_IMPORTED_MODULE_0__.useMemo)(() => {
    if (!noAnimation) activeKey.current += 1;
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [...deps]);
  return activeKey.current;
}

/***/ },

/***/ "./src/util/particles.ts"
/*!*******************************!*\
  !*** ./src/util/particles.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PARTICLE_BURST_PARAMS: () => (/* binding */ PARTICLE_BURST_PARAMS),
/* harmony export */   PARTICLE_COLORS: () => (/* binding */ PARTICLE_COLORS),
/* harmony export */   setupParticles: () => (/* binding */ setupParticles)
/* harmony export */ });
/* harmony import */ var _generateUniqueId_ts__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./generateUniqueId.ts */ "./src/util/generateUniqueId.ts");
/* harmony import */ var _hooks_window_useBackgroundMode_ts__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../hooks/window/useBackgroundMode.ts */ "./src/hooks/window/useBackgroundMode.ts");
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
// GPU-Accelerated Particle System Library



const PARTICLE_COLORS = {
  blue: [0, 152 / 255, 234 / 255],
  blueGradient: [[1 / 255, 88 / 255, 175 / 255], [103 / 255, 208 / 255, 255 / 255]],
  purple: [150 / 255, 111 / 255, 254 / 255],
  purpleGradient: [[107 / 255, 147 / 255, 255 / 255], [228 / 255, 106 / 255, 206 / 255]],
  gold: [255 / 255, 191 / 255, 10 / 255],
  goldGradient: [[253 / 255, 235 / 255, 50 / 255], [215 / 255, 89 / 255, 2 / 255]]
};
const PARTICLE_BURST_PARAMS = {
  particleCount: 5,
  distanceLimit: 1,
  fadeInTime: 0.05,
  minLifetime: 3,
  maxLifetime: 3,
  maxStartTimeDelay: 0,
  selfDestroyTime: 3,
  minSpawnRadius: 5,
  maxSpawnRadius: 50
};
const DEFAULT_CONFIG = {
  width: 350,
  height: 230,
  particleCount: 100,
  color: [0, 152 / 255, 234 / 255],
  // #0098EA (TON)
  speed: 18,
  baseSize: 6,
  minSpawnRadius: 35,
  maxSpawnRadius: 70,
  distanceLimit: 0.7,
  fadeInTime: 0.25,
  fadeOutTime: 1,
  minLifetime: 4,
  maxLifetime: 6,
  maxStartTimeDelay: 3,
  edgeFadeZone: 50,
  centerShift: [0, 0],
  accelerationFactor: 3,
  selfDestroyTime: 0
};
const SIZE_SMALL = 0.67;
const SIZE_MEDIUM = 1.33;
const SIZE_LARGE = 2.2;
const canvasManagers = new Map();
function setupParticles(canvas, options) {
  let manager = canvasManagers.get(canvas);
  if (!manager) {
    manager = createParticleSystemManager(canvas);
    canvasManagers.set(canvas, manager);
  }
  return manager.addSystem(options);
}
function createParticleSystemManager(canvas) {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: false
  });
  if (!gl) {
    throw new Error('WebGL not supported');
  }
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  if (!vertexShader || !fragmentShader) {
    throw new Error('Failed to create shaders');
  }
  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) {
    throw new Error('Failed to create shader program');
  }
  const dpr = window.devicePixelRatio || 1;
  const systems = new Map();
  const locations = {
    attributes: {
      startPosition: gl.getAttribLocation(program, 'a_startPosition'),
      velocity: gl.getAttribLocation(program, 'a_velocity'),
      startTime: gl.getAttribLocation(program, 'a_startTime'),
      lifetime: gl.getAttribLocation(program, 'a_lifetime'),
      size: gl.getAttribLocation(program, 'a_size'),
      baseOpacity: gl.getAttribLocation(program, 'a_baseOpacity'),
      color: gl.getAttribLocation(program, 'a_color')
    },
    uniforms: {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      canvasWidth: gl.getUniformLocation(program, 'u_canvasWidth'),
      canvasHeight: gl.getUniformLocation(program, 'u_canvasHeight'),
      accelerationFactor: gl.getUniformLocation(program, 'u_accelerationFactor'),
      fadeInTime: gl.getUniformLocation(program, 'u_fadeInTime'),
      fadeOutTime: gl.getUniformLocation(program, 'u_fadeOutTime'),
      edgeFadeZone: gl.getUniformLocation(program, 'u_edgeFadeZone'),
      rotationMatrices: gl.getUniformLocation(program, 'u_rotationMatrices'),
      spawnCenter: gl.getUniformLocation(program, 'u_spawnCenter')
    }
  };
  let animationId;
  let unsubscribeFromIsInBackground = undefined;
  function initParticleData(system) {
    const rng = new SeededRandom(system.seed);
    const {
      config
    } = system;
    const startPositions = new Float32Array(config.particleCount * 2);
    const velocities = new Float32Array(config.particleCount * 2);
    const startTimes = new Float32Array(config.particleCount);
    const lifetimes = new Float32Array(config.particleCount);
    const sizes = new Float32Array(config.particleCount);
    const baseOpacities = new Float32Array(config.particleCount);
    const colors = new Float32Array(config.particleCount * 3); // RGB for each particle

    for (let i = 0; i < config.particleCount; i++) {
      const angle = rng.next() * Math.PI * 2;
      const spawnRadius = rng.nextBetween(config.minSpawnRadius, config.maxSpawnRadius);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const spawnX = system.centerX + cos * spawnRadius;
      const spawnY = system.centerY + sin * spawnRadius;
      startPositions[i * 2] = spawnX * dpr;
      startPositions[i * 2 + 1] = spawnY * dpr;
      lifetimes[i] = rng.nextBetween(config.minLifetime, config.maxLifetime);
      startTimes[i] = rng.next() * config.maxStartTimeDelay;
      const travelDist = rng.nextBetween(system.avgDistance * config.distanceLimit * 0.5, system.avgDistance * config.distanceLimit);

      // Calculate speed based on travel distance and lifetime
      const speed = travelDist / lifetimes[i] * dpr;
      velocities[i * 2] = cos * speed;
      velocities[i * 2 + 1] = sin * speed;
      const sizeVariant = rng.next();
      if (sizeVariant < 0.3) {
        sizes[i] = config.baseSize * SIZE_SMALL * dpr;
      } else if (sizeVariant < 0.7) {
        sizes[i] = config.baseSize * SIZE_MEDIUM * dpr;
      } else {
        sizes[i] = config.baseSize * SIZE_LARGE * dpr;
      }
      baseOpacities[i] = rng.nextBetween(0.3, 0.8);
      const particleColor = resolveColor(config.color, rng);
      colors[i * 3] = particleColor[0];
      colors[i * 3 + 1] = particleColor[1];
      colors[i * 3 + 2] = particleColor[2];
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.startPosition);
    gl.bufferData(gl.ARRAY_BUFFER, startPositions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.velocity);
    gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.startTime);
    gl.bufferData(gl.ARRAY_BUFFER, startTimes, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.lifetime);
    gl.bufferData(gl.ARRAY_BUFFER, lifetimes, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.size);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.baseOpacity);
    gl.bufferData(gl.ARRAY_BUFFER, baseOpacities, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
  }
  function initCanvas() {
    // Find the max canvas size from all systems
    let maxWidth = 0;
    let maxHeight = 0;
    systems.forEach(system => {
      maxWidth = Math.max(maxWidth, system.config.width);
      maxHeight = Math.max(maxHeight, system.config.height);
    });

    // Default to first system's size if no systems yet
    if (systems.size === 0) {
      maxWidth = DEFAULT_CONFIG.width;
      maxHeight = DEFAULT_CONFIG.height;
    }
    if (canvas.width !== maxWidth * dpr || canvas.height !== maxHeight * dpr) {
      canvas.width = maxWidth * dpr;
      canvas.height = maxHeight * dpr;
      canvas.style.width = maxWidth + 'px';
      canvas.style.height = maxHeight + 'px';
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  function initWebGLState() {
    gl.useProgram(program);

    // Set static uniforms that will be updated per system
    gl.uniform2f(locations.uniforms.resolution, canvas.width, canvas.height);
    gl.uniformMatrix2fv(locations.uniforms.rotationMatrices, false, getRotations());

    // Set blending state
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Set clear color
    gl.clearColor(0, 0, 0, 0);
  }
  function render(currentTime) {
    if (!animationId) return;
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Render all systems
    systems.forEach(system => {
      const systemTime = (currentTime - system.startTime) / 1000;

      // Set uniforms for this system
      gl.uniform1f(locations.uniforms.time, systemTime);
      gl.uniform1f(locations.uniforms.canvasWidth, system.config.width * dpr);
      gl.uniform1f(locations.uniforms.canvasHeight, system.config.height * dpr);
      gl.uniform1f(locations.uniforms.accelerationFactor, system.config.accelerationFactor);
      gl.uniform1f(locations.uniforms.fadeInTime, system.config.fadeInTime);
      gl.uniform1f(locations.uniforms.fadeOutTime, system.config.fadeOutTime);
      gl.uniform1f(locations.uniforms.edgeFadeZone, system.config.edgeFadeZone * dpr);
      gl.uniform2f(locations.uniforms.spawnCenter, system.centerX * dpr, system.centerY * dpr);

      // Bind attributes for this system
      gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.startPosition);
      gl.enableVertexAttribArray(locations.attributes.startPosition);
      gl.vertexAttribPointer(locations.attributes.startPosition, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.velocity);
      gl.enableVertexAttribArray(locations.attributes.velocity);
      gl.vertexAttribPointer(locations.attributes.velocity, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.startTime);
      gl.enableVertexAttribArray(locations.attributes.startTime);
      gl.vertexAttribPointer(locations.attributes.startTime, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.lifetime);
      gl.enableVertexAttribArray(locations.attributes.lifetime);
      gl.vertexAttribPointer(locations.attributes.lifetime, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.size);
      gl.enableVertexAttribArray(locations.attributes.size);
      gl.vertexAttribPointer(locations.attributes.size, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.baseOpacity);
      gl.enableVertexAttribArray(locations.attributes.baseOpacity);
      gl.vertexAttribPointer(locations.attributes.baseOpacity, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, system.buffers.color);
      gl.enableVertexAttribArray(locations.attributes.color);
      gl.vertexAttribPointer(locations.attributes.color, 3, gl.FLOAT, false, 0, 0);

      // Draw particles for this system
      gl.drawArrays(gl.POINTS, 0, system.config.particleCount);
    });
    animationId = requestAnimationFrame(render);
  }
  function addSystem(options) {
    const id = (0,_generateUniqueId_ts__WEBPACK_IMPORTED_MODULE_0__["default"])();
    const config = {
      ...DEFAULT_CONFIG,
      ...options
    };
    const buffers = {
      startPosition: gl.createBuffer(),
      velocity: gl.createBuffer(),
      startTime: gl.createBuffer(),
      lifetime: gl.createBuffer(),
      size: gl.createBuffer(),
      baseOpacity: gl.createBuffer(),
      color: gl.createBuffer()
    };
    const system = {
      id,
      config,
      buffers,
      startTime: performance.now(),
      seed: Math.floor(Math.random() * 1000000),
      centerX: config.width / 2 + config.centerShift[0],
      centerY: config.height / 2 + config.centerShift[1],
      avgDistance: (config.width / 2 + config.height / 2) / 2
    };
    systems.set(id, system);
    initParticleData(system);
    initCanvas();
    if (config.selfDestroyTime) {
      system.selfDestroyTimeout = window.setTimeout(() => {
        removeSystem(id);
      }, config.selfDestroyTime * 1000);
    }
    if (systems.size === 1) {
      initWebGLState();
      unsubscribeFromIsInBackground = _hooks_window_useBackgroundMode_ts__WEBPACK_IMPORTED_MODULE_1__.getIsInBackground.subscribe(() => {
        const isActive = !(0,_hooks_window_useBackgroundMode_ts__WEBPACK_IMPORTED_MODULE_1__.getIsInBackground)();
        if (isActive && !animationId) {
          animationId = requestAnimationFrame(render);
        } else if (!isActive && animationId) {
          cancelAnimationFrame(animationId);
          animationId = undefined;
        }
      });
      animationId = requestAnimationFrame(render);
    }
    return () => removeSystem(id);
  }
  function removeSystem(id) {
    const system = systems.get(id);
    if (!system) return;
    if (system.selfDestroyTimeout) {
      clearTimeout(system.selfDestroyTimeout);
    }
    Object.values(system.buffers).forEach(buffer => {
      if (buffer) gl.deleteBuffer(buffer);
    });
    systems.delete(id);
    if (systems.size === 0) {
      destroy();
    }
  }
  function destroy() {
    if (animationId !== undefined) {
      cancelAnimationFrame(animationId);
      animationId = undefined;
    }
    unsubscribeFromIsInBackground?.();
    systems.clear();
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    canvasManagers.delete(canvas);
  }
  return {
    addSystem
  };
}
const VERTEX_SHADER_SOURCE = `
    attribute vec2 a_startPosition;
    attribute vec2 a_velocity;
    attribute float a_startTime;
    attribute float a_lifetime;
    attribute float a_size;
    attribute float a_baseOpacity;
    attribute vec3 a_color;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_canvasWidth;
    uniform float u_canvasHeight;
    uniform float u_accelerationFactor;
    uniform float u_fadeInTime;
    uniform float u_fadeOutTime;
    uniform float u_edgeFadeZone;
    uniform mat2 u_rotationMatrices[18];
    uniform vec2 u_spawnCenter;

    varying float v_opacity;
    varying vec3 v_color;

    void main() {
        float totalAge = u_time - a_startTime;
        float age = mod(totalAge, a_lifetime);

        // For the initial animation, fade in all particles
        float globalFadeIn = min(u_time / u_fadeInTime, 1.0);

        float lifeRatio = age / a_lifetime;

        // Calculate rotation based on completed lifecycles
        float lifecycleCount = floor(totalAge / a_lifetime);
        int rotationIndex = int(mod(lifecycleCount, 18.0));

        // Get rotation matrix
        mat2 rotationMatrix = u_rotationMatrices[rotationIndex];

        // Rotate start position around spawn center
        vec2 startOffset = a_startPosition - u_spawnCenter;
        vec2 rotatedStartOffset = rotationMatrix * startOffset;
        vec2 rotatedStartPosition = u_spawnCenter + rotatedStartOffset;

        // Apply rotation matrix to velocity
        vec2 rotatedVelocity = rotationMatrix * a_velocity;

        // Apply shoot-out effect: fast initial speed that slows down
        float speedMultiplier = 1.0 + u_accelerationFactor * exp(-3.0 * lifeRatio);

        vec2 position = rotatedStartPosition + rotatedVelocity * age * speedMultiplier;

        float opacity = 1.0;
        if (lifeRatio < u_fadeInTime / a_lifetime) {
            opacity = (lifeRatio * a_lifetime) / u_fadeInTime;
        } else if (lifeRatio > 1.0 - u_fadeOutTime / a_lifetime) {
            opacity = (1.0 - lifeRatio) * a_lifetime / u_fadeOutTime;
        }
        opacity *= a_baseOpacity * globalFadeIn;

        float distToLeft = position.x;
        float distToRight = u_canvasWidth - position.x;
        float distToTop = position.y;
        float distToBottom = u_canvasHeight - position.y;
        float distToEdge = min(min(distToLeft, distToRight), min(distToTop, distToBottom));

        if (distToEdge < u_edgeFadeZone) {
            opacity *= distToEdge / u_edgeFadeZone;
        }

        vec2 clipSpace = ((position / u_resolution) * 2.0 - 1.0) * vec2(1, -1);
        gl_Position = vec4(clipSpace, 0, 1);
        gl_PointSize = a_size;
        v_opacity = opacity;
        v_color = a_color;
    }
`;
const FRAGMENT_SHADER_SOURCE = `
    precision mediump float;

    varying float v_opacity;
    varying vec3 v_color;

    void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);

        // Create a four-pointed star
        float absX = abs(coord.x);
        float absY = abs(coord.y);

        // Star parameters
        float innerSize = 0.12;    // Size of center square
        float armLength = 0.45;    // Length of star arms
        float armWidth = 0.08;     // Half-width of star arms at base

        float dist = 1.0; // Default to outside

        // Center square
        if (absX <= innerSize && absY <= innerSize) {
            dist = max(absX, absY) - innerSize;
        }
        // Horizontal arms (left and right points)
        else if (absY <= armWidth && absX <= armLength) {
            // Taper the arms - they get narrower toward the tips
            float normalizedX = (absX - innerSize) / (armLength - innerSize);
            float taperFactor = 1.0 - normalizedX * 0.8; // Taper to 20% of original width
            float currentArmWidth = armWidth * taperFactor;
            dist = absY - currentArmWidth;
        }
        // Vertical arms (top and bottom points)
        else if (absX <= armWidth && absY <= armLength) {
            // Taper the arms - they get narrower toward the tips
            float normalizedY = (absY - innerSize) / (armLength - innerSize);
            float taperFactor = 1.0 - normalizedY * 0.8; // Taper to 20% of original width
            float currentArmWidth = armWidth * taperFactor;
            dist = absX - currentArmWidth;
        }

        // Use smoothstep for anti-aliasing to reduce subpixel artifacts
        float alpha = 1.0 - smoothstep(-0.01, 0.01, dist);

        if (alpha <= 0.0) {
            discard;
        }

        gl_FragColor = vec4(v_color * v_opacity * alpha, v_opacity * alpha);
    }
`;
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return undefined;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return undefined;
  }
  return shader;
}
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  if (!program) return undefined;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return undefined;
  }
  return program;
}
class SeededRandom {
  constructor(seed) {
    _defineProperty(this, "seed", void 0);
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  nextBetween(min, max) {
    return min + (max - min) * this.next();
  }
}
let rotationsCache;
function getRotations() {
  if (!rotationsCache) {
    const ROTATION_COUNT = 18; // n = [0..17]
    const ROTATION_ANGLE_DEGREES = 220;
    rotationsCache = new Float32Array(ROTATION_COUNT * 4); // mat2 = 4 floats

    for (let i = 0; i < ROTATION_COUNT; i++) {
      const angle = ROTATION_ANGLE_DEGREES * Math.PI / 180 * i;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // mat2 in column-major order: [cos, sin, -sin, cos]
      rotationsCache[i * 4] = cos;
      rotationsCache[i * 4 + 1] = sin;
      rotationsCache[i * 4 + 2] = -sin;
      rotationsCache[i * 4 + 3] = cos;
    }
  }
  return rotationsCache;
}
function resolveColor(colorDefinition, rng) {
  if (Array.isArray(colorDefinition[0])) {
    const [color1, color2] = colorDefinition;
    return [rng.nextBetween(color1[0], color2[0]), rng.nextBetween(color1[1], color2[1]), rng.nextBetween(color1[2], color2[2])];
  }
  return colorDefinition;
}

/***/ }

}]);
//# sourceMappingURL=src_components_common_PeerBadge_tsx-src_components_common_pickers_PickerModal_tsx-src_compone-e47010.687be1418d9be908f497.js.map