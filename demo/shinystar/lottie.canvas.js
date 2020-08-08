/* eslint-disable */

typeof navigator !== 'undefined' &&
  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      define(function() {
        return factory(root);
      });
    } else if (typeof module === 'object' && module.exports) {
      module.exports = factory(root);
    } else {
      root.lottie = factory(root);
      root.bodymovin = root.lottie;
    }
  })(window || {}, function(window) {
    'use strict';

    var initialDefaultFrame = -999999;

    var subframeEnabled = true;
    var expressionsPlugin;
    var bm_rnd;
    var bm_pow = Math.pow;
    var bm_sqrt = Math.sqrt;
    var bm_floor = Math.floor;
    var bm_max = Math.max;
    var bm_min = Math.min;
    var blitter = 10;

    var BMMath = {};
    (function() {
      var propertyNames = [
        'abs',
        'acos',
        'acosh',
        'asin',
        'asinh',
        'atan',
        'atanh',
        'atan2',
        'ceil',
        'cbrt',
        'expm1',
        'clz32',
        'cos',
        'cosh',
        'exp',
        'floor',
        'fround',
        'hypot',
        'imul',
        'log',
        'log1p',
        'log2',
        'log10',
        'max',
        'min',
        'pow',
        'random',
        'round',
        'sign',
        'sin',
        'sinh',
        'sqrt',
        'tan',
        'tanh',
        'trunc',
        'E',
        'LN10',
        'LN2',
        'LOG10E',
        'LOG2E',
        'PI',
        'SQRT1_2',
        'SQRT2'
      ];
      var i,
        len = propertyNames.length;
      for (i = 0; i < len; i += 1) {
        BMMath[propertyNames[i]] = Math[propertyNames[i]];
      }
    })();

    function ProjectInterface() {
      return {};
    }

    BMMath.random = Math.random;
    var defaultCurveSegments = 150;
    var degToRads = Math.PI / 180;
    var roundCorner = 0.5519;

    function roundValues(flag) {
      if (flag) {
        bm_rnd = Math.round;
      } else {
        bm_rnd = function(val) {
          return val;
        };
      }
    }
    roundValues(false);

    var createElementID = (function() {
      var _count = 0;
      return function createID() {
        return '__lottie_element_' + ++_count;
      };
    })();

    function BaseEvent() {}
    BaseEvent.prototype = {
      triggerEvent: function(eventName, args) {
        if (this._cbs[eventName]) {
          var len = this._cbs[eventName].length;
          for (var i = 0; i < len; i++) {
            this._cbs[eventName][i](args);
          }
        }
      },
      addEventListener: function(eventName, callback) {
        if (!this._cbs[eventName]) {
          this._cbs[eventName] = [];
        }
        this._cbs[eventName].push(callback);

        return function() {
          this.removeEventListener(eventName, callback);
        }.bind(this);
      },
      removeEventListener: function(eventName, callback) {
        if (!callback) {
          this._cbs[eventName] = null;
        } else if (this._cbs[eventName]) {
          var i = 0,
            len = this._cbs[eventName].length;
          while (i < len) {
            if (this._cbs[eventName][i] === callback) {
              this._cbs[eventName].splice(i, 1);
              i -= 1;
              len -= 1;
            }
            i += 1;
          }
          if (!this._cbs[eventName].length) {
            this._cbs[eventName] = null;
          }
        }
      }
    };
    var createTypedArray = (function() {
      function createRegularArray(type, len) {
        var i = 0,
          arr = [],
          value;
        switch (type) {
          case 'int16':
          case 'uint8c':
            value = 1;
            break;
          default:
            value = 1.1;
            break;
        }
        for (i = 0; i < len; i += 1) {
          arr.push(value);
        }
        return arr;
      }
      function createTypedArray(type, len) {
        if (type === 'float32') {
          return new Float32Array(len);
        } else if (type === 'int16') {
          return new Int16Array(len);
        } else if (type === 'uint8c') {
          return new Uint8ClampedArray(len);
        }
      }
      if (
        typeof Uint8ClampedArray === 'function' &&
        typeof Float32Array === 'function'
      ) {
        return createTypedArray;
      } else {
        return createRegularArray;
      }
    })();

    function createSizedArray(len) {
      return Array.apply(null, { length: len });
    }
    function createTag(type) {
      return document.createElement(type);
    }
    function DynamicPropertyContainer() {}
    DynamicPropertyContainer.prototype = {
      addDynamicProperty: function(prop) {
        if (this.dynamicProperties.indexOf(prop) === -1) {
          this.dynamicProperties.push(prop);
          this.container.addDynamicProperty(this);
          this._isAnimated = true;
        }
      },
      iterateDynamicProperties: function() {
        this._mdf = false;
        var i,
          len = this.dynamicProperties.length;
        for (i = 0; i < len; i += 1) {
          this.dynamicProperties[i].getValue();
          if (this.dynamicProperties[i]._mdf) {
            this._mdf = true;
          }
        }
      },
      initDynamicPropertyContainer: function(container) {
        this.container = container;
        this.dynamicProperties = [];
        this._mdf = false;
        this._isAnimated = false;
      }
    };
    var getBlendMode = (function() {
      var blendModeEnums = {
        0: 'source-over',
        1: 'multiply',
        2: 'screen',
        3: 'overlay',
        4: 'darken',
        5: 'lighten',
        6: 'color-dodge',
        7: 'color-burn',
        8: 'hard-light',
        9: 'soft-light',
        10: 'difference',
        11: 'exclusion',
        12: 'hue',
        13: 'saturation',
        14: 'color',
        15: 'luminosity'
      };

      return function(mode) {
        return blendModeEnums[mode] || '';
      };
    })();

    var Matrix = (function() {
      var _cos = Math.cos;
      var _sin = Math.sin;
      var _tan = Math.tan;
      var _rnd = Math.round;

      function reset() {
        this.props[0] = 1;
        this.props[1] = 0;
        this.props[2] = 0;
        this.props[3] = 0;
        this.props[4] = 0;
        this.props[5] = 1;
        this.props[6] = 0;
        this.props[7] = 0;
        this.props[8] = 0;
        this.props[9] = 0;
        this.props[10] = 1;
        this.props[11] = 0;
        this.props[12] = 0;
        this.props[13] = 0;
        this.props[14] = 0;
        this.props[15] = 1;
        return this;
      }

      function rotate(angle) {
        if (angle === 0) {
          return this;
        }
        var mCos = _cos(angle);
        var mSin = _sin(angle);
        return this._t(
          mCos,
          -mSin,
          0,
          0,
          mSin,
          mCos,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1
        );
      }

      function scale(sx, sy, sz) {
        if (!sz && sz !== 0) {
          sz = 1;
        }
        if (sx === 1 && sy === 1 && sz === 1) {
          return this;
        }
        return this._t(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1);
      }

      function translate(tx, ty, tz) {
        tz = tz || 0;
        if (tx !== 0 || ty !== 0 || tz !== 0) {
          return this._t(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1);
        }
        return this;
      }

      function transform(
        a2,
        b2,
        c2,
        d2,
        e2,
        f2,
        g2,
        h2,
        i2,
        j2,
        k2,
        l2,
        m2,
        n2,
        o2,
        p2
      ) {
        var _p = this.props;

        if (
          a2 === 1 &&
          b2 === 0 &&
          c2 === 0 &&
          d2 === 0 &&
          e2 === 0 &&
          f2 === 1 &&
          g2 === 0 &&
          h2 === 0 &&
          i2 === 0 &&
          j2 === 0 &&
          k2 === 1 &&
          l2 === 0
        ) {
          //NOTE: commenting this condition because TurboFan deoptimizes code when present
          //if(m2 !== 0 || n2 !== 0 || o2 !== 0){
          _p[12] = _p[12] * a2 + _p[15] * m2;
          _p[13] = _p[13] * f2 + _p[15] * n2;
          _p[14] = _p[14] * k2 + _p[15] * o2;
          _p[15] = _p[15] * p2;
          //}
          this._identityCalculated = false;
          return this;
        }

        var a1 = _p[0];
        var b1 = _p[1];
        var c1 = _p[2];
        var d1 = _p[3];
        var e1 = _p[4];
        var f1 = _p[5];
        var g1 = _p[6];
        var h1 = _p[7];
        var i1 = _p[8];
        var j1 = _p[9];
        var k1 = _p[10];
        var l1 = _p[11];
        var m1 = _p[12];
        var n1 = _p[13];
        var o1 = _p[14];
        var p1 = _p[15];

        /* matrix order (canvas compatible):
         * ace
         * bdf
         * 001
         */
        _p[0] = a1 * a2 + b1 * e2 + c1 * i2 + d1 * m2;
        _p[1] = a1 * b2 + b1 * f2 + c1 * j2 + d1 * n2;
        _p[2] = a1 * c2 + b1 * g2 + c1 * k2 + d1 * o2;
        _p[3] = a1 * d2 + b1 * h2 + c1 * l2 + d1 * p2;

        _p[4] = e1 * a2 + f1 * e2 + g1 * i2 + h1 * m2;
        _p[5] = e1 * b2 + f1 * f2 + g1 * j2 + h1 * n2;
        _p[6] = e1 * c2 + f1 * g2 + g1 * k2 + h1 * o2;
        _p[7] = e1 * d2 + f1 * h2 + g1 * l2 + h1 * p2;

        _p[8] = i1 * a2 + j1 * e2 + k1 * i2 + l1 * m2;
        _p[9] = i1 * b2 + j1 * f2 + k1 * j2 + l1 * n2;
        _p[10] = i1 * c2 + j1 * g2 + k1 * k2 + l1 * o2;
        _p[11] = i1 * d2 + j1 * h2 + k1 * l2 + l1 * p2;

        _p[12] = m1 * a2 + n1 * e2 + o1 * i2 + p1 * m2;
        _p[13] = m1 * b2 + n1 * f2 + o1 * j2 + p1 * n2;
        _p[14] = m1 * c2 + n1 * g2 + o1 * k2 + p1 * o2;
        _p[15] = m1 * d2 + n1 * h2 + o1 * l2 + p1 * p2;

        this._identityCalculated = false;
        return this;
      }

      function cloneFromProps(props) {
        var i;
        for (i = 0; i < 16; i += 1) {
          this.props[i] = props[i];
        }
      }

      return function() {
        this.reset = reset;
        this.rotate = rotate;
        this.scale = scale;
        this.translate = translate;
        this.transform = transform;
        this.cloneFromProps = cloneFromProps;
        this._t = this.transform;
        this._identity = true;
        this._identityCalculated = false;

        this.props = createTypedArray('float32', 16);
        this.reset();
      };
    })();

    var BezierFactory = (function() {
      var ob = {};
      ob.getBezierEasing = getBezierEasing;
      var beziers = {};

      function getBezierEasing(a, b, c, d, nm) {
        var str =
          nm || ('bez_' + a + '_' + b + '_' + c + '_' + d).replace(/\./g, 'p');
        if (beziers[str]) {
          return beziers[str];
        }
        var bezEasing = new BezierEasing([a, b, c, d]);
        beziers[str] = bezEasing;
        return bezEasing;
      }

      // These values are established by empiricism with tests (tradeoff: performance VS precision)
      var NEWTON_ITERATIONS = 4;
      var NEWTON_MIN_SLOPE = 0.001;
      var SUBDIVISION_PRECISION = 0.0000001;
      var SUBDIVISION_MAX_ITERATIONS = 10;

      var kSplineTableSize = 11;
      var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

      var float32ArraySupported = typeof Float32Array === 'function';

      function A(aA1, aA2) {
        return 1.0 - 3.0 * aA2 + 3.0 * aA1;
      }
      function B(aA1, aA2) {
        return 3.0 * aA2 - 6.0 * aA1;
      }
      function C(aA1) {
        return 3.0 * aA1;
      }

      // Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
      function calcBezier(aT, aA1, aA2) {
        return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
      }

      // Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
      function getSlope(aT, aA1, aA2) {
        return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
      }

      function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
        for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
          var currentSlope = getSlope(aGuessT, mX1, mX2);
          if (currentSlope === 0.0) return aGuessT;
          var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
          aGuessT -= currentX / currentSlope;
        }
        return aGuessT;
      }

      /**
       * points is an array of [ mX1, mY1, mX2, mY2 ]
       */
      function BezierEasing(points) {
        this._p = points;
        this._mSampleValues = float32ArraySupported
          ? new Float32Array(kSplineTableSize)
          : new Array(kSplineTableSize);
        this._precomputed = false;

        this.get = this.get.bind(this);
      }

      BezierEasing.prototype = {
        get: function(x) {
          var mX1 = this._p[0],
            mY1 = this._p[1],
            mX2 = this._p[2],
            mY2 = this._p[3];
          if (!this._precomputed) this._precompute();
          if (mX1 === mY1 && mX2 === mY2) return x; // linear
          // Because JavaScript number are imprecise, we should guarantee the extremes are right.
          if (x === 0) return 0;
          if (x === 1) return 1;
          return calcBezier(this._getTForX(x), mY1, mY2);
        },

        // Private part

        _precompute: function() {
          var mX1 = this._p[0],
            mY1 = this._p[1],
            mX2 = this._p[2],
            mY2 = this._p[3];
          this._precomputed = true;
          if (mX1 !== mY1 || mX2 !== mY2) this._calcSampleValues();
        },

        _calcSampleValues: function() {
          var mX1 = this._p[0],
            mX2 = this._p[2];
          for (var i = 0; i < kSplineTableSize; ++i) {
            this._mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
          }
        },

        /**
         * getTForX chose the fastest heuristic to determine the percentage value precisely from a given X projection.
         */
        _getTForX: function(aX) {
          var mX1 = this._p[0],
            mX2 = this._p[2],
            mSampleValues = this._mSampleValues;

          var intervalStart = 0.0;
          var currentSample = 1;
          var lastSample = kSplineTableSize - 1;

          for (
            ;
            currentSample !== lastSample && mSampleValues[currentSample] <= aX;
            ++currentSample
          ) {
            intervalStart += kSampleStepSize;
          }
          --currentSample;

          // Interpolate to provide an initial guess for t
          var dist =
            (aX - mSampleValues[currentSample]) /
            (mSampleValues[currentSample + 1] - mSampleValues[currentSample]);
          var guessForT = intervalStart + dist * kSampleStepSize;

          var initialSlope = getSlope(guessForT, mX1, mX2);
          if (initialSlope >= NEWTON_MIN_SLOPE) {
            return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
          } else if (initialSlope === 0.0) {
            return guessForT;
          } else {
            return binarySubdivide(
              aX,
              intervalStart,
              intervalStart + kSampleStepSize,
              mX1,
              mX2
            );
          }
        }
      };

      return ob;
    })();

    function extendPrototype(sources, destination) {
      var i,
        len = sources.length,
        sourcePrototype;
      for (i = 0; i < len; i += 1) {
        sourcePrototype = sources[i].prototype;
        for (var attr in sourcePrototype) {
          if (sourcePrototype.hasOwnProperty(attr))
            destination.prototype[attr] = sourcePrototype[attr];
        }
      }
    }

    function getDescriptor(object, prop) {
      return Object.getOwnPropertyDescriptor(object, prop);
    }

    function createProxyFunction(prototype) {
      function ProxyFunction() {}
      ProxyFunction.prototype = prototype;
      return ProxyFunction;
    }
    function bezFunction() {
      var easingFunctions = [];
      var math = Math;

      function pointOnLine2D(x1, y1, x2, y2, x3, y3) {
        var det1 = x1 * y2 + y1 * x3 + x2 * y3 - x3 * y2 - y3 * x1 - x2 * y1;
        return det1 > -0.001 && det1 < 0.001;
      }

      function pointOnLine3D(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
        if (z1 === 0 && z2 === 0 && z3 === 0) {
          return pointOnLine2D(x1, y1, x2, y2, x3, y3);
        }
        var dist1 = Math.sqrt(
          Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
        );
        var dist2 = Math.sqrt(
          Math.pow(x3 - x1, 2) + Math.pow(y3 - y1, 2) + Math.pow(z3 - z1, 2)
        );
        var dist3 = Math.sqrt(
          Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2) + Math.pow(z3 - z2, 2)
        );
        var diffDist;
        if (dist1 > dist2) {
          if (dist1 > dist3) {
            diffDist = dist1 - dist2 - dist3;
          } else {
            diffDist = dist3 - dist2 - dist1;
          }
        } else if (dist3 > dist2) {
          diffDist = dist3 - dist2 - dist1;
        } else {
          diffDist = dist2 - dist1 - dist3;
        }
        return diffDist > -0.0001 && diffDist < 0.0001;
      }

      var getBezierLength = (function() {
        return function(pt1, pt2, pt3, pt4) {
          var curveSegments = defaultCurveSegments;
          var k;
          var i, len;
          var ptCoord,
            perc,
            addedLength = 0;
          var ptDistance;
          var point = [],
            lastPoint = [];
          var lengthData = bezier_length_pool.newElement();
          len = pt3.length;
          for (k = 0; k < curveSegments; k += 1) {
            perc = k / (curveSegments - 1);
            ptDistance = 0;
            for (i = 0; i < len; i += 1) {
              ptCoord =
                bm_pow(1 - perc, 3) * pt1[i] +
                3 * bm_pow(1 - perc, 2) * perc * pt3[i] +
                3 * (1 - perc) * bm_pow(perc, 2) * pt4[i] +
                bm_pow(perc, 3) * pt2[i];
              point[i] = ptCoord;
              if (lastPoint[i] !== null) {
                ptDistance += bm_pow(point[i] - lastPoint[i], 2);
              }
              lastPoint[i] = point[i];
            }
            if (ptDistance) {
              ptDistance = bm_sqrt(ptDistance);
              addedLength += ptDistance;
            }
            lengthData.percents[k] = perc;
            lengthData.lengths[k] = addedLength;
          }
          lengthData.addedLength = addedLength;
          return lengthData;
        };
      })();

      function getSegmentsLength(shapeData) {
        var segmentsLength = segments_length_pool.newElement();
        var closed = shapeData.c;
        var pathV = shapeData.v;
        var pathO = shapeData.o;
        var pathI = shapeData.i;
        var i,
          len = shapeData._length;
        var lengths = segmentsLength.lengths;
        var totalLength = 0;
        for (i = 0; i < len - 1; i += 1) {
          lengths[i] = getBezierLength(
            pathV[i],
            pathV[i + 1],
            pathO[i],
            pathI[i + 1]
          );
          totalLength += lengths[i].addedLength;
        }
        if (closed && len) {
          lengths[i] = getBezierLength(pathV[i], pathV[0], pathO[i], pathI[0]);
          totalLength += lengths[i].addedLength;
        }
        segmentsLength.totalLength = totalLength;
        return segmentsLength;
      }

      function BezierData(length) {
        this.segmentLength = 0;
        this.points = new Array(length);
      }

      function PointData(partial, point) {
        this.partialLength = partial;
        this.point = point;
      }

      var buildBezierData = (function() {
        var storedData = {};

        return function(keyData) {
          var pt1 = keyData.s;
          var pt2 = keyData.e;
          var pt3 = keyData.to;
          var pt4 = keyData.ti;
          var bezierName = (
            pt1[0] +
            '_' +
            pt1[1] +
            '_' +
            pt2[0] +
            '_' +
            pt2[1] +
            '_' +
            pt3[0] +
            '_' +
            pt3[1] +
            '_' +
            pt4[0] +
            '_' +
            pt4[1]
          ).replace(/\./g, 'p');
          if (storedData[bezierName]) {
            keyData.bezierData = storedData[bezierName];
            return;
          }
          var curveSegments = defaultCurveSegments;
          var k, i, len;
          var ptCoord,
            perc,
            addedLength = 0;
          var ptDistance;
          var point,
            lastPoint = null;
          if (
            pt1.length === 2 &&
            (pt1[0] != pt2[0] || pt1[1] != pt2[1]) &&
            pointOnLine2D(
              pt1[0],
              pt1[1],
              pt2[0],
              pt2[1],
              pt1[0] + pt3[0],
              pt1[1] + pt3[1]
            ) &&
            pointOnLine2D(
              pt1[0],
              pt1[1],
              pt2[0],
              pt2[1],
              pt2[0] + pt4[0],
              pt2[1] + pt4[1]
            )
          ) {
            curveSegments = 2;
          }
          var bezierData = new BezierData(curveSegments);
          len = pt3.length;
          for (k = 0; k < curveSegments; k += 1) {
            point = createSizedArray(len);
            perc = k / (curveSegments - 1);
            ptDistance = 0;
            for (i = 0; i < len; i += 1) {
              ptCoord =
                bm_pow(1 - perc, 3) * pt1[i] +
                3 * bm_pow(1 - perc, 2) * perc * (pt1[i] + pt3[i]) +
                3 * (1 - perc) * bm_pow(perc, 2) * (pt2[i] + pt4[i]) +
                bm_pow(perc, 3) * pt2[i];
              point[i] = ptCoord;
              if (lastPoint !== null) {
                ptDistance += bm_pow(point[i] - lastPoint[i], 2);
              }
            }
            ptDistance = bm_sqrt(ptDistance);
            addedLength += ptDistance;
            bezierData.points[k] = new PointData(ptDistance, point);
            lastPoint = point;
          }
          bezierData.segmentLength = addedLength;
          keyData.bezierData = bezierData;
          storedData[bezierName] = bezierData;
        };
      })();

      function getDistancePerc(perc, bezierData) {
        var percents = bezierData.percents;
        var lengths = bezierData.lengths;
        var len = percents.length;
        var initPos = bm_floor((len - 1) * perc);
        var lengthPos = perc * bezierData.addedLength;
        var lPerc = 0;
        if (
          initPos === len - 1 ||
          initPos === 0 ||
          lengthPos === lengths[initPos]
        ) {
          return percents[initPos];
        } else {
          var dir = lengths[initPos] > lengthPos ? -1 : 1;
          var flag = true;
          while (flag) {
            if (
              lengths[initPos] <= lengthPos &&
              lengths[initPos + 1] > lengthPos
            ) {
              lPerc =
                (lengthPos - lengths[initPos]) /
                (lengths[initPos + 1] - lengths[initPos]);
              flag = false;
            } else {
              initPos += dir;
            }
            if (initPos < 0 || initPos >= len - 1) {
              //FIX for TypedArrays that don't store floating point values with enough accuracy
              if (initPos === len - 1) {
                return percents[initPos];
              }
              flag = false;
            }
          }
          return (
            percents[initPos] +
            (percents[initPos + 1] - percents[initPos]) * lPerc
          );
        }
      }

      function getPointInSegment(pt1, pt2, pt3, pt4, percent, bezierData) {
        var t1 = getDistancePerc(percent, bezierData);
        var u0 = 1;
        var u1 = 1 - t1;
        var ptX =
          Math.round(
            (u1 * u1 * u1 * pt1[0] +
              (t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1) * pt3[0] +
              (t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1) * pt4[0] +
              t1 * t1 * t1 * pt2[0]) *
              1000
          ) / 1000;
        var ptY =
          Math.round(
            (u1 * u1 * u1 * pt1[1] +
              (t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1) * pt3[1] +
              (t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1) * pt4[1] +
              t1 * t1 * t1 * pt2[1]) *
              1000
          ) / 1000;
        return [ptX, ptY];
      }

      function getSegmentArray() {}

      var bezier_segment_points = createTypedArray('float32', 8);

      function getNewSegment(
        pt1,
        pt2,
        pt3,
        pt4,
        startPerc,
        endPerc,
        bezierData
      ) {
        startPerc = startPerc < 0 ? 0 : startPerc > 1 ? 1 : startPerc;
        var t0 = getDistancePerc(startPerc, bezierData);
        endPerc = endPerc > 1 ? 1 : endPerc;
        var t1 = getDistancePerc(endPerc, bezierData);
        var i,
          len = pt1.length;
        var u0 = 1 - t0;
        var u1 = 1 - t1;
        var u0u0u0 = u0 * u0 * u0;
        var t0u0u0_3 = t0 * u0 * u0 * 3;
        var t0t0u0_3 = t0 * t0 * u0 * 3;
        var t0t0t0 = t0 * t0 * t0;
        //
        var u0u0u1 = u0 * u0 * u1;
        var t0u0u1_3 = t0 * u0 * u1 + u0 * t0 * u1 + u0 * u0 * t1;
        var t0t0u1_3 = t0 * t0 * u1 + u0 * t0 * t1 + t0 * u0 * t1;
        var t0t0t1 = t0 * t0 * t1;
        //
        var u0u1u1 = u0 * u1 * u1;
        var t0u1u1_3 = t0 * u1 * u1 + u0 * t1 * u1 + u0 * u1 * t1;
        var t0t1u1_3 = t0 * t1 * u1 + u0 * t1 * t1 + t0 * u1 * t1;
        var t0t1t1 = t0 * t1 * t1;
        //
        var u1u1u1 = u1 * u1 * u1;
        var t1u1u1_3 = t1 * u1 * u1 + u1 * t1 * u1 + u1 * u1 * t1;
        var t1t1u1_3 = t1 * t1 * u1 + u1 * t1 * t1 + t1 * u1 * t1;
        var t1t1t1 = t1 * t1 * t1;
        for (i = 0; i < len; i += 1) {
          bezier_segment_points[i * 4] =
            Math.round(
              (u0u0u0 * pt1[i] +
                t0u0u0_3 * pt3[i] +
                t0t0u0_3 * pt4[i] +
                t0t0t0 * pt2[i]) *
                1000
            ) / 1000;
          bezier_segment_points[i * 4 + 1] =
            Math.round(
              (u0u0u1 * pt1[i] +
                t0u0u1_3 * pt3[i] +
                t0t0u1_3 * pt4[i] +
                t0t0t1 * pt2[i]) *
                1000
            ) / 1000;
          bezier_segment_points[i * 4 + 2] =
            Math.round(
              (u0u1u1 * pt1[i] +
                t0u1u1_3 * pt3[i] +
                t0t1u1_3 * pt4[i] +
                t0t1t1 * pt2[i]) *
                1000
            ) / 1000;
          bezier_segment_points[i * 4 + 3] =
            Math.round(
              (u1u1u1 * pt1[i] +
                t1u1u1_3 * pt3[i] +
                t1t1u1_3 * pt4[i] +
                t1t1t1 * pt2[i]) *
                1000
            ) / 1000;
        }

        return bezier_segment_points;
      }

      return {
        getSegmentsLength: getSegmentsLength,
        getNewSegment: getNewSegment,
        getPointInSegment: getPointInSegment,
        buildBezierData: buildBezierData,
        pointOnLine2D: pointOnLine2D,
        pointOnLine3D: pointOnLine3D
      };
    }

    var bez = bezFunction();
    function dataFunctionManager() {
      //var tCanvasHelper = createTag('canvas').getContext('2d');

      function completeLayers(layers, comps, fontManager) {
        var layerData;
        var animArray, lastFrame;
        var i,
          len = layers.length;
        var j, jLen, k, kLen;
        for (i = 0; i < len; i += 1) {
          layerData = layers[i];
          if (!('ks' in layerData) || layerData.completed) {
            continue;
          }
          layerData.completed = true;
          if (layerData.tt) {
            layers[i - 1].td = layerData.tt;
          }
          animArray = [];
          lastFrame = -1;
          if (layerData.ty === 0) {
            layerData.layers = findCompLayers(layerData.refId, comps);
            completeLayers(layerData.layers, comps, fontManager);
          } else if (layerData.ty === 4) {
            completeShapes(layerData.shapes);
          } else if (layerData.ty == 5) {
            completeText(layerData, fontManager);
          }
        }
      }

      function findCompLayers(id, comps) {
        var i = 0,
          len = comps.length;
        while (i < len) {
          if (comps[i].id === id) {
            if (!comps[i].layers.__used) {
              comps[i].layers.__used = true;
              return comps[i].layers;
            }
            return JSON.parse(JSON.stringify(comps[i].layers));
          }
          i += 1;
        }
      }

      function completeShapes(arr) {
        var i,
          len = arr.length;
        var j, jLen;
        var hasPaths = false;
      }

      function completeData(animationData, fontManager) {
        if (animationData.__complete) {
          return;
        }
        completeLayers(animationData.layers, animationData.assets, fontManager);
        animationData.__complete = true;
      }

      var moduleOb = {};
      moduleOb.completeData = completeData;

      return moduleOb;
    }

    var dataManager = dataFunctionManager();
    var PropertyFactory = (function() {
      var initFrame = initialDefaultFrame;
      var math_abs = Math.abs;

      function interpolateValue(frameNum, caching) {
        var offsetTime = this.offsetTime;
        var newValue;
        if (this.propType === 'multidimensional') {
          newValue = createTypedArray('float32', this.pv.length);
        }
        var iterationIndex = caching.lastIndex;
        var i = iterationIndex;
        var len = this.keyframes.length - 1,
          flag = true;
        var keyData, nextKeyData;

        while (flag) {
          keyData = this.keyframes[i];
          nextKeyData = this.keyframes[i + 1];
          if (i === len - 1 && frameNum >= nextKeyData.t - offsetTime) {
            if (keyData.h) {
              keyData = nextKeyData;
            }
            iterationIndex = 0;
            break;
          }
          if (nextKeyData.t - offsetTime > frameNum) {
            iterationIndex = i;
            break;
          }
          if (i < len - 1) {
            i += 1;
          } else {
            iterationIndex = 0;
            flag = false;
          }
        }

        var k, kLen, perc, jLen, j, fnc;
        var nextKeyTime = nextKeyData.t - offsetTime;
        var keyTime = keyData.t - offsetTime;
        var endValue;

        var outX, outY, inX, inY, keyValue;
        len = keyData.s.length;
        endValue = nextKeyData.s || keyData.e;

        for (i = 0; i < len; i += 1) {
          if (keyData.h !== 1) {
            if (frameNum >= nextKeyTime) {
              perc = 1;
            } else if (frameNum < keyTime) {
              perc = 0;
            } else {
              if (keyData.o.x.constructor === Array) {
                if (!keyData.__fnct) {
                  keyData.__fnct = [];
                }
                if (!keyData.__fnct[i]) {
                  outX =
                    typeof keyData.o.x[i] === 'undefined'
                      ? keyData.o.x[0]
                      : keyData.o.x[i];
                  outY =
                    typeof keyData.o.y[i] === 'undefined'
                      ? keyData.o.y[0]
                      : keyData.o.y[i];
                  inX =
                    typeof keyData.i.x[i] === 'undefined'
                      ? keyData.i.x[0]
                      : keyData.i.x[i];
                  inY =
                    typeof keyData.i.y[i] === 'undefined'
                      ? keyData.i.y[0]
                      : keyData.i.y[i];
                  fnc = BezierFactory.getBezierEasing(outX, outY, inX, inY).get;
                  keyData.__fnct[i] = fnc;
                } else {
                  fnc = keyData.__fnct[i];
                }
              } else {
                if (!keyData.__fnct) {
                  outX = keyData.o.x;
                  outY = keyData.o.y;
                  inX = keyData.i.x;
                  inY = keyData.i.y;
                  fnc = BezierFactory.getBezierEasing(outX, outY, inX, inY).get;
                  keyData.__fnct = fnc;
                } else {
                  fnc = keyData.__fnct;
                }
              }
              perc = fnc((frameNum - keyTime) / (nextKeyTime - keyTime));
            }
          }

          endValue = nextKeyData.s || keyData.e;
          keyValue =
            keyData.h === 1
              ? keyData.s[i]
              : keyData.s[i] + (endValue[i] - keyData.s[i]) * perc;

          if (this.propType === 'multidimensional') {
            newValue[i] = keyValue;
          } else {
            newValue = keyValue;
          }
        }
        caching.lastIndex = iterationIndex;
        return newValue;
      }

      function getValueAtCurrentTime() {
        var frameNum = this.comp.renderedFrame - this.offsetTime;
        var initTime = this.keyframes[0].t - this.offsetTime;
        var endTime =
          this.keyframes[this.keyframes.length - 1].t - this.offsetTime;
        if (
          !(
            frameNum === this._caching.lastFrame ||
            (this._caching.lastFrame !== initFrame &&
              ((this._caching.lastFrame >= endTime && frameNum >= endTime) ||
                (this._caching.lastFrame < initTime && frameNum < initTime)))
          )
        ) {
          if (this._caching.lastFrame >= frameNum) {
            this._caching._lastKeyframeIndex = -1;
            this._caching.lastIndex = 0;
          }

          var renderResult = this.interpolateValue(frameNum, this._caching);
          this.pv = renderResult;
        }
        this._caching.lastFrame = frameNum;
        return this.pv;
      }

      function setVValue(val) {
        var multipliedValue;
        if (this.propType === 'unidimensional') {
          multipliedValue = val * this.mult;
          if (math_abs(this.v - multipliedValue) > 0.00001) {
            this.v = multipliedValue;
            this._mdf = true;
          }
        } else {
          var i = 0,
            len = this.v.length;
          while (i < len) {
            multipliedValue = val[i] * this.mult;
            if (math_abs(this.v[i] - multipliedValue) > 0.00001) {
              this.v[i] = multipliedValue;
              this._mdf = true;
            }
            i += 1;
          }
        }
      }

      function processEffectsSequence() {
        if (
          this.elem.globalData.frameId === this.frameId ||
          !this.effectsSequence.length
        ) {
          return;
        }
        if (this.lock) {
          this.setVValue(this.pv);
          return;
        }
        this.lock = true;
        this._mdf = this._isFirstFrame;
        var multipliedValue;
        var i,
          len = this.effectsSequence.length;
        var finalValue = this.kf ? this.pv : this.data.k;
        for (i = 0; i < len; i += 1) {
          finalValue = this.effectsSequence[i](finalValue);
        }
        this.setVValue(finalValue);
        this._isFirstFrame = false;
        this.lock = false;
        this.frameId = this.elem.globalData.frameId;
      }

      function ValueProperty(elem, data, mult, container) {
        this.propType = 'unidimensional';
        this.mult = mult || 1;
        this.data = data;
        this.v = mult ? data.k * mult : data.k;
        this.pv = data.k;
        this._mdf = false;
        this.elem = elem;
        this.container = container;
        this.comp = elem.comp;
        this.k = false;
        this.kf = false;
        this.vel = 0;
        this.effectsSequence = [];
        this._isFirstFrame = true;
        this.getValue = processEffectsSequence;
        this.setVValue = setVValue;
      }

      function MultiDimensionalProperty(elem, data, mult, container) {
        this.propType = 'multidimensional';
        this.mult = mult || 1;
        this.data = data;
        this._mdf = false;
        this.elem = elem;
        this.container = container;
        this.comp = elem.comp;
        this.k = false;
        this.kf = false;
        this.frameId = -1;
        var i,
          len = data.k.length;
        this.v = createTypedArray('float32', len);
        this.pv = createTypedArray('float32', len);
        var arr = createTypedArray('float32', len);
        this.vel = createTypedArray('float32', len);
        for (i = 0; i < len; i += 1) {
          this.v[i] = data.k[i] * this.mult;
          this.pv[i] = data.k[i];
        }
        this._isFirstFrame = true;
        this.effectsSequence = [];
        this.getValue = processEffectsSequence;
        this.setVValue = setVValue;
      }

      function KeyframedValueProperty(elem, data, mult, container) {
        this.propType = 'unidimensional';
        this.keyframes = data.k;
        this.offsetTime = elem.data.st;
        this.frameId = -1;
        this._caching = {
          lastFrame: initFrame,
          lastIndex: 0,
          value: 0,
          _lastKeyframeIndex: -1
        };
        this.k = true;
        this.kf = true;
        this.data = data;
        this.mult = mult || 1;
        this.elem = elem;
        this.container = container;
        this.comp = elem.comp;
        this.v = initFrame;
        this.pv = initFrame;
        this._isFirstFrame = true;
        this.getValue = processEffectsSequence;
        this.setVValue = setVValue;
        this.interpolateValue = interpolateValue;
        this.effectsSequence = [getValueAtCurrentTime.bind(this)];
      }

      function KeyframedMultidimensionalProperty(elem, data, mult, container) {
        this.propType = 'multidimensional';
        var i,
          len = data.k.length;
        var s, e, to, ti;
        for (i = 0; i < len - 1; i += 1) {
          if (data.k[i].to && data.k[i].s && data.k[i].e) {
            s = data.k[i].s;
            e = data.k[i].e;
            to = data.k[i].to;
            ti = data.k[i].ti;
            if (
              (s.length === 2 &&
                !(s[0] === e[0] && s[1] === e[1]) &&
                bez.pointOnLine2D(
                  s[0],
                  s[1],
                  e[0],
                  e[1],
                  s[0] + to[0],
                  s[1] + to[1]
                ) &&
                bez.pointOnLine2D(
                  s[0],
                  s[1],
                  e[0],
                  e[1],
                  e[0] + ti[0],
                  e[1] + ti[1]
                )) ||
              (s.length === 3 &&
                !(s[0] === e[0] && s[1] === e[1] && s[2] === e[2]) &&
                bez.pointOnLine3D(
                  s[0],
                  s[1],
                  s[2],
                  e[0],
                  e[1],
                  e[2],
                  s[0] + to[0],
                  s[1] + to[1],
                  s[2] + to[2]
                ) &&
                bez.pointOnLine3D(
                  s[0],
                  s[1],
                  s[2],
                  e[0],
                  e[1],
                  e[2],
                  e[0] + ti[0],
                  e[1] + ti[1],
                  e[2] + ti[2]
                ))
            ) {
              data.k[i].to = null;
              data.k[i].ti = null;
            }
            if (
              s[0] === e[0] &&
              s[1] === e[1] &&
              to[0] === 0 &&
              to[1] === 0 &&
              ti[0] === 0 &&
              ti[1] === 0
            ) {
              if (
                s.length === 2 ||
                (s[2] === e[2] && to[2] === 0 && ti[2] === 0)
              ) {
                data.k[i].to = null;
                data.k[i].ti = null;
              }
            }
          }
        }
        this.effectsSequence = [getValueAtCurrentTime.bind(this)];
        this.keyframes = data.k;
        this.offsetTime = elem.data.st;
        this.k = true;
        this.kf = true;
        this._isFirstFrame = true;
        this.mult = mult || 1;
        this.elem = elem;
        this.container = container;
        this.comp = elem.comp;
        this.getValue = processEffectsSequence;
        this.setVValue = setVValue;
        this.interpolateValue = interpolateValue;
        this.frameId = -1;
        var arrLen = data.k[0].s.length;
        this.v = createTypedArray('float32', arrLen);
        this.pv = createTypedArray('float32', arrLen);
        for (i = 0; i < arrLen; i += 1) {
          this.v[i] = initFrame;
          this.pv[i] = initFrame;
        }
        this._caching = {
          lastFrame: initFrame,
          lastIndex: 0,
          value: createTypedArray('float32', arrLen)
        };
      }

      function getProp(elem, data, type, mult, container) {
        var p;
        if (!data.k.length) {
          p = new ValueProperty(elem, data, mult, container);
        } else if (typeof data.k[0] === 'number') {
          p = new MultiDimensionalProperty(elem, data, mult, container);
        } else {
          switch (type) {
            case 0:
              p = new KeyframedValueProperty(elem, data, mult, container);
              break;
            case 1:
              p = new KeyframedMultidimensionalProperty(
                elem,
                data,
                mult,
                container
              );
              break;
          }
        }
        if (p.effectsSequence.length) {
          container.addDynamicProperty(p);
        }
        return p;
      }

      var ob = {
        getProp: getProp
      };
      return ob;
    })();
    var TransformPropertyFactory = (function() {
      function applyToMatrix(mat) {
        var _mdf = this._mdf;
        this.iterateDynamicProperties();
        this._mdf = this._mdf || _mdf;
        if (this.a) {
          mat.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
        }
        if (this.s) {
          mat.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
        }
        if (this.sk) {
          mat.skewFromAxis(-this.sk.v, this.sa.v);
        }
        if (this.r) {
          mat.rotate(-this.r.v);
        } else {
          mat
            .rotateZ(-this.rz.v)
            .rotateY(this.ry.v)
            .rotateX(this.rx.v)
            .rotateZ(-this.or.v[2])
            .rotateY(this.or.v[1])
            .rotateX(this.or.v[0]);
        }
        if (this.data.p.s) {
          if (this.data.p.z) {
            mat.translate(this.px.v, this.py.v, -this.pz.v);
          } else {
            mat.translate(this.px.v, this.py.v, 0);
          }
        } else {
          mat.translate(this.p.v[0], this.p.v[1], -this.p.v[2]);
        }
      }
      function processKeys(forceRender) {
        if (this.elem.globalData.frameId === this.frameId) {
          return;
        }
        if (this._isDirty) {
          this.precalculateMatrix();
          this._isDirty = false;
        }

        this.iterateDynamicProperties();

        if (this._mdf || forceRender) {
          this.v.cloneFromProps(this.pre.props);
          if (this.appliedTransformations < 1) {
            this.v.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
          }
          if (this.appliedTransformations < 2) {
            this.v.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
          }
          if (this.sk && this.appliedTransformations < 3) {
            this.v.skewFromAxis(-this.sk.v, this.sa.v);
          }
          if (this.r && this.appliedTransformations < 4) {
            this.v.rotate(-this.r.v);
          } else if (!this.r && this.appliedTransformations < 4) {
            this.v
              .rotateZ(-this.rz.v)
              .rotateY(this.ry.v)
              .rotateX(this.rx.v)
              .rotateZ(-this.or.v[2])
              .rotateY(this.or.v[1])
              .rotateX(this.or.v[0]);
          }
          if (this.data.p && this.data.p.s) {
            if (this.data.p.z) {
              this.v.translate(this.px.v, this.py.v, -this.pz.v);
            } else {
              this.v.translate(this.px.v, this.py.v, 0);
            }
          } else {
            this.v.translate(this.p.v[0], this.p.v[1], -this.p.v[2]);
          }
        }
        this.frameId = this.elem.globalData.frameId;
      }

      function precalculateMatrix() {
        if (!this.a.k) {
          this.pre.translate(-this.a.v[0], -this.a.v[1], this.a.v[2]);
          this.appliedTransformations = 1;
        } else {
          return;
        }
        if (!this.s.effectsSequence.length) {
          this.pre.scale(this.s.v[0], this.s.v[1], this.s.v[2]);
          this.appliedTransformations = 2;
        } else {
          return;
        }
        if (this.sk) {
          if (
            !this.sk.effectsSequence.length &&
            !this.sa.effectsSequence.length
          ) {
            this.pre.skewFromAxis(-this.sk.v, this.sa.v);
            this.appliedTransformations = 3;
          } else {
            return;
          }
        }
        if (this.r) {
          if (!this.r.effectsSequence.length) {
            this.pre.rotate(-this.r.v);
            this.appliedTransformations = 4;
          } else {
            return;
          }
        } else if (
          !this.rz.effectsSequence.length &&
          !this.ry.effectsSequence.length &&
          !this.rx.effectsSequence.length &&
          !this.or.effectsSequence.length
        ) {
          this.pre
            .rotateZ(-this.rz.v)
            .rotateY(this.ry.v)
            .rotateX(this.rx.v)
            .rotateZ(-this.or.v[2])
            .rotateY(this.or.v[1])
            .rotateX(this.or.v[0]);
          this.appliedTransformations = 4;
        }
      }

      function autoOrient() {
        //
        //var prevP = this.getValueAtTime();
      }

      function addDynamicProperty(prop) {
        this._addDynamicProperty(prop);
        this.elem.addDynamicProperty(prop);
        this._isDirty = true;
      }

      function TransformProperty(elem, data, container) {
        this.elem = elem;
        this.frameId = -1;
        this.propType = 'transform';
        this.data = data;
        this.v = new Matrix();
        //Precalculated matrix with non animated properties
        this.pre = new Matrix();
        this.appliedTransformations = 0;
        this.initDynamicPropertyContainer(container || elem);
        if (data.p && data.p.s) {
          this.px = PropertyFactory.getProp(elem, data.p.x, 0, 0, this);
          this.py = PropertyFactory.getProp(elem, data.p.y, 0, 0, this);
          if (data.p.z) {
            this.pz = PropertyFactory.getProp(elem, data.p.z, 0, 0, this);
          }
        } else {
          this.p = PropertyFactory.getProp(
            elem,
            data.p || { k: [0, 0, 0] },
            1,
            0,
            this
          );
        }
        if (data.rx) {
          this.rx = PropertyFactory.getProp(elem, data.rx, 0, degToRads, this);
          this.ry = PropertyFactory.getProp(elem, data.ry, 0, degToRads, this);
          this.rz = PropertyFactory.getProp(elem, data.rz, 0, degToRads, this);
          if (data.or.k[0].ti) {
            var i,
              len = data.or.k.length;
            for (i = 0; i < len; i += 1) {
              data.or.k[i].to = data.or.k[i].ti = null;
            }
          }
          this.or = PropertyFactory.getProp(elem, data.or, 1, degToRads, this);
          //sh Indicates it needs to be capped between -180 and 180
          this.or.sh = true;
        } else {
          this.r = PropertyFactory.getProp(
            elem,
            data.r || { k: 0 },
            0,
            degToRads,
            this
          );
        }
        if (data.sk) {
          this.sk = PropertyFactory.getProp(elem, data.sk, 0, degToRads, this);
          this.sa = PropertyFactory.getProp(elem, data.sa, 0, degToRads, this);
        }
        this.a = PropertyFactory.getProp(
          elem,
          data.a || { k: [0, 0, 0] },
          1,
          0,
          this
        );
        this.s = PropertyFactory.getProp(
          elem,
          data.s || { k: [100, 100, 100] },
          1,
          0.01,
          this
        );
        // Opacity is not part of the transform properties, that's why it won't use this.dynamicProperties. That way transforms won't get updated if opacity changes.
        if (data.o) {
          this.o = PropertyFactory.getProp(elem, data.o, 0, 0.01, elem);
        } else {
          this.o = { _mdf: false, v: 1 };
        }
        this._isDirty = true;
        if (!this.dynamicProperties.length) {
          this.getValue(true);
        }
      }

      TransformProperty.prototype = {
        applyToMatrix: applyToMatrix,
        getValue: processKeys,
        precalculateMatrix: precalculateMatrix,
        autoOrient: autoOrient
      };

      extendPrototype([DynamicPropertyContainer], TransformProperty);
      TransformProperty.prototype.addDynamicProperty = addDynamicProperty;
      TransformProperty.prototype._addDynamicProperty =
        DynamicPropertyContainer.prototype.addDynamicProperty;

      function getTransformProperty(elem, data, container) {
        return new TransformProperty(elem, data, container);
      }

      return {
        getTransformProperty: getTransformProperty
      };
    })();

    var ShapeModifiers = (function() {
      var ob = {};
      var modifiers = {};
      ob.registerModifier = registerModifier;
      ob.getModifier = getModifier;

      function registerModifier(nm, factory) {
        if (!modifiers[nm]) {
          modifiers[nm] = factory;
        }
      }

      function getModifier(nm, elem, data) {
        return new modifiers[nm](elem, data);
      }

      return ob;
    })();

    var ImagePreloader = (function() {
      var proxyImage = (function() {
        var canvas = createTag('canvas');
        canvas.width = 1;
        canvas.height = 1;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 1, 1);
        return canvas;
      })();

      function loadAssetsFromSprite(opt, assets, spriteSrc, cb) {
        this.imagesLoadedCb = cb;
        var self = this;
        var __callback = function() {
          var cs = document.createElement('canvas');
          var ct = cs.getContext('2d');
          for (var i = 0; i < opt.items.length; i++) {
            var item = opt.items[i];

            for (var j = 0; j < assets.length; j++) {
              var asset = assets[j];

              if (asset.p && asset.p.indexOf(item.name) != -1) {
                cs.width = asset.w;
                cs.height = asset.h;
                ct.drawImage(
                  sprite,
                  item.x,
                  item.y,
                  item.width,
                  item.height,
                  0,
                  0,
                  asset.w,
                  asset.h
                );
                var img = new Image();
                img.src = cs.toDataURL();

                self.totalImages += 1;
                self.loadedAssets += 1;
                self.images.push({
                  img: img,
                  assetData: asset
                });
                break;
              }
            }
          }
          self.imagesLoadedCb(null);
        };

        //加载精灵图
        var spriteImg = spriteSrc ? spriteSrc : opt.src;
        if (typeof spriteImg == 'string') {
          var sprite = new Image();
          sprite.setAttribute('crossOrigin', 'anonymous');
          sprite.src = spriteImg;
          sprite.onload = __callback;
        } else {
          var sprite = spriteImg;
          __callback();
        }
      }

      function setPath(path) {
        this.path = path || '';
      }

      function setAssetsPath(path) {
        this.assetsPath = path || '';
      }

      function getImage(assetData) {
        var i = 0,
          len = this.images.length;
        while (i < len) {
          if (this.images[i].assetData === assetData) {
            return this.images[i].img;
          }
          i += 1;
        }
      }

      function destroy() {
        this.imagesLoadedCb = null;
        this.images.length = 0;
      }

      function loaded() {
        return this.totalImages === this.loadedAssets;
      }

      return function ImagePreloader() {
        this.loadAssetsFromSprite = loadAssetsFromSprite;
        this.setAssetsPath = setAssetsPath;
        this.setPath = setPath;
        this.loaded = loaded;
        this.destroy = destroy;
        this.getImage = getImage;
        this.assetsPath = '';
        this.path = '';
        this.totalImages = 0;
        this.loadedAssets = 0;
        this.imagesLoadedCb = null;
        this.images = [];
      };
    })();

    var pool_factory = (function() {
      return function(initialLength, _create, _release, _clone) {
        var _length = 0;
        var _maxLength = initialLength;
        var pool = createSizedArray(_maxLength);

        var ob = {
          newElement: newElement,
          release: release
        };

        function newElement() {
          var element;
          if (_length) {
            _length -= 1;
            element = pool[_length];
          } else {
            element = _create();
          }
          return element;
        }

        function release(element) {
          if (_length === _maxLength) {
            pool = pooling.double(pool);
            _maxLength = _maxLength * 2;
          }
          if (_release) {
            _release(element);
          }
          pool[_length] = element;
          _length += 1;
        }

        function clone() {
          var clonedElement = newElement();
          return _clone(clonedElement);
        }

        return ob;
      };
    })();

    var pooling = (function() {
      function double(arr) {
        return arr.concat(createSizedArray(arr.length));
      }

      return {
        double: double
      };
    })();
    var point_pool = (function() {
      function create() {
        return createTypedArray('float32', 2);
      }
      return pool_factory(8, create);
    })();
    var bezier_length_pool = (function() {
      function create() {
        return {
          addedLength: 0,
          percents: createTypedArray('float32', defaultCurveSegments),
          lengths: createTypedArray('float32', defaultCurveSegments)
        };
      }
      return pool_factory(8, create);
    })();
    function BaseRenderer() {}
    BaseRenderer.prototype.checkLayers = function(num) {
      var i,
        len = this.layers.length,
        data;
      this.completeLayers = true;
      for (i = len - 1; i >= 0; i--) {
        if (!this.elements[i]) {
          data = this.layers[i];
          if (
            data.ip - data.st <= num - this.layers[i].st &&
            data.op - data.st > num - this.layers[i].st
          ) {
            this.buildItem(i);
          }
        }
        this.completeLayers = this.elements[i] ? this.completeLayers : false;
      }
      this.checkPendingElements();
    };

    BaseRenderer.prototype.createItem = function(layer) {
      switch (layer.ty) {
        case 2:
          return this.createImage(layer);
        case 0:
          return this.createComp(layer);
        case 1:
          return this.createSolid(layer);
        case 3:
          return this.createNull(layer);
        case 4:
          return this.createShape(layer);
        case 5:
          return this.createText(layer);
        case 13:
          return this.createCamera(layer);
      }
      return this.createNull(layer);
    };

    BaseRenderer.prototype.createCamera = function() {
      throw new Error("You're using a 3d camera. Try the html renderer.");
    };

    BaseRenderer.prototype.buildAllItems = function() {
      var i,
        len = this.layers.length;
      for (i = 0; i < len; i += 1) {
        this.buildItem(i);
      }
      this.checkPendingElements();
    };

    BaseRenderer.prototype.setProjectInterface = function(pInterface) {
      this.globalData.projectInterface = pInterface;
    };

    BaseRenderer.prototype.initItems = function() {
      if (!this.globalData.progressiveLoad) {
        this.buildAllItems();
      }
    };

    BaseRenderer.prototype.addPendingElement = function(element) {
      this.pendingElements.push(element);
    };

    BaseRenderer.prototype.searchExtraCompositions = function(assets) {
      var i,
        len = assets.length;
      for (i = 0; i < len; i += 1) {
        if (assets[i].xt) {
          var comp = this.createComp(assets[i]);
          comp.initExpressions();
          this.globalData.projectInterface.registerComposition(comp);
        }
      }
    };

    BaseRenderer.prototype.setupGlobalData = function(animData) {
      this.globalData.getAssetData = this.animationItem.getAssetData.bind(
        this.animationItem
      );
      this.globalData.imageLoader = this.animationItem.imagePreloader;
      this.globalData.frameId = 0;
      this.globalData.frameRate = animData.fr;
      this.globalData.nm = animData.nm;
      this.globalData.compSize = {
        w: animData.w,
        h: animData.h
      };
    };

    function CanvasRenderer(animationItem, config) {
      this.animationItem = animationItem;
      this.renderConfig = {
        clearCanvas:
          config && config.clearCanvas !== undefined
            ? config.clearCanvas
            : true,
        context: (config && config.context) || null,
        progressiveLoad: (config && config.progressiveLoad) || false,
        preserveAspectRatio:
          (config && config.preserveAspectRatio) || 'xMidYMid meet',
        imagePreserveAspectRatio:
          (config && config.imagePreserveAspectRatio) || 'xMidYMid slice',
        className: (config && config.className) || ''
      };
      this.renderConfig.dpr = (config && config.dpr) || 1;
      if (this.animationItem.wrapper) {
        this.renderConfig.dpr =
          (config && config.dpr) || window.devicePixelRatio || 1;
      }
      this.renderedFrame = -1;
      this.globalData = {
        frameNum: -1,
        _mdf: false,
        renderConfig: this.renderConfig,
        currentGlobalAlpha: -1
      };
      this.contextData = new CVContextData();
      this.elements = [];
      this.pendingElements = [];
      this.transformMat = new Matrix();
      this.completeLayers = false;
      this.rendererType = 'canvas';
    }
    extendPrototype([BaseRenderer], CanvasRenderer);

    CanvasRenderer.prototype.createShape = function(data) {
      return new CVShapeElement(data, this.globalData, this);
    };

    CanvasRenderer.prototype.createText = function(data) {
      return new CVTextElement(data, this.globalData, this);
    };

    CanvasRenderer.prototype.createImage = function(data) {
      return new CVImageElement(data, this.globalData, this);
    };

    CanvasRenderer.prototype.createComp = function(data) {
      return new CVCompElement(data, this.globalData, this);
    };

    CanvasRenderer.prototype.createSolid = function(data) {
      return new CVSolidElement(data, this.globalData, this);
    };

    CanvasRenderer.prototype.createNull = function(data) {
      return new NullElement(data, this.globalData, this);
    };

    CanvasRenderer.prototype.ctxTransform = function(props) {
      if (
        props[0] === 1 &&
        props[1] === 0 &&
        props[4] === 0 &&
        props[5] === 1 &&
        props[12] === 0 &&
        props[13] === 0
      ) {
        return;
      }
      if (!this.renderConfig.clearCanvas) {
        this.canvasContext.transform(
          props[0],
          props[1],
          props[4],
          props[5],
          props[12],
          props[13]
        );
        return;
      }
      this.transformMat.cloneFromProps(props);
      var cProps = this.contextData.cTr.props;
      this.transformMat.transform(
        cProps[0],
        cProps[1],
        cProps[2],
        cProps[3],
        cProps[4],
        cProps[5],
        cProps[6],
        cProps[7],
        cProps[8],
        cProps[9],
        cProps[10],
        cProps[11],
        cProps[12],
        cProps[13],
        cProps[14],
        cProps[15]
      );
      //this.contextData.cTr.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);
      this.contextData.cTr.cloneFromProps(this.transformMat.props);
      var trProps = this.contextData.cTr.props;
      this.canvasContext.setTransform(
        trProps[0],
        trProps[1],
        trProps[4],
        trProps[5],
        trProps[12],
        trProps[13]
      );
    };

    CanvasRenderer.prototype.ctxOpacity = function(op) {
      /*if(op === 1){
        return;
    }*/
      if (!this.renderConfig.clearCanvas) {
        this.canvasContext.globalAlpha *= op < 0 ? 0 : op;
        this.globalData.currentGlobalAlpha = this.contextData.cO;
        return;
      }
      this.contextData.cO *= op < 0 ? 0 : op;
      if (this.globalData.currentGlobalAlpha !== this.contextData.cO) {
        this.canvasContext.globalAlpha = this.contextData.cO;
        this.globalData.currentGlobalAlpha = this.contextData.cO;
      }
    };

    CanvasRenderer.prototype.reset = function() {
      if (!this.renderConfig.clearCanvas) {
        this.canvasContext.restore();
        return;
      }
      this.contextData.reset();
    };

    CanvasRenderer.prototype.save = function(actionFlag) {
      if (!this.renderConfig.clearCanvas) {
        this.canvasContext.save();
        return;
      }
      if (actionFlag) {
        this.canvasContext.save();
      }
      var props = this.contextData.cTr.props;
      if (this.contextData._length <= this.contextData.cArrPos) {
        this.contextData.duplicate();
      }
      var i,
        arr = this.contextData.saved[this.contextData.cArrPos];
      for (i = 0; i < 16; i += 1) {
        arr[i] = props[i];
      }
      this.contextData.savedOp[this.contextData.cArrPos] = this.contextData.cO;
      this.contextData.cArrPos += 1;
    };

    CanvasRenderer.prototype.restore = function(actionFlag) {
      if (!this.renderConfig.clearCanvas) {
        this.canvasContext.restore();
        return;
      }
      if (actionFlag) {
        this.canvasContext.restore();
        this.globalData.blendMode = 'source-over';
      }
      this.contextData.cArrPos -= 1;
      var popped = this.contextData.saved[this.contextData.cArrPos];
      var i,
        arr = this.contextData.cTr.props;
      for (i = 0; i < 16; i += 1) {
        arr[i] = popped[i];
      }
      this.canvasContext.setTransform(
        popped[0],
        popped[1],
        popped[4],
        popped[5],
        popped[12],
        popped[13]
      );
      popped = this.contextData.savedOp[this.contextData.cArrPos];
      this.contextData.cO = popped;
      if (this.globalData.currentGlobalAlpha !== popped) {
        this.canvasContext.globalAlpha = popped;
        this.globalData.currentGlobalAlpha = popped;
      }
    };

    CanvasRenderer.prototype.configAnimation = function(animData) {
      if (this.animationItem.wrapper) {
        this.animationItem.container = createTag('canvas');
        this.animationItem.container.style.width = '100%';
        this.animationItem.container.style.height = '100%';
        //this.animationItem.container.style.transform = 'translate3d(0,0,0)';
        //this.animationItem.container.style.webkitTransform = 'translate3d(0,0,0)';
        this.animationItem.container.style.transformOrigin = this.animationItem.container.style.mozTransformOrigin = this.animationItem.container.style.webkitTransformOrigin = this.animationItem.container.style[
          '-webkit-transform'
        ] = '0px 0px 0px';
        this.animationItem.wrapper.appendChild(this.animationItem.container);
        this.canvasContext = this.animationItem.container.getContext('2d');
        if (this.renderConfig.className) {
          this.animationItem.container.setAttribute(
            'class',
            this.renderConfig.className
          );
        }
      } else {
        this.canvasContext = this.renderConfig.context;
      }
      this.data = animData;
      this.layers = animData.layers;
      this.transformCanvas = {
        w: animData.w,
        h: animData.h,
        sx: 0,
        sy: 0,
        tx: 0,
        ty: 0
      };
      this.setupGlobalData(animData, document.body);
      this.globalData.canvasContext = this.canvasContext;
      this.globalData.renderer = this;
      this.globalData.isDashed = false;
      this.globalData.progressiveLoad = this.renderConfig.progressiveLoad;
      this.globalData.transformCanvas = this.transformCanvas;
      this.elements = createSizedArray(animData.layers.length);

      this.updateContainerSize();
    };

    CanvasRenderer.prototype.updateContainerSize = function() {
      this.reset();
      var elementWidth, elementHeight;
      if (this.animationItem.wrapper && this.animationItem.container) {
        elementWidth = this.animationItem.wrapper.offsetWidth;
        elementHeight = this.animationItem.wrapper.offsetHeight;
        this.animationItem.container.setAttribute(
          'width',
          elementWidth * this.renderConfig.dpr
        );
        this.animationItem.container.setAttribute(
          'height',
          elementHeight * this.renderConfig.dpr
        );
      } else {
        elementWidth = this.canvasContext.canvas.width * this.renderConfig.dpr;
        elementHeight =
          this.canvasContext.canvas.height * this.renderConfig.dpr;
      }
      var elementRel, animationRel;
      if (
        this.renderConfig.preserveAspectRatio.indexOf('meet') !== -1 ||
        this.renderConfig.preserveAspectRatio.indexOf('slice') !== -1
      ) {
        var par = this.renderConfig.preserveAspectRatio.split(' ');
        var fillType = par[1] || 'meet';
        var pos = par[0] || 'xMidYMid';
        var xPos = pos.substr(0, 4);
        var yPos = pos.substr(4);
        elementRel = elementWidth / elementHeight;
        animationRel = this.transformCanvas.w / this.transformCanvas.h;
        if (
          (animationRel > elementRel && fillType === 'meet') ||
          (animationRel < elementRel && fillType === 'slice')
        ) {
          this.transformCanvas.sx =
            elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
          this.transformCanvas.sy =
            elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
        } else {
          this.transformCanvas.sx =
            elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
          this.transformCanvas.sy =
            elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
        }

        if (
          xPos === 'xMid' &&
          ((animationRel < elementRel && fillType === 'meet') ||
            (animationRel > elementRel && fillType === 'slice'))
        ) {
          this.transformCanvas.tx =
            ((elementWidth -
              this.transformCanvas.w *
                (elementHeight / this.transformCanvas.h)) /
              2) *
            this.renderConfig.dpr;
        } else if (
          xPos === 'xMax' &&
          ((animationRel < elementRel && fillType === 'meet') ||
            (animationRel > elementRel && fillType === 'slice'))
        ) {
          this.transformCanvas.tx =
            (elementWidth -
              this.transformCanvas.w *
                (elementHeight / this.transformCanvas.h)) *
            this.renderConfig.dpr;
        } else {
          this.transformCanvas.tx = 0;
        }
        if (
          yPos === 'YMid' &&
          ((animationRel > elementRel && fillType === 'meet') ||
            (animationRel < elementRel && fillType === 'slice'))
        ) {
          this.transformCanvas.ty =
            ((elementHeight -
              this.transformCanvas.h *
                (elementWidth / this.transformCanvas.w)) /
              2) *
            this.renderConfig.dpr;
        } else if (
          yPos === 'YMax' &&
          ((animationRel > elementRel && fillType === 'meet') ||
            (animationRel < elementRel && fillType === 'slice'))
        ) {
          this.transformCanvas.ty =
            (elementHeight -
              this.transformCanvas.h *
                (elementWidth / this.transformCanvas.w)) *
            this.renderConfig.dpr;
        } else {
          this.transformCanvas.ty = 0;
        }
      } else if (this.renderConfig.preserveAspectRatio == 'none') {
        this.transformCanvas.sx =
          elementWidth / (this.transformCanvas.w / this.renderConfig.dpr);
        this.transformCanvas.sy =
          elementHeight / (this.transformCanvas.h / this.renderConfig.dpr);
        this.transformCanvas.tx = 0;
        this.transformCanvas.ty = 0;
      } else {
        this.transformCanvas.sx = this.renderConfig.dpr;
        this.transformCanvas.sy = this.renderConfig.dpr;
        this.transformCanvas.tx = 0;
        this.transformCanvas.ty = 0;
      }
      this.transformCanvas.props = [
        this.transformCanvas.sx,
        0,
        0,
        0,
        0,
        this.transformCanvas.sy,
        0,
        0,
        0,
        0,
        1,
        0,
        this.transformCanvas.tx,
        this.transformCanvas.ty,
        0,
        1
      ];

      this.ctxTransform(this.transformCanvas.props);
      this.canvasContext.beginPath();
      this.canvasContext.rect(
        0,
        0,
        this.transformCanvas.w,
        this.transformCanvas.h
      );
      this.canvasContext.closePath();
      this.canvasContext.clip();

      this.renderFrame(this.renderedFrame, true);
    };

    CanvasRenderer.prototype.destroy = function() {
      if (this.renderConfig.clearCanvas) {
        this.animationItem.wrapper.innerHTML = '';
      }
      var i,
        len = this.layers ? this.layers.length : 0;
      for (i = len - 1; i >= 0; i -= 1) {
        if (this.elements[i]) {
          this.elements[i].destroy();
        }
      }
      this.elements.length = 0;
      this.globalData.canvasContext = null;
      this.animationItem.container = null;
      this.destroyed = true;
    };

    CanvasRenderer.prototype.renderFrame = function(num, forceRender) {
      if (
        (this.renderedFrame === num &&
          this.renderConfig.clearCanvas === true &&
          !forceRender) ||
        this.destroyed ||
        num === -1
      ) {
        return;
      }
      this.renderedFrame = num;
      this.globalData.frameNum = num - this.animationItem._isFirstFrame;
      this.globalData.frameId += 1;
      this.globalData._mdf = !this.renderConfig.clearCanvas || forceRender;
      this.globalData.projectInterface.currentFrame = num;

      // console.info('--------');
      // console.info('NEW: ',num);
      var i,
        len = this.layers.length;
      if (!this.completeLayers) {
        this.checkLayers(num);
      }

      for (i = 0; i < len; i++) {
        if (this.completeLayers || this.elements[i]) {
          this.elements[i].prepareFrame(num - this.layers[i].st);
        }
      }
      if (this.globalData._mdf) {
        if (this.renderConfig.clearCanvas === true) {
          this.canvasContext.clearRect(
            0,
            0,
            this.transformCanvas.w,
            this.transformCanvas.h
          );
        } else {
          this.save();
        }
        for (i = len - 1; i >= 0; i -= 1) {
          if (this.completeLayers || this.elements[i]) {
            this.elements[i].renderFrame();
          }
        }
        if (this.renderConfig.clearCanvas !== true) {
          this.restore();
        }
      }
    };

    CanvasRenderer.prototype.buildItem = function(pos) {
      var elements = this.elements;
      if (elements[pos] || this.layers[pos].ty == 99) {
        return;
      }
      var element = this.createItem(this.layers[pos], this, this.globalData);
      elements[pos] = element;
      //   element.initExpressions();
      /*if(this.layers[pos].ty === 0){
        element.resize(this.globalData.transformCanvas);
    }*/
    };

    CanvasRenderer.prototype.checkPendingElements = function() {
      while (this.pendingElements.length) {
        var element = this.pendingElements.pop();
        element.checkParenting();
      }
    };

    CanvasRenderer.prototype.hide = function() {
      this.animationItem.container.style.display = 'none';
    };

    CanvasRenderer.prototype.show = function() {
      this.animationItem.container.style.display = 'block';
    };

    function HierarchyElement() {}

    HierarchyElement.prototype = {
      /**
       * @function
       * Initializes hierarchy properties
       *
       */
      initHierarchy: function() {
        //element's parent list
        this.hierarchy = [];
        //if element is parent of another layer _isParent will be true
        this._isParent = false;
        this.checkParenting();
      },
      /**
       * @function
       * Sets layer's hierarchy.
       * @param {array} hierarch
       * layer's parent list
       *
       */

      setHierarchy: function(hierarchy) {
        this.hierarchy = hierarchy;
      },
      /**
       * @function
       * Sets layer as parent.
       *
       */

      setAsParent: function() {
        this._isParent = true;
      },
      /**
       * @function
       * Searches layer's parenting chain
       *
       */

      checkParenting: function() {
        if (this.data.parent !== undefined) {
          this.comp.buildElementParenting(this, this.data.parent, []);
        }
      }
    };
    /**
     * @file
     * Handles element's layer frame update.
     * Checks layer in point and out point
     *
     */

    function FrameElement() {}

    FrameElement.prototype = {
      /**
       * @function
       * Initializes frame related properties.
       *
       */
      initFrame: function() {
        //set to true when inpoint is rendered
        this._isFirstFrame = false;
        //list of animated properties
        this.dynamicProperties = [];
        // If layer has been modified in current tick this will be true
        this._mdf = false;
      },
      /**
       * @function
       * Calculates all dynamic values
       *
       * @param {number} num
       * current frame number in Layer's time
       * @param {boolean} isVisible
       * if layers is currently in range
       *
       */
      prepareProperties: function(num, isVisible) {
        var i,
          len = this.dynamicProperties.length;
        for (i = 0; i < len; i += 1) {
          if (
            isVisible ||
            (this._isParent &&
              this.dynamicProperties[i].propType === 'transform')
          ) {
            this.dynamicProperties[i].getValue();
            if (this.dynamicProperties[i]._mdf) {
              this.globalData._mdf = true;
              this._mdf = true;
            }
          }
        }
      },
      addDynamicProperty: function(prop) {
        if (this.dynamicProperties.indexOf(prop) === -1) {
          this.dynamicProperties.push(prop);
        }
      }
    };
    function TransformElement() {}

    TransformElement.prototype = {
      initTransform: function() {
        this.finalTransform = {
          mProp: this.data.ks
            ? TransformPropertyFactory.getTransformProperty(
                this,
                this.data.ks,
                this
              )
            : { o: 0 },
          _matMdf: false,
          _opMdf: false,
          mat: new Matrix()
        };
        if (this.data.ao) {
          this.finalTransform.mProp.autoOriented = true;
        }
        if (this.data.ty !== 11) {
          //this.createElements();
        }
      },
      renderTransform: function() {
        this.finalTransform._opMdf =
          this.finalTransform.mProp.o._mdf || this._isFirstFrame;
        this.finalTransform._matMdf =
          this.finalTransform.mProp._mdf || this._isFirstFrame;

        if (this.hierarchy) {
          var mat;
          var finalMat = this.finalTransform.mat;
          var i = 0,
            len = this.hierarchy.length;
          //Checking if any of the transformation matrices in the hierarchy chain has changed.
          if (!this.finalTransform._matMdf) {
            while (i < len) {
              if (this.hierarchy[i].finalTransform.mProp._mdf) {
                this.finalTransform._matMdf = true;
                break;
              }
              i += 1;
            }
          }

          if (this.finalTransform._matMdf) {
            mat = this.finalTransform.mProp.v.props;
            finalMat.cloneFromProps(mat);
            for (i = 0; i < len; i += 1) {
              mat = this.hierarchy[i].finalTransform.mProp.v.props;
              finalMat.transform(
                mat[0],
                mat[1],
                mat[2],
                mat[3],
                mat[4],
                mat[5],
                mat[6],
                mat[7],
                mat[8],
                mat[9],
                mat[10],
                mat[11],
                mat[12],
                mat[13],
                mat[14],
                mat[15]
              );
            }
          }
        }
      },
      mHelper: new Matrix()
    };
    function RenderableElement() {}

    RenderableElement.prototype = {
      initRenderable: function() {
        //layer's visibility related to inpoint and outpoint. Rename isVisible to isInRange
        this.isInRange = false;
        //layer's display state
        this.hidden = false;
        // If layer's transparency equals 0, it can be hidden
        this.isTransparent = false;
        //list of animated components
        this.renderableComponents = [];
      },
      addRenderableComponent: function(component) {
        if (this.renderableComponents.indexOf(component) === -1) {
          this.renderableComponents.push(component);
        }
      },
      removeRenderableComponent: function(component) {
        if (this.renderableComponents.indexOf(component) !== -1) {
          this.renderableComponents.splice(
            this.renderableComponents.indexOf(component),
            1
          );
        }
      },
      prepareRenderableFrame: function(num) {
        this.checkLayerLimits(num);
      },
      checkTransparency: function() {
        if (this.finalTransform.mProp.o.v <= 0) {
          if (
            !this.isTransparent &&
            this.globalData.renderConfig.hideOnTransparent
          ) {
            this.isTransparent = true;
            this.hide();
          }
        } else if (this.isTransparent) {
          this.isTransparent = false;
          this.show();
        }
      },
      /**
       * @function
       * Initializes frame related properties.
       *
       * @param {number} num
       * current frame number in Layer's time
       *
       */
      checkLayerLimits: function(num) {
        if (
          this.data.ip - this.data.st <= num &&
          this.data.op - this.data.st > num
        ) {
          if (this.isInRange !== true) {
            this.globalData._mdf = true;
            this._mdf = true;
            this.isInRange = true;
            this.show();
          }
        } else {
          if (this.isInRange !== false) {
            this.globalData._mdf = true;
            this.isInRange = false;
            this.hide();
          }
        }
      },
      renderRenderable: function() {
        var i,
          len = this.renderableComponents.length;
        for (i = 0; i < len; i += 1) {
          this.renderableComponents[i].renderFrame(this._isFirstFrame);
        }
      }
    };
    function RenderableDOMElement() {}

    (function() {
      var _prototype = {
        initElement: function(data, globalData, comp) {
          this.initFrame();
          this.initBaseData(data, globalData, comp);
          this.initTransform(data, globalData, comp);
          this.initHierarchy();
          this.initRenderable();
          this.initRendererElement();
          this.createContainerElements();
          this.createRenderableComponents();
          this.createContent();
          this.hide();
        },
        renderInnerContent: function() {},
        prepareFrame: function(num) {
          this._mdf = false;
          this.prepareRenderableFrame(num);
          this.prepareProperties(num, this.isInRange);
          this.checkTransparency();
        },
        destroy: function() {
          this.innerElem = null;
          this.destroyBaseElement();
        }
      };
      extendPrototype(
        [RenderableElement, createProxyFunction(_prototype)],
        RenderableDOMElement
      );
    })();
    function ProcessedElement(element, position) {
      this.elem = element;
      this.pos = position;
    }
    function ShapeTransformManager() {
      this.sequences = {};
      this.sequenceList = [];
      this.transform_key_count = 0;
    }

    ShapeTransformManager.prototype = {
      processSequences: function(isFirstFrame) {
        var i,
          len = this.sequenceList.length;
        for (i = 0; i < len; i += 1) {
          this.processSequence(this.sequenceList[i], isFirstFrame);
        }
      },
      getNewKey: function() {
        return '_' + this.transform_key_count++;
      }
    };
    function BaseElement() {}

    BaseElement.prototype = {
      checkMasks: function() {
        if (!this.data.hasMask) {
          return false;
        }
        var i = 0,
          len = this.data.masksProperties.length;
        while (i < len) {
          if (
            this.data.masksProperties[i].mode !== 'n' &&
            this.data.masksProperties[i].cl !== false
          ) {
            return true;
          }
          i += 1;
        }
        return false;
      },
      setBlendMode: function() {
        var blendModeValue = getBlendMode(this.data.bm);
        var elem = this.baseElement || this.layerElement;

        elem.style['mix-blend-mode'] = blendModeValue;
      },
      initBaseData: function(data, globalData, comp) {
        this.globalData = globalData;
        this.comp = comp;
        this.data = data;
        this.layerId = createElementID();

        //Stretch factor for old animations missing this property.
        if (!this.data.sr) {
          this.data.sr = 1;
        }
      },
      getType: function() {
        return this.type;
      },
      sourceRectAtTime: function() {}
    };
    function NullElement(data, globalData, comp) {
      this.initFrame();
      this.initBaseData(data, globalData, comp);
      this.initFrame();
      this.initTransform(data, globalData, comp);
      this.initHierarchy();
    }

    NullElement.prototype.prepareFrame = function(num) {
      this.prepareProperties(num, true);
    };

    NullElement.prototype.renderFrame = function() {};

    NullElement.prototype.getBaseElement = function() {
      return null;
    };

    NullElement.prototype.destroy = function() {};

    NullElement.prototype.sourceRectAtTime = function() {};

    NullElement.prototype.hide = function() {};

    extendPrototype(
      [BaseElement, TransformElement, HierarchyElement, FrameElement],
      NullElement
    );

    function IShapeElement() {}

    IShapeElement.prototype = {
      addShapeToModifiers: function(data) {
        var i,
          len = this.shapeModifiers.length;
        for (i = 0; i < len; i += 1) {
          this.shapeModifiers[i].addShape(data);
        }
      },
      isShapeInAnimatedModifiers: function(data) {
        var i = 0,
          len = this.shapeModifiers.length;
        while (i < len) {
          if (this.shapeModifiers[i].isAnimatedWithShape(data)) {
            return true;
          }
        }
        return false;
      },
      renderModifiers: function() {
        if (!this.shapeModifiers.length) {
          return;
        }
        var i,
          len = this.shapes.length;
        for (i = 0; i < len; i += 1) {
          this.shapes[i].sh.reset();
        }

        len = this.shapeModifiers.length;
        for (i = len - 1; i >= 0; i -= 1) {
          this.shapeModifiers[i].processShapes(this._isFirstFrame);
        }
      },
      lcEnum: {
        '1': 'butt',
        '2': 'round',
        '3': 'square'
      },
      ljEnum: {
        '1': 'miter',
        '2': 'round',
        '3': 'bevel'
      },
      searchProcessedElement: function(elem) {
        var elements = this.processedElements;
        var i = 0,
          len = elements.length;
        while (i < len) {
          if (elements[i].elem === elem) {
            return elements[i].pos;
          }
          i += 1;
        }
        return 0;
      },
      addProcessedElement: function(elem, pos) {
        var elements = this.processedElements;
        var i = elements.length;
        while (i) {
          i -= 1;
          if (elements[i].elem === elem) {
            elements[i].pos = pos;
            return;
          }
        }
        elements.push(new ProcessedElement(elem, pos));
      },
      prepareFrame: function(num) {
        this.prepareRenderableFrame(num);
        this.prepareProperties(num, this.isInRange);
      }
    };

    function ICompElement() {}

    extendPrototype(
      [
        BaseElement,
        TransformElement,
        HierarchyElement,
        FrameElement,
        RenderableDOMElement
      ],
      ICompElement
    );

    ICompElement.prototype.initElement = function(data, globalData, comp) {
      this.initFrame();
      this.initBaseData(data, globalData, comp);
      this.initTransform(data, globalData, comp);
      this.initRenderable();
      this.initHierarchy();
      this.initRendererElement();
      this.createContainerElements();
      this.createRenderableComponents();
      if (this.data.xt || !globalData.progressiveLoad) {
        this.buildAllItems();
      }
      this.hide();
    };

    ICompElement.prototype.prepareFrame = function(num) {
      this._mdf = false;
      this.prepareRenderableFrame(num);
      this.prepareProperties(num, this.isInRange);
      if (!this.isInRange && !this.data.xt) {
        return;
      }

      if (!this.tm._placeholder) {
        var timeRemapped = this.tm.v;
        if (timeRemapped === this.data.op) {
          timeRemapped = this.data.op - 1;
        }
        this.renderedFrame = timeRemapped;
      } else {
        this.renderedFrame = num / this.data.sr;
      }
      var i,
        len = this.elements.length;
      if (!this.completeLayers) {
        this.checkLayers(this.renderedFrame);
      }
      //This iteration needs to be backwards because of how expressions connect between each other
      for (i = len - 1; i >= 0; i -= 1) {
        if (this.completeLayers || this.elements[i]) {
          this.elements[i].prepareFrame(this.renderedFrame - this.layers[i].st);
          if (this.elements[i]._mdf) {
            this._mdf = true;
          }
        }
      }
    };

    function CVContextData() {
      this.saved = [];
      this.cArrPos = 0;
      this.cTr = new Matrix();
      this.cO = 1;
      var i,
        len = 15;
      this.savedOp = createTypedArray('float32', len);
      for (i = 0; i < len; i += 1) {
        this.saved[i] = createTypedArray('float32', 16);
      }
      this._length = len;
    }

    CVContextData.prototype.reset = function() {
      this.cArrPos = 0;
      this.cTr.reset();
      this.cO = 1;
    };
    function CVBaseElement() {}

    CVBaseElement.prototype = {
      createElements: function() {},
      initRendererElement: function() {},
      createContainerElements: function() {
        this.canvasContext = this.globalData.canvasContext;
        this.renderableEffectsManager = new CVEffects(this);
      },
      createContent: function() {},
      setBlendMode: function() {
        var globalData = this.globalData;
        if (globalData.blendMode !== this.data.bm) {
          globalData.blendMode = this.data.bm;
          var blendModeValue = getBlendMode(this.data.bm);
          globalData.canvasContext.globalCompositeOperation = blendModeValue;
        }
      },
      createRenderableComponents: function() {
        this.maskManager = new CVMaskElement(this.data, this);
      },
      hideElement: function() {
        if (!this.hidden && (!this.isInRange || this.isTransparent)) {
          this.hidden = true;
        }
      },
      showElement: function() {
        if (this.isInRange && !this.isTransparent) {
          this.hidden = false;
          this._isFirstFrame = true;
          this.maskManager._isFirstFrame = true;
        }
      },
      renderFrame: function() {
        if (this.hidden || this.data.hd) {
          return;
        }
        this.renderTransform();
        this.renderRenderable();
        this.setBlendMode();
        var forceRealStack = this.data.ty === 0;
        this.globalData.renderer.save(forceRealStack);
        this.globalData.renderer.ctxTransform(this.finalTransform.mat.props);
        this.globalData.renderer.ctxOpacity(this.finalTransform.mProp.o.v);
        this.renderInnerContent();
        this.globalData.renderer.restore(forceRealStack);
        if (this.maskManager.hasMasks) {
          this.globalData.renderer.restore(true);
        }
        if (this._isFirstFrame) {
          this._isFirstFrame = false;
        }
      },
      destroy: function() {
        this.canvasContext = null;
        this.data = null;
        this.globalData = null;
        this.maskManager.destroy();
      },
      mHelper: new Matrix()
    };
    CVBaseElement.prototype.hide = CVBaseElement.prototype.hideElement;
    CVBaseElement.prototype.show = CVBaseElement.prototype.showElement;

    function CVImageElement(data, globalData, comp) {
      this.assetData = globalData.getAssetData(data.refId);
      this.img = globalData.imageLoader.getImage(this.assetData);
      this.initElement(data, globalData, comp);
    }
    extendPrototype(
      [
        BaseElement,
        TransformElement,
        CVBaseElement,
        HierarchyElement,
        FrameElement,
        RenderableElement
      ],
      CVImageElement
    );

    CVImageElement.prototype.initElement =
      RenderableDOMElement.prototype.initElement;
    CVImageElement.prototype.prepareFrame =
      RenderableDOMElement.prototype.prepareFrame;

    CVImageElement.prototype.renderInnerContent = function(parentMatrix) {
      this.canvasContext.drawImage(this.img, 0, 0);
    };

    CVImageElement.prototype.destroy = function() {
      this.img = null;
    };
    function CVCompElement(data, globalData, comp) {
      this.completeLayers = false;
      this.layers = data.layers;
      this.pendingElements = [];
      this.elements = createSizedArray(this.layers.length);
      this.initElement(data, globalData, comp);
      this.tm = data.tm
        ? PropertyFactory.getProp(this, data.tm, 0, globalData.frameRate, this)
        : { _placeholder: true };
    }

    extendPrototype(
      [CanvasRenderer, ICompElement, CVBaseElement],
      CVCompElement
    );

    CVCompElement.prototype.renderInnerContent = function() {
      var ctx = this.canvasContext;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.data.w, 0);
      ctx.lineTo(this.data.w, this.data.h);
      ctx.lineTo(0, this.data.h);
      ctx.lineTo(0, 0);
      ctx.clip();
      var i,
        len = this.layers.length;
      for (i = len - 1; i >= 0; i -= 1) {
        if (this.completeLayers || this.elements[i]) {
          this.elements[i].renderFrame();
        }
      }
    };

    CVCompElement.prototype.destroy = function() {
      var i,
        len = this.layers.length;
      for (i = len - 1; i >= 0; i -= 1) {
        if (this.elements[i]) {
          this.elements[i].destroy();
        }
      }
      this.layers = null;
      this.elements = null;
    };

    function CVMaskElement(data, element) {
      this.data = data;
      this.element = element;
      this.masksProperties = this.data.masksProperties || [];
      this.viewData = createSizedArray(this.masksProperties.length);
      var i,
        len = this.masksProperties.length,
        hasMasks = false;
      for (i = 0; i < len; i++) {
        if (this.masksProperties[i].mode !== 'n') {
          hasMasks = true;
        }
        this.viewData[i] = ShapePropertyFactory.getShapeProp(
          this.element,
          this.masksProperties[i],
          3
        );
      }
      this.hasMasks = hasMasks;
      if (hasMasks) {
        this.element.addRenderableComponent(this);
      }
    }

    CVMaskElement.prototype.destroy = function() {
      this.element = null;
    };
    function CVShapeElement(data, globalData, comp) {
      this.shapes = [];
      this.shapesData = data.shapes;
      this.stylesList = [];
      this.itemsData = [];
      this.prevViewData = [];
      this.shapeModifiers = [];
      this.processedElements = [];
      this.transformsManager = new ShapeTransformManager();
      this.initElement(data, globalData, comp);
    }

    extendPrototype(
      [
        BaseElement,
        TransformElement,
        CVBaseElement,
        IShapeElement,
        HierarchyElement,
        FrameElement,
        RenderableElement
      ],
      CVShapeElement
    );

    CVShapeElement.prototype.initElement =
      RenderableDOMElement.prototype.initElement;

    CVShapeElement.prototype.transformHelper = { opacity: 1, _opMdf: false };

    CVShapeElement.prototype.dashResetter = [];

    CVShapeElement.prototype.createContent = function() {
      this.searchShapes(
        this.shapesData,
        this.itemsData,
        this.prevViewData,
        true,
        []
      );
    };

    CVShapeElement.prototype.removeTransformFromStyleList = function() {
      var i,
        len = this.stylesList.length;
      for (i = 0; i < len; i += 1) {
        if (!this.stylesList[i].closed) {
          this.stylesList[i].transforms.pop();
        }
      }
    };

    CVShapeElement.prototype.closeStyles = function(styles) {
      var i,
        len = styles.length,
        j,
        jLen;
      for (i = 0; i < len; i += 1) {
        styles[i].closed = true;
      }
    };

    CVShapeElement.prototype.searchShapes = function(
      arr,
      itemsData,
      prevViewData,
      shouldRender,
      transforms
    ) {
      var i,
        len = arr.length - 1;
      var j, jLen;
      var ownStyles = [],
        ownModifiers = [],
        processedPos,
        modifier,
        currentTransform;
      var ownTransforms = [].concat(transforms);
      this.removeTransformFromStyleList();
      this.closeStyles(ownStyles);
      len = ownModifiers.length;
      for (i = 0; i < len; i += 1) {
        ownModifiers[i].closed = true;
      }
    };

    CVShapeElement.prototype.renderInnerContent = function() {
      this.transformHelper.opacity = 1;
      this.transformHelper._opMdf = false;
      this.renderModifiers();
      this.transformsManager.processSequences(this._isFirstFrame);
      this.renderShape(
        this.transformHelper,
        this.shapesData,
        this.itemsData,
        true
      );
    };

    CVShapeElement.prototype.renderShapeTransform = function(
      parentTransform,
      groupTransform
    ) {
      var props, groupMatrix;
      if (
        parentTransform._opMdf ||
        groupTransform.op._mdf ||
        this._isFirstFrame
      ) {
        groupTransform.opacity = parentTransform.opacity;
        groupTransform.opacity *= groupTransform.op.v;
        groupTransform._opMdf = true;
      }
    };

    CVShapeElement.prototype.renderShape = function(
      parentTransform,
      items,
      data,
      isMain
    ) {
      var i,
        len = items.length - 1;
      var groupTransform;
      groupTransform = parentTransform;
      for (i = len; i >= 0; i -= 1) {
        if (items[i].ty == 'tr') {
          groupTransform = data[i].transform;
          this.renderShapeTransform(parentTransform, groupTransform);
        } else if (
          items[i].ty == 'sh' ||
          items[i].ty == 'el' ||
          items[i].ty == 'rc' ||
          items[i].ty == 'sr'
        ) {
          this.renderPath(items[i], data[i]);
        } else if (items[i].ty == 'fl') {
          this.renderFill(items[i], data[i], groupTransform);
        } else if (items[i].ty == 'st') {
          this.renderStroke(items[i], data[i], groupTransform);
        } else if (items[i].ty == 'gf' || items[i].ty == 'gs') {
          this.renderGradientFill(items[i], data[i], groupTransform);
        } else if (items[i].ty == 'gr') {
          this.renderShape(groupTransform, items[i].it, data[i].it);
        } else if (items[i].ty == 'tm') {
          //
        }
      }
    };

    function CVEffects() {}
    CVEffects.prototype.renderFrame = function() {};
    var animationManager = (function() {
      var moduleOb = {};
      var registeredAnimations = [];
      var initTime = 0;
      var len = 0;
      var playingAnimationsNum = 0;
      var _stopped = true;
      var _isFrozen = false;

      function removeElement(ev) {
        var i = 0;
        var animItem = ev.target;
        while (i < len) {
          if (registeredAnimations[i].animation === animItem) {
            registeredAnimations.splice(i, 1);
            i -= 1;
            len -= 1;
            if (!animItem.isPaused) {
              subtractPlayingCount();
            }
          }
          i += 1;
        }
      }

      function addPlayingCount() {
        playingAnimationsNum += 1;
        activate();
      }

      function subtractPlayingCount() {
        playingAnimationsNum -= 1;
      }

      function setupAnimation(animItem, element) {
        animItem.addEventListener('destroy', removeElement);
        animItem.addEventListener('_active', addPlayingCount);
        animItem.addEventListener('_idle', subtractPlayingCount);
        registeredAnimations.push({ elem: element, animation: animItem });
        len += 1;
      }

      function loadAnimation(params) {
        var animItem = new AnimationItem();
        setupAnimation(animItem, null);
        animItem.setParams(params);
        return animItem;
      }

      function play(animation) {
        var i;
        for (i = 0; i < len; i += 1) {
          registeredAnimations[i].animation.play(animation);
        }
      }
      function resume(nowTime) {
        var elapsedTime = nowTime - initTime;
        var i;
        for (i = 0; i < len; i += 1) {
          registeredAnimations[i].animation.advanceTime(elapsedTime);
        }
        initTime = nowTime;
        if (playingAnimationsNum && !_isFrozen) {
          window.requestAnimationFrame(resume);
        } else {
          _stopped = true;
        }
      }

      function first(nowTime) {
        initTime = nowTime;
        window.requestAnimationFrame(resume);
      }

      function pause(animation) {
        var i;
        for (i = 0; i < len; i += 1) {
          registeredAnimations[i].animation.pause(animation);
        }
      }

      function goToAndStop(value, isFrame, animation) {
        var i;
        for (i = 0; i < len; i += 1) {
          registeredAnimations[i].animation.goToAndStop(
            value,
            isFrame,
            animation
          );
        }
      }

      function stop(animation) {
        var i;
        for (i = 0; i < len; i += 1) {
          registeredAnimations[i].animation.stop(animation);
        }
      }

      function togglePause(animation) {
        var i;
        for (i = 0; i < len; i += 1) {
          registeredAnimations[i].animation.togglePause(animation);
        }
      }

      function destroy(animation) {
        var i;
        for (i = len - 1; i >= 0; i -= 1) {
          registeredAnimations[i].animation.destroy(animation);
        }
      }

      function resize() {
        var i;
        for (i = 0; i < len; i += 1) {
          registeredAnimations[i].animation.resize();
        }
      }

      function activate() {
        if (!_isFrozen && playingAnimationsNum) {
          if (_stopped) {
            window.requestAnimationFrame(first);
            _stopped = false;
          }
        }
      }

      function freeze() {
        _isFrozen = true;
      }

      function unfreeze() {
        _isFrozen = false;
        activate();
      }

      moduleOb.loadAnimation = loadAnimation;
      moduleOb.play = play;
      moduleOb.pause = pause;
      moduleOb.stop = stop;
      moduleOb.togglePause = togglePause;
      moduleOb.resize = resize;
      moduleOb.goToAndStop = goToAndStop;
      moduleOb.destroy = destroy;
      moduleOb.freeze = freeze;
      moduleOb.unfreeze = unfreeze;
      return moduleOb;
    })();

    var AnimationItem = function() {
      this._cbs = [];
      this.name = '';
      this.path = '';
      this.isLoaded = false;
      this.currentFrame = 0;
      this.currentRawFrame = 0;
      this.totalFrames = 0;
      this.frameRate = 0;
      this.frameMult = 0;
      this.playSpeed = 1;
      this.playDirection = 1;
      this.playCount = 0;
      this.animationData = {};
      this.assets = [];
      this.isPaused = true;
      this.autoplay = false;
      this.loop = true;
      this.renderer = null;
      this.animationID = createElementID();
      this.assetsPath = '';
      this.timeCompleted = 0;
      this.segmentPos = 0;
      this.subframeEnabled = subframeEnabled;
      this.segments = [];
      this._idle = true;
      this._completedLoop = false;
      this.projectInterface = ProjectInterface();
      this.imagePreloader = new ImagePreloader();
    };

    extendPrototype([BaseEvent], AnimationItem);

    AnimationItem.prototype.setParams = function(params) {
      if (params._spriteSrc) {
        this._spriteSrc = params._spriteSrc;
      }
      if (params.context) {
        this.context = params.context;
      }
      if (params.wrapper || params.container) {
        this.wrapper = params.wrapper || params.container;
      }
      this.renderer = new CanvasRenderer(this, params.rendererSettings);
      this.renderer.setProjectInterface(this.projectInterface);
      this.animType = 'canvas';

      if (params.loop === '' || params.loop === null) {
      } else if (params.loop === false) {
        this.loop = false;
      } else if (params.loop === true) {
        this.loop = true;
      } else {
        this.loop = parseInt(params.loop);
      }
      this.autoplay = 'autoplay' in params ? params.autoplay : true;
      this.name = params.name ? params.name : '';
      this.autoloadSegments = params.hasOwnProperty('autoloadSegments')
        ? params.autoloadSegments
        : true;
      this.assetsPath = params.assetsPath;
      this.configAnimation(params.animationData);
    };

    AnimationItem.prototype.imagesLoaded = function() {
      this.trigger('loaded_images');
      this.checkLoaded();
    };

    //预加载精灵图
    AnimationItem.prototype.preloadSprite = function(cb) {
      var self = this;
      this.imagePreloader.setAssetsPath(this.assetsPath);
      this.imagePreloader.setPath(this.path);
      this.imagePreloader.loadAssetsFromSprite(
        this.animationData._sprite,
        this.animationData.assets,
        this._spriteSrc,
        function() {
          self.imagesLoaded();
          cb();
        }
      );
    };

    AnimationItem.prototype.configAnimation = function(animData) {
      if (!this.renderer) {
        return;
      }
      try {
        this.animationData = animData;
        this.totalFrames = Math.floor(
          this.animationData.op - this.animationData.ip
        );
        this.renderer.configAnimation(animData);
        if (!animData.assets) {
          animData.assets = [];
        }

        this.assets = this.animationData.assets;
        this.frameRate = this.animationData.fr;
        this.firstFrame = Math.round(this.animationData.ip);
        this.frameMult = this.animationData.fr / 1000;
        this.renderer.searchExtraCompositions(animData.assets);
        this.trigger('config_ready');
        var self = this;
        this.preloadSprite(function() {
          self.trigger('data_ready');
          self.timeCompleted = self.totalFrames;
          self.updaFrameModifier();
        });
      } catch (error) {
        console.warn(error);
      }
    };

    AnimationItem.prototype.checkLoaded = function() {
      if (
        !this.isLoaded &&
        (this.imagePreloader.loaded() ||
          this.renderer.rendererType !== 'canvas')
      ) {
        this.isLoaded = true;
        dataManager.completeData(
          this.animationData,
          this.renderer.globalData.fontManager
        );
        if (expressionsPlugin) {
          expressionsPlugin.initExpressions(this);
        }
        this.renderer.initItems();
        setTimeout(
          function() {
            this.trigger('DOMLoaded');
          }.bind(this),
          0
        );
        this.gotoFrame();
        if (this.autoplay) {
          this.play();
        }
      }
    };

    AnimationItem.prototype.gotoFrame = function() {
      this.currentFrame = this.subframeEnabled
        ? this.currentRawFrame
        : ~~this.currentRawFrame;

      if (
        this.timeCompleted !== this.totalFrames &&
        this.currentFrame > this.timeCompleted
      ) {
        this.currentFrame = this.timeCompleted;
      }
      this.trigger('enterFrame');
      this.renderFrame();
    };

    AnimationItem.prototype.renderFrame = function() {
      if (this.isLoaded === false) {
        return;
      }
      try {
        this.renderer.renderFrame(this.currentFrame + this.firstFrame);
      } catch (error) {
        this.triggerRenderFrameError(error);
      }
    };

    AnimationItem.prototype.play = function(name) {
      if (name && this.name != name) {
        return;
      }
      if (this.isPaused === true) {
        this.isPaused = false;
        if (this._idle) {
          this._idle = false;
          this.trigger('_active');
        }
      }
    };

    AnimationItem.prototype.pause = function(name) {
      if (name && this.name != name) {
        return;
      }
      if (this.isPaused === false) {
        this.isPaused = true;
        this._idle = true;
        this.trigger('_idle');
      }
    };

    AnimationItem.prototype.stop = function(name) {
      if (name && this.name != name) {
        return;
      }
      this.pause();
      this.playCount = 0;
      this._completedLoop = false;
      this.setCurrentRawFrameValue(0);
    };

    AnimationItem.prototype.goToAndPlay = function(value, isFrame, name) {
      this.goToAndStop(value, isFrame, name);
      this.play();
    };

    AnimationItem.prototype.advanceTime = function(value) {
      if (this.isPaused === true || this.isLoaded === false) {
        return;
      }
      var nextValue = this.currentRawFrame + value * this.frameModifier;
      var _isComplete = false;
      // Checking if nextValue > totalFrames - 1 for addressing non looping and looping animations.
      // If animation won't loop, it should stop at totalFrames - 1. If it will loop it should complete the last frame and then loop.
      if (nextValue >= this.totalFrames - 1 && this.frameModifier > 0) {
        if (!this.loop || this.playCount === this.loop) {
          _isComplete = true;
          nextValue = this.totalFrames - 1;
        } else if (nextValue >= this.totalFrames) {
          this.playCount += 1;
          this.setCurrentRawFrameValue(nextValue % this.totalFrames);
          this._completedLoop = true;
          this.trigger('loopComplete');
        } else {
          this.setCurrentRawFrameValue(nextValue);
        }
      } else if (nextValue < 0) {
        if (this.loop && !(this.playCount-- <= 0 && this.loop !== true)) {
          this.setCurrentRawFrameValue(
            this.totalFrames + (nextValue % this.totalFrames)
          );
          if (!this._completedLoop) {
            this._completedLoop = true;
          } else {
            this.trigger('loopComplete');
          }
        } else {
          _isComplete = true;
          nextValue = 0;
        }
      } else {
        this.setCurrentRawFrameValue(nextValue);
      }
      if (_isComplete) {
        this.setCurrentRawFrameValue(nextValue);
        this.pause();
        this.trigger('complete');
      }
    };

    AnimationItem.prototype.destroy = function(name) {
      if ((name && this.name != name) || !this.renderer) {
        return;
      }
      this.renderer.destroy();
      this.imagePreloader.destroy();
      this.trigger('destroy');
      this._cbs = null;
      this.onEnterFrame = this.onLoopComplete = this.onComplete = this.onSegmentStart = this.onDestroy = null;
      this.renderer = null;
    };

    AnimationItem.prototype.setCurrentRawFrameValue = function(value) {
      this.currentRawFrame = value;
      this.gotoFrame();
    };

    AnimationItem.prototype.updaFrameModifier = function() {
      this.frameModifier = this.frameMult * this.playSpeed * this.playDirection;
    };

    AnimationItem.prototype.getPath = function() {
      return this.path;
    };

    AnimationItem.prototype.getAssetData = function(id) {
      var i = 0,
        len = this.assets.length;
      while (i < len) {
        if (id == this.assets[i].id) {
          return this.assets[i];
        }
        i += 1;
      }
    };

    AnimationItem.prototype.hide = function() {
      this.renderer.hide();
    };

    AnimationItem.prototype.show = function() {
      this.renderer.show();
    };

    AnimationItem.prototype.getDuration = function(isFrame) {
      return isFrame ? this.totalFrames : this.totalFrames / this.frameRate;
    };

    AnimationItem.prototype.trigger = function(name) {
      if (this._cbs && this._cbs[name]) {
        switch (name) {
          case 'enterFrame':
            this.triggerEvent(
              name,
              new BMEnterFrameEvent(
                name,
                this.currentFrame,
                this.totalFrames,
                this.frameModifier
              )
            );
            break;
          case 'loopComplete':
            this.triggerEvent(
              name,
              new BMCompleteLoopEvent(
                name,
                this.loop,
                this.playCount,
                this.frameMult
              )
            );
            break;
          case 'complete':
            this.triggerEvent(name, new BMCompleteEvent(name, this.frameMult));
            break;
          case 'segmentStart':
            this.triggerEvent(
              name,
              new BMSegmentStartEvent(name, this.firstFrame, this.totalFrames)
            );
            break;
          case 'destroy':
            this.triggerEvent(name, new BMDestroyEvent(name, this));
            break;
          default:
            this.triggerEvent(name);
        }
      }
      if (name === 'enterFrame' && this.onEnterFrame) {
        this.onEnterFrame.call(
          this,
          new BMEnterFrameEvent(
            name,
            this.currentFrame,
            this.totalFrames,
            this.frameMult
          )
        );
      }
      if (name === 'loopComplete' && this.onLoopComplete) {
        this.onLoopComplete.call(
          this,
          new BMCompleteLoopEvent(
            name,
            this.loop,
            this.playCount,
            this.frameMult
          )
        );
      }
      if (name === 'complete' && this.onComplete) {
        this.onComplete.call(this, new BMCompleteEvent(name, this.frameMult));
      }
      if (name === 'segmentStart' && this.onSegmentStart) {
        this.onSegmentStart.call(
          this,
          new BMSegmentStartEvent(name, this.firstFrame, this.totalFrames)
        );
      }
      if (name === 'destroy' && this.onDestroy) {
        this.onDestroy.call(this, new BMDestroyEvent(name, this));
      }
    };

    AnimationItem.prototype.triggerRenderFrameError = function(nativeError) {
      var error = new BMRenderFrameErrorEvent(nativeError, this.currentFrame);
      this.triggerEvent('error', error);

      if (this.onError) {
        this.onError.call(this, error);
      }
    };

    var ProjectInterface = (function() {
      function registerComposition(comp) {
        this.compositions.push(comp);
      }

      return function() {
        function _thisProjectFunction(name) {
          var i = 0,
            len = this.compositions.length;
          while (i < len) {
            if (
              this.compositions[i].data &&
              this.compositions[i].data.nm === name
            ) {
              if (
                this.compositions[i].prepareFrame &&
                this.compositions[i].data.xt
              ) {
                this.compositions[i].prepareFrame(this.currentFrame);
              }
              return this.compositions[i].compInterface;
            }
            i += 1;
          }
        }

        _thisProjectFunction.compositions = [];
        _thisProjectFunction.currentFrame = 0;

        _thisProjectFunction.registerComposition = registerComposition;

        return _thisProjectFunction;
      };
    })();

    var lottiejs = {};

    var _isFrozen = false;

    function loadAnimation(params) {
      if (standalone === true) {
        params.animationData = JSON.parse(animationData);
      }
      return animationManager.loadAnimation(params);
    }

    lottiejs.play = animationManager.play;
    lottiejs.pause = animationManager.pause;
    lottiejs.togglePause = animationManager.togglePause;
    lottiejs.stop = animationManager.stop;
    lottiejs.loadAnimation = loadAnimation;
    lottiejs.resize = animationManager.resize;
    lottiejs.goToAndStop = animationManager.goToAndStop;
    lottiejs.destroy = animationManager.destroy;
    lottiejs.freeze = animationManager.freeze;
    lottiejs.unfreeze = animationManager.unfreeze;
    lottiejs.getRegisteredAnimations = animationManager.getRegisteredAnimations;
    lottiejs.version = '5.5.9';

    function checkReady() {
      if (document.readyState === 'complete') {
        clearInterval(readyStateCheckInterval);
        // searchAnimations();
      }
    }

    function getQueryVariable(variable) {
      var vars = queryString.split('&');
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
          return decodeURIComponent(pair[1]);
        }
      }
    }
    var standalone = '__[STANDALONE]__';
    var animationData = '__[ANIMATIONDATA]__';
    var renderer = '';
    if (standalone) {
      var scripts = document.getElementsByTagName('script');
      var index = scripts.length - 1;
      var myScript = scripts[index] || {
        src: ''
      };
      var queryString = myScript.src.replace(/^[^\?]+\??/, '');
      renderer = getQueryVariable('renderer');
    }
    var readyStateCheckInterval = setInterval(checkReady, 100);
    return lottiejs;
  });
