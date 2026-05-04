'use strict';

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { init_ipc, emit } = require('./src/ipc');
const brd_sdk = require('brd-sdk');
const win_ref = require('./src/window');

process.on('uncaughtException', err => console.error('[uncaughtException]', err.stack || err));
process.on('unhandledRejection', err => console.error('[unhandledRejection]', err));

function createWindow() {
    win_ref.main_win = new BrowserWindow({
        width: 720,
        height: 680,
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, 'src', 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    win_ref.main_win.loadFile(path.join(__dirname, 'index.html'));
    win_ref.main_win.webContents.on('did-fail-load', (_e, code, desc) =>
        console.error('did-fail-load', code, desc));
    win_ref.main_win.on('closed', () => { win_ref.main_win = null; });
}

async function init_sdk() {
    try {
        await brd_sdk.init(
            'win_brightdata.electron_sample_app',
            {
                app_path:     app.isPackaged
                                ? path.join(path.dirname(app.getPath('exe')), 'resources')
                                : path.join(__dirname, 'brd_sdk_dist'),
                app_name:     'BRD SDK Sample App',
                logo_link:    'https://brightdata.com/logo.png',
                skip_consent: false,
            }
        );

        init_ipc();

        emit('sdk:ready');
    } catch(err) {
        emit('sdk:init_error', err.message);
    }
}

app.whenReady().then(() => {
    createWindow();
    win_ref.main_win.webContents.once('did-finish-load', () => {
        init_sdk();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
