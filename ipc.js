'use strict';

const { ipcMain } = require('electron');
const brd_sdk = require('brd-sdk');
const win_ref = require('./window');

const emit = (channel, ...args) => {
    if (win_ref.main_win && !win_ref.main_win.isDestroyed())
        win_ref.main_win.webContents.send(channel, ...args);
};

const api = {
    fix_sdk: () => {
        brd_sdk.fix_sdk();
        return { ok: true };
    },
    get_uuid: () => ({ ok: true, uuid: brd_sdk.get_uuid() }),
    get_status: () => ({
        status_name: brd_sdk.get_status_name(),
        opt_in:      brd_sdk.get_opt_in(),
    }),
    show_consent: () => {
        brd_sdk.show_consent();
        return { ok: true };
    },
    opt_out: () => {
        brd_sdk.opt_out();
        return { ok: true };
    },
    is_supported: () => ({ ok: true, supported: brd_sdk.is_supported() }),
    get_tracking_id: () => ({ ok: true, tracking_id: brd_sdk.get_tracking_id() }),
    set_benefit_txt:                   (_e, val) => { brd_sdk.set_benefit_txt(val);                   return { ok: true }; },
    set_consent_txt_color:             (_e, val) => { brd_sdk.set_consent_txt_color(val);             return { ok: true }; },
    set_consent_app_name_color:        (_e, val) => { brd_sdk.set_consent_app_name_color(val);        return { ok: true }; },
    set_consent_bg_color:              (_e, val) => { brd_sdk.set_consent_bg_color(val);              return { ok: true }; },
    set_consent_btn_color:             (_e, val) => { brd_sdk.set_consent_btn_color(val);             return { ok: true }; },
    set_lang:                          (_e, val) => { brd_sdk.set_lang(val);                          return { ok: true }; },
};

const init_ipc = () => {
    for (const [key, fn] of Object.entries(api))
        ipcMain.handle(`sdk:${key}`, (...args) => { try { return fn(...args); } catch(err) { return { ok: false, error: err.message }; } });

    brd_sdk.on('status_change', (code, name) => emit('sdk:status_change', { code, name }));
    brd_sdk.on('choice_change', (code, name) => emit('sdk:choice_change', { code, name }));
    brd_sdk.on('dialog_shown',  ()           => emit('sdk:dialog_shown'));
    brd_sdk.on('dialog_closed', ()           => emit('sdk:dialog_closed'));
};

module.exports = { init_ipc, emit };
