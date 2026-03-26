'use strict';

let _main_win = null;

module.exports = {
    get main_win() { return _main_win; },
    set main_win(win) { _main_win = win; },
};
