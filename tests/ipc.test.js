'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire').noCallThru();

// ─── Shared stub factory ──────────────────────────────────────────────────────

function make_sdk_stub(overrides = {}) {
    return {
        fix_sdk:                   () => {},
        get_uuid:                  () => 'test-uuid',
        get_status_name:           () => 'Running',
        get_opt_in:                () => true,
        show_consent:              () => {},
        opt_out:                   () => {},
        opt_in:                    () => {},
        close:                     () => {},
        is_supported:              () => true,
        get_tracking_id:           () => 'track-123',
        set_benefit_txt:           () => {},
        set_consent_txt_color:     () => {},
        set_consent_app_name_color:() => {},
        set_consent_bg_color:      () => {},
        set_consent_btn_color:     () => {},
        set_lang:                  () => {},
        on:                        () => {},
        ...overrides,
    };
}

function load_api(sdk_stub) {
    const mod = proxyquire('../src/ipc', {
        'brd-sdk':   sdk_stub,
        'electron':  { ipcMain: { handle: () => {} } },
        './window':  { main_win: null },
    });
    return mod.api;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ipc.api', () => {
    describe('fix_sdk', () => {
        it('returns { ok: true }', () => {
            const api = load_api(make_sdk_stub());
            assert.deepStrictEqual(api.fix_sdk(), { ok: true });
        });
    });

    describe('get_uuid', () => {
        it('returns { ok: true, uuid }', () => {
            const api = load_api(make_sdk_stub({ get_uuid: () => 'abc-123' }));
            assert.deepStrictEqual(api.get_uuid(), { ok: true, uuid: 'abc-123' });
        });
    });

    describe('get_status', () => {
        it('returns status_name and opt_in', () => {
            const api = load_api(make_sdk_stub({
                get_status_name: () => 'Connected',
                get_opt_in:      () => false,
            }));
            assert.deepStrictEqual(api.get_status(), { status_name: 'Connected', opt_in: false });
        });
    });

    describe('show_consent', () => {
        it('calls brd_sdk.show_consent and returns { ok: true }', () => {
            let called = false;
            const api = load_api(make_sdk_stub({ show_consent: () => { called = true; } }));
            assert.deepStrictEqual(api.show_consent(), { ok: true });
            assert.ok(called, 'show_consent was not called on the sdk');
        });
    });

    describe('opt_out', () => {
        it('calls brd_sdk.opt_out and returns { ok: true }', () => {
            let called = false;
            const api = load_api(make_sdk_stub({ opt_out: () => { called = true; } }));
            assert.deepStrictEqual(api.opt_out(), { ok: true });
            assert.ok(called);
        });
    });

    describe('opt_in', () => {
        it('calls brd_sdk.opt_in and returns { ok: true }', () => {
            let called = false;
            const api = load_api(make_sdk_stub({ opt_in: () => { called = true; } }));
            assert.deepStrictEqual(api.opt_in(), { ok: true });
            assert.ok(called);
        });
    });

    describe('close', () => {
        it('calls brd_sdk.close and returns { ok: true }', () => {
            let called = false;
            const api = load_api(make_sdk_stub({ close: () => { called = true; } }));
            assert.deepStrictEqual(api.close(), { ok: true });
            assert.ok(called);
        });
    });

    describe('is_supported', () => {
        it('returns { ok: true, supported: true } when sdk returns true', () => {
            const api = load_api(make_sdk_stub({ is_supported: () => true }));
            assert.deepStrictEqual(api.is_supported(), { ok: true, supported: true });
        });

        it('returns { ok: true, supported: false } when sdk returns false', () => {
            const api = load_api(make_sdk_stub({ is_supported: () => false }));
            assert.deepStrictEqual(api.is_supported(), { ok: true, supported: false });
        });
    });

    describe('get_tracking_id', () => {
        it('returns { ok: true, tracking_id }', () => {
            const api = load_api(make_sdk_stub({ get_tracking_id: () => 'tid-999' }));
            assert.deepStrictEqual(api.get_tracking_id(), { ok: true, tracking_id: 'tid-999' });
        });
    });

    describe('set_benefit_txt', () => {
        it('passes value to sdk and returns { ok: true }', () => {
            let received
            const api = load_api(make_sdk_stub({ set_benefit_txt: v => { received = v; } }));
            assert.deepStrictEqual(api.set_benefit_txt(null, 'hello'), { ok: true });
            assert.strictEqual(received, 'hello');
        });
    });

    describe('set_consent_txt_color', () => {
        it('passes value to sdk and returns { ok: true }', () => {
            let received
            const api = load_api(make_sdk_stub({ set_consent_txt_color: v => { received = v; } }));
            assert.deepStrictEqual(api.set_consent_txt_color(null, '#FF112233'), { ok: true });
            assert.strictEqual(received, '#FF112233');
        });
    });

    describe('set_lang', () => {
        it('passes value to sdk and returns { ok: true }', () => {
            let received
            const api = load_api(make_sdk_stub({ set_lang: v => { received = v; } }));
            assert.deepStrictEqual(api.set_lang(null, 'fr'), { ok: true });
            assert.strictEqual(received, 'fr');
        });
    });

    describe('error propagation via init_ipc handler wrapper', () => {
        it('wraps a throwing handler in { ok: false, error }', () => {
            const ipc_handlers = {};
            const mod = proxyquire('../src/ipc', {
                'brd-sdk': make_sdk_stub({ get_uuid: () => { throw new Error('boom'); } }),
                'electron': {
                    ipcMain: {
                        handle: (channel, fn) => { ipc_handlers[channel] = fn; },
                    },
                },
                './window': { main_win: null },
            });
            mod.init_ipc();
            const result = ipc_handlers['sdk:get_uuid']();
            assert.deepStrictEqual(result, { ok: false, error: 'boom' });
        });
    });
});
