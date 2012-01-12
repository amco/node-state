(function() {
  var EventEmitter2, NodeState,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  EventEmitter2 = require('eventemitter2').EventEmitter2;

  NodeState = (function() {

    function NodeState(config) {
      var event, events, fn, from_state, state, state_name, to, to_states, _base, _base2, _base3, _ref, _ref2, _ref3;
      this.config = config != null ? config : {};
      this.stop = __bind(this.stop, this);
      this.start = __bind(this.start, this);
      this.unwait = __bind(this.unwait, this);
      this.wait = __bind(this.wait, this);
      this.raise = __bind(this.raise, this);
      this.goto = __bind(this.goto, this);
      this._notifier = new EventEmitter2({
        wildcard: true
      });
      _ref = this.states;
      for (state in _ref) {
        events = _ref[state];
        for (event in events) {
          fn = events[event];
          this.states[state][event] = fn.bind(this);
        }
      }
      _ref2 = this.transitions;
      for (from_state in _ref2) {
        to_states = _ref2[from_state];
        for (to in to_states) {
          fn = to_states[to];
          this.transitions[from_state][to] = fn.bind(this);
        }
      }
      (_base = this.config).initial_state || (_base.initial_state = ((function() {
        var _results;
        _results = [];
        for (state_name in this.states) {
          _results.push(state_name);
        }
        return _results;
      }).call(this))[0]);
      this.current_state_name = this.config.initial_state;
      this.current_state = this.states[this.current_state_name];
      this.current_data = this.config.initial_data || {};
      this._current_timeout = null;
      (_base2 = this.config).autostart || (_base2.autostart = false);
      _ref3 = this.states;
      for (state_name in _ref3) {
        events = _ref3[state_name];
        (_base3 = this.states[state_name])['Enter'] || (_base3['Enter'] = function(data) {
          return this.current_data = data;
        });
      }
      if (this.config.autostart) this.goto(this.current_state_name);
    }

    NodeState.prototype.goto = function(state_name, data) {
      var callback, event_name, previous_state_name, transition, _ref, _ref2,
        _this = this;
      this.current_data = data || this.current_data;
      previous_state_name = this.current_state_name;
      if (this._current_timeout) clearTimeout(this._current_timeout);
      _ref = this.current_state;
      for (event_name in _ref) {
        callback = _ref[event_name];
        this._notifier.removeListener(event_name, callback);
      }
      this.current_state_name = state_name;
      this.current_state = this.states[this.current_state_name];
      _ref2 = this.current_state;
      for (event_name in _ref2) {
        callback = _ref2[event_name];
        this._notifier.on(event_name, callback);
      }
      callback = function(data) {
        _this.current_data = data;
        return _this._notifier.emit('Enter', _this.current_data);
      };
      transition = function(data, cb) {
        return cb(data);
      };
      if (this.transitions[previous_state_name] && this.transitions[previous_state_name][state_name]) {
        transition = this.transitions[previous_state_name][state_name];
      } else if (this.transitions['*'] && this.transitions['*'][state_name]) {
        transition = this.transitions['*'][state_name];
      } else if (this.transitions[previous_state_name] && this.transitions[previous_state_name]['*']) {
        transition = this.transitions[previous_state_name]['*'];
      } else if (this.transitions['*'] && this.transitions['*']['*']) {
        transition = this.transitions['*']['*'];
      }
      return transition(this.current_data, callback);
    };

    NodeState.prototype.states = {};

    NodeState.prototype.transitions = {};

    NodeState.prototype.raise = function(event_name, data) {
      return this._notifier.emit(event_name, data);
    };

    NodeState.prototype.wait = function(milliseconds) {
      var _this = this;
      return this._current_timeout = setTimeout((function() {
        return _this._notifier.emit('WaitTimeout', milliseconds, _this.current_data);
      }), milliseconds);
    };

    NodeState.prototype.unwait = function() {
      if (this._current_timeout) return clearTimeout(this._current_timeout);
    };

    NodeState.prototype.start = function(data) {
      this.current_data || (this.current_data = data);
      return this.goto(this.current_state_name);
    };

    NodeState.prototype.stop = function() {
      return this._notifier.removeAllListeners();
    };

    return NodeState;

  })();

  module.exports = NodeState;

}).call(this);