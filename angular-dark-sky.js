/**
 * angular-dark-sky
 *
 * A simple & configurable provider for the Dark Sky API including icon directive using weather-icons
 *
 * @link https://github.com/deanbot/angular-dark-sky
 * @see {@link https://darksky.net/dev/}
 * @see {@link https://darksky.net/dev/docs/|Docs}
 * @see {@link http://erikflowers.github.io/weather-icons|weather-icons}
 * @author Dean Verleger <deanverleger@gmail.com>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function () {
  'use strict';

  angular.module('dark-sky', [])
    .provider('darkSky', darkSkyProvider)
    .directive('darkSkyIcon', ['darkSky', darkSkyIcon]);

  /**
   * Dark Sky weather data provider
   */
  function darkSkyProvider() {
    var apiKey,
      config = {
        baseUri: 'https://api.darksky.net/forecast/',
        baseExclude: '&exclude=',
        acceptedUnits: ['auto', 'ca', 'uk2', 'us', 'si'],
        acceptedLanguage: [
          'ar', 'az', 'be', 'bs', 'cs', 'de', 'el', 'en', 'es', 'fr', 'hr', 'hu', 'id', 'it', 'is', 'kw', 'nb', 'nl', 'pl', 'pt', 'ru', 'sk', 'sr', 'sv', 'tet', 'tr', 'uk', 'x-pig-latin', 'zh', 'zh-tw'
        ]
      },
      units = 'us', // default unit
      language = 'en'; // default language

    /**
     * Set API key for request
     * @param {String} value - your Dark Sky API key
     */
    this.setApiKey = function (value) {
      apiKey = value;
      return this;
    };

    /**
     * Set unit type for response formatting
     * @param {String} value - unit token
     */
    this.setUnits = function (value) {
      if (config.acceptedUnits.indexOf(value) === -1) {
        console.warn(value + ' not an accepted API unit.');
      }
      units = value;
      return this;
    };

    /**
     * Set language for response summaries
     * @param {String} value - language token
     */
    this.setLanguage = function (value) {
      if (config.acceptedLanguage.indexOf(value) === -1) {
        console.warn(value + ' not an accepted API language.');
      }
      language = value;
      return this;
    };

    /**
     * Service definition
     */
    this.$get = ['$http', '$q', function ($http, $q) {
      var service = {
        getCurrent: getCurrent,
        getForecast: getForecastDaily,
        getDailyForecast: getForecastDaily,
        getHourlyForecast: getForecastHourly,
        getMinutelyForecast: getForecastMinutely,
        getAlerts: getAlerts,
        getFlags: getFlags,
        getUnits: getUnits
      };
      if (!apiKey) {
        console.warn('No Dark Sky API key set.');
      }
      return service;

      /** Public Methods */

      /**
       * Get current weather data
       * @param {number} latitude position
       * @param {number} longitude position
       * @param {object} [options] - additional query options
       * ... {unix timestamp} options.time - send timestamp for timemachine requests
       * @returns {promise} - resolves with current weather data object
       */
      function getCurrent(latitude, longitude, options) {
        return api(latitude, longitude, options).current();
      }

      /**
       * Get daily weather data
       * @param {number} latitude positition
       * @param {number} longitude positition
       * @param {object} [options] - additional query options
       * ... {unix timestamp} options.time - send timestamp for timemachine requests
       * ... {boolean} options.extend - pass true for extended forecast 
       * @returns {promise} - resolves with daily weather data object
       */
      function getForecastDaily(latitude, longitude, options) {
        return api(latitude, longitude, options).daily();
      }

      /**
       * Get hourly weather data
       * @param {number} latitude positition
       * @param {number} longitude positition
       * @param {object} [options] - additional query options
       * ... {unix timestamp} options.time - send timestamp for timemachine requests
       * ... {boolean} options.extend - pass true for extended forecast 
       * @returns {promise} - resolves with hourly weather data object
       */
      function getForecastHourly(latitude, longitude, options) {
        return api(latitude, longitude, options).hourly();
      }

      /**
       * Get minutely weather data
       * @param {number} latitude positition
       * @param {number} longitude positition
       * @param {object} [options] - additional query options
       * ... {unix timestamp} options.time - send timestamp for timemachine requests
       * ... {boolean} options.extend - pass true for extended forecast 
       * @returns {promise} - resolves with minutely weather data object
       */
      function getForecastMinutely(latitude, longitude, options) {
        return api(latitude, longitude, options).minutely();
      }

      /**
       * Get alerts weather data
       * @param {number} latitude positition
       * @param {number} longitude positition
       * @param {object} [options] - additional query options
       * ... {unix timestamp} options.time - send timestamp for timemachine requests
       * ... {boolean} options.extend - pass true for extended forecast 
       * @returns {promise} - resolves with alerts weather data object
       */
      function getAlerts(latitude, longitude, options) {
        return api(latitude, longitude, options).alerts();
      }

      /**
       * Get flags weather data
       * @param {number} latitude positition
       * @param {number} longitude positition
       * @param {object} [options] - additional query options
       * ... {unix timestamp} options.time - send timestamp for timemachine requests
       * ... {boolean} options.extend - pass true for extended forecast 
       * @returns {promise} - resolves with flags weather data object
       */
      function getFlags(latitude, longitude, options) {
        return api(latitude, longitude, options).flags();
      }

      /**
       * Get units object showing units returned based on configured language/units
       * @returns {object} units
       */
      function getUnits() {
        var unitsObject,
          // per API defualt assume 'us' if omitted 
          unitId = 'us';

        // determine unit id
        if (units) {
          if (units === 'auto') {
            console.warn('Can\'t guess units. Defaulting to Imperial');
            unitId = 'us';
          } else {
            unitId = units;
          }
        }

        // get units object by id
        switch (unitId) {
          case 'ca':
            unitsObject = getCaUnits();
            break;
          case 'uk2':
            unitsObject = getUk2Units();
            break;
          case 'us':
            unitsObject = getUsUnits();
            break;
          case 'si':
            unitsObject = getSiUnits();
            break;
        }
        return unitsObject;
      }

      /** Private Methods */

      /**
       * Expose API methods with latitude and longitude mapping
       * @param {number} latitude
       * @param {number} longitude
       * @param {object} options
       * @returns {oObject} - object with API method properties
       */
      function api(latitude, longitude, options) {
        var time;

        // check for time option
        if (options && options.time) {
          time = options.time;
        }
        return {
          current: function () {
            var query = excludeString('currently') + optionsString(options);
            return fetch(latitude, longitude, query, time);
          },
          daily: function () {
            var query = excludeString('daily') + optionsString(options);
            return fetch(latitude, longitude, query, time);
          },
          hourly: function () {
            var query = excludeString('hourly') + optionsString(options);
            return fetch(latitude, longitude, query, time);
          },
          minutely: function () {
            var query = excludeString('minutely') + optionsString(options);
            return fetch(latitude, longitude, query, time);
          },
          alerts: function () {
            var query = excludeString('alerts') + optionsString(options);
            return fetch(latitude, longitude, query, time);
          },
          flags: function () {
            var query = excludeString('flags') + optionsString(options);
            return fetch(latitude, longitude, query, time);
          }
        };
      }

      /**
       * Get exclude items by excluding all items except what is passed in
       * @param {string} toRetrieve - single block to include in results
       * @returns {string} - exclude query string with base excludes and your excludes
       */
      function excludeString(toRetrieve) {
        var query,
          blocks = ['alerts', 'currently', 'daily', 'flags', 'hourly', 'minutely'],
          includeIndex = blocks.indexOf(toRetrieve);
        blocks.splice(includeIndex, 1);
        query = blocks.join(',');
        return config.baseExclude + query;
      }

      /**
       * Get query string for additional API options
       * @param {object} options
       * @returns {string} additional options query string
       */
      function optionsString(options) {
        var defaults = {
          extend: false
        },
          atts = extend({}, defaults, options),
          query = '';
        if (options) {
          // parse extend option
          if (atts.extend) {
            query += '&extend=hourly';
          }
        }
        return query;
      }

      function extend(out) {
        out = out || {};
        for (var i = 1; i < arguments.length; i++) {
          if (!arguments[i]) {
            continue;
          }
          for (var key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key)) {
              out[key] = arguments[i][key];
            }
          }
        }
        return out;
      }

      /**
       * Perform http jsonp request for weather data
       * @param {number} latitude - position latitude
       * @param {number} longitude - position longitude
       * @param {string} query - additional request params query string
       * @param {number} time - timestamp for timemachine requests
       * @returns {promise} - resolves to weather data object
       */
      function fetch(latitude, longitude, query, time) {
        if (!latitude || !longitude) {
          console.warn("no latitude or longitude sent to weather api");
        }
        var time = time ? ', ' + time : '',
          url = [config.baseUri, apiKey, '/', latitude, ',', longitude, time, '?units=', units, '&lang=', language, query].join('');
        return $http
          .jsonp(url)
          .then(function (results) {
            // check response code
            if (parseInt(results.status) === 200) {
              return results.data;
            } else {
              return $q.reject(results);
            }
          })
          .catch(function (data, status, headers, config) {
            return $q.reject(status);
          });
      }

      /**
       * Return the us response units
       * @returns {object} units
       */
      function getUsUnits() {
        return {
          nearestStormDistance: 'mi',
          precipIntensity: 'in/h',
          precipIntensityMax: 'in/h',
          precipAccumulation: 'in',
          temperature: 'f',
          temperatureMin: 'f',
          temperatureMax: 'f',
          apparentTemperature: 'f',
          dewPoint: 'f',
          windSpeed: 'mph',
          pressure: 'mbar',
          visibility: 'mi'
        };
      }

      /**
       * Return the si response units
       * @returns {object} units
       */
      function getSiUnits() {
        return {
          nearestStormDistance: 'km',
          precipIntensity: 'mm/h',
          precipIntensityMax: 'mm/h',
          precipAccumulation: 'cm',
          temperature: 'c',
          temperatureMin: 'c',
          temperatureMax: 'c',
          apparentTemperature: 'c',
          dewPoint: 'c',
          windSpeed: 'mps',
          pressure: 'hPa',
          visibility: 'km'
        };
      }

      /** 
       * Return ca response units
       * @returns {object} units
       */
      function getCaUnits() {
        var unitsObject = getUsUnits();
        unitsObject.windSpeed = 'km/h';
        return unitsObject;
      }

      /**
       * Return uk2 response units
       * @returns {object} units
       */
      function getUk2Units() {
        var unitsObject = getSiUnits();
        unitsObject.nearestStormDistance = unitsObject.visibility = 'mi';
        unitsObject.windSpeed = 'mph';
        return unitsObject;
      }

    }];
  }

  /**
   * Dark Sky weather-icons directive
   * @example <dark-sky-icon icon="{{ icon }}"></dark-sky-icon>
   * @see {@link http://erikflowers.github.io/weather-icons}
   */
  function darkSkyIcon(darkSky) {
    return {
      restrict: 'E',
      scope: {
        icon: '@'
      },
      template: '<i class="wi wi-forecast-io-{{ icon }} wi-dark-sky-{{ icon }}"></i>'
    };
  }

})();
