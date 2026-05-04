'use strict';
const { contextBridge, ipcRenderer } = require('electron');

try {
    contextBridge.exposeInMainWorld('sdkApi', {
        fix_sdk:      ()     => ipcRenderer.invoke('sdk:fix_sdk'),
        get_uuid:     ()     => ipcRenderer.invoke('sdk:get_uuid'),
        get_status:   ()     => ipcRenderer.invoke('sdk:get_status'),
        show_consent:    ()     => ipcRenderer.invoke('sdk:show_consent'),
        opt_out:         ()     => ipcRenderer.invoke('sdk:opt_out'),
        opt_in:          ()     => ipcRenderer.invoke('sdk:opt_in'),
        close:           ()     => ipcRenderer.invoke('sdk:close'),
        is_supported:    ()     => ipcRenderer.invoke('sdk:is_supported'),
        get_tracking_id: ()     => ipcRenderer.invoke('sdk:get_tracking_id'),
        set_benefit_txt:                   (v) => ipcRenderer.invoke('sdk:set_benefit_txt', v),
        set_consent_txt_color:             (v) => ipcRenderer.invoke('sdk:set_consent_txt_color', v),
        set_consent_app_name_color:        (v) => ipcRenderer.invoke('sdk:set_consent_app_name_color', v),
        set_consent_bg_color:              (v) => ipcRenderer.invoke('sdk:set_consent_bg_color', v),
        set_consent_btn_color:             (v) => ipcRenderer.invoke('sdk:set_consent_btn_color', v),
        set_lang:                          (v) => ipcRenderer.invoke('sdk:set_lang', v),
        on_ready:        (cb) => ipcRenderer.on('sdk:ready',        ()         => cb()),
        on_init_error:   (cb) => ipcRenderer.on('sdk:init_error',   (_e, msg)  => cb(msg)),
        on_status_change:(cb) => ipcRenderer.on('sdk:status_change',(_e, data) => cb(data)),
        on_choice_change:(cb) => ipcRenderer.on('sdk:choice_change',(_e, data) => cb(data)),
        on_dialog_shown: (cb) => ipcRenderer.on('sdk:dialog_shown', ()         => cb()),
        on_dialog_closed:(cb) => ipcRenderer.on('sdk:dialog_closed',()         => cb()),
    });
} catch(e) {
    console.error(e);
}
