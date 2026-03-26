'use strict';

function ts() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:`
         + `${String(d.getMinutes()).padStart(2,'0')}:`
         + `${String(d.getSeconds()).padStart(2,'0')}`;
}

function log(msg, style = '') {
    const log_el = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${style}`;
    entry.innerHTML = `<span class="ts">[${ts()}]</span> <span class="msg">${msg}</span>`;
    log_el.appendChild(entry);
    log_el.scrollTop = log_el.scrollHeight;
}

function set_init_dot(color) {
    const dot = document.getElementById('init-dot');
    dot.className = `dot ${color}`;
}

function set_service_dot(color) {
    const dot = document.getElementById('service-dot');
    dot.className = `dot ${color}`;
}

function enable_buttons() {
    ['btn-fix', 'btn-get-uuid',
     'btn-show-consent', 'btn-is-supported', 'btn-get-status',
     'btn-get-tracking-id', 'btn-consent-customizer',
     'btn-customizer-show-consent'].forEach(id => {
        document.getElementById(id).disabled = false;
    });
    document.getElementById('toggle-web-indexing').disabled = false;
}

function update_uuid_display(uuid) {
    document.getElementById('uuid-display').textContent = `UUID: ${uuid || '—'}`;
}

function update_tracking_id_display(tracking_id) {
    document.getElementById('tracking-id-display').textContent =
        `Tracking ID: ${tracking_id || '—'}`;
}

function update_web_indexing_toggle(opt_in) {
    const el = document.getElementById('toggle-web-indexing');
    el.checked = !!opt_in;
}

function update_service_status(name) {
    document.getElementById('service-status').textContent =
        `Service: ${name || 'unknown'}`;
    const running = name === 'Running' || name === 'Connected' || name === 'Peer';
    set_service_dot(running ? 'green' : name ? 'yellow' : 'grey');
}

function update_consent_status(opt_in) {
    const el  = document.getElementById('consent-status');
    const dot = document.getElementById('consent-dot');
    if (opt_in === null || opt_in === undefined) {
        el.textContent = 'Consent: not set';
        dot.className  = 'dot grey';
    } else if (opt_in) {
        el.textContent = 'Consent: opted in';
        dot.className  = 'dot green';
    } else {
        el.textContent = 'Consent: opted out';
        dot.className  = 'dot red';
    }
}

window.sdkApi.on_ready(() => {
    document.getElementById('sdk-init-status').textContent = 'SDK ready';
    set_init_dot('green');
    enable_buttons();
    log('SDK initialised successfully', 'ok');

    window.sdkApi.get_status().then(s => {
        update_service_status(s.status_name);
        update_consent_status(s.opt_in);
        update_web_indexing_toggle(s.opt_in);
        log(`opt_in=${s.opt_in}, status=${s.status_name}`);
    });

    window.sdkApi.get_uuid().then(res => {
        if (res.ok)
            update_uuid_display(res.uuid);
    });

    window.sdkApi.get_tracking_id().then(res => {
        if (res.ok)
            update_tracking_id_display(res.tracking_id);
    });
});

window.sdkApi.on_init_error(msg => {
    document.getElementById('sdk-init-status').textContent = `Init error: ${msg}`;
    set_init_dot('red');
    log(`Init error: ${msg}`, 'err');
    enable_buttons();
});

window.sdkApi.on_status_change(({ code, name }) => {
    update_service_status(name);
    log(`status_change → ${name} (${code})`);
});

window.sdkApi.on_choice_change(({ code, name }) => {
    const opt_in = name === 'Agree';
    update_consent_status(opt_in);
    update_web_indexing_toggle(opt_in);
    log(`choice_change → ${name} (${code})`);
});

window.sdkApi.on_dialog_shown(() => {
    log('Consent dialog shown');
});

window.sdkApi.on_dialog_closed(() => {
    log('Consent dialog closed');
});

document.getElementById('btn-fix').addEventListener('click', async () => {
    log('Calling fix_sdk()…');
    const res = await window.sdkApi.fix_sdk();
    if (res.ok)
        log('fix_sdk() completed', 'ok');
    else
        log(`fix_sdk() error: ${res.error}`, 'err');
});

document.getElementById('btn-get-uuid').addEventListener('click', async () => {
    const res = await window.sdkApi.get_uuid();
    if (res.ok) {
        update_uuid_display(res.uuid);
        log(`get_uuid() → ${res.uuid}`, 'ok');
    } else {
        log(`get_uuid() error: ${res.error}`, 'err');
    }
});

document.getElementById('btn-show-consent').addEventListener('click', async () => {
    log('Calling show_consent()…');
    const res = await window.sdkApi.show_consent();
    if (res.ok) log('show_consent() called', 'ok');
    else        log(`show_consent() error: ${res.error}`, 'err');
});

document.getElementById('btn-is-supported').addEventListener('click', async () => {
    const res = await window.sdkApi.is_supported();
    if (res.ok) log(`is_supported() → ${res.supported}`, res.supported ? 'ok' : 'err');
    else        log(`is_supported() error: ${res.error}`, 'err');
});

document.getElementById('btn-get-status').addEventListener('click', async () => {
    const s = await window.sdkApi.get_status();
    update_service_status(s.status_name);
    update_consent_status(s.opt_in);
    update_web_indexing_toggle(s.opt_in);
    log(`get_status() → status=${s.status_name}, opt_in=${s.opt_in}`, s.opt_in ? 'ok' : 'err');
});

document.getElementById('btn-get-tracking-id').addEventListener('click', async () => {
    const res = await window.sdkApi.get_tracking_id();
    if (res.ok) {
        update_tracking_id_display(res.tracking_id);
        log(`get_tracking_id() → ${res.tracking_id}`, 'ok');
    } else {
        log(`get_tracking_id() error: ${res.error}`, 'err');
    }
});

document.getElementById('toggle-web-indexing').addEventListener('change', async function() {
    this.checked = !this.checked;
    if (!this.checked) {
        log('Web Indexing: calling show_consent()…');
        const res = await window.sdkApi.show_consent();
        if (!res.ok) log(`show_consent() error: ${res.error}`, 'err');
    } else {
        log('Web Indexing: calling opt_out()…');
        const res = await window.sdkApi.opt_out();
        if (!res.ok) log(`opt_out() error: ${res.error}`, 'err');
    }
});

document.getElementById('toggle-dev-mode').addEventListener('change', function() {
    const visible = this.checked;
    document.getElementById('actions').style.display                   = visible ? 'block' : 'none';
    document.getElementById('log-card').style.display                  = visible ? 'block' : 'none';
    document.getElementById('setting-consent-customizer').style.display = visible ? 'flex'  : 'none';
});

function rgb_to_argb(hex) {
    const r = hex.slice(1, 3).toUpperCase();
    const g = hex.slice(3, 5).toUpperCase();
    const b = hex.slice(5, 7).toUpperCase();
    return `#FF${r}${g}${b}`;
}

const MAIN_SECTIONS = ['status-card', 'settings', 'actions', 'log-card'];

function show_customizer() {
    MAIN_SECTIONS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dataset.prevDisplay = el.style.display;
        if (el) el.style.display = 'none';
    });
    document.getElementById('customizer-screen').style.display = 'block';
    document.querySelector('h1').style.display = 'none';
}

function hide_customizer() {
    document.getElementById('customizer-screen').style.display = 'none';
    document.querySelector('h1').style.display = '';
    MAIN_SECTIONS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = el.dataset.prevDisplay || '';
    });
}

document.getElementById('btn-consent-customizer').addEventListener('click', show_customizer);
document.getElementById('btn-customizer-back').addEventListener('click', hide_customizer);

document.getElementById('btn-customizer-show-consent').addEventListener('click', async () => {
    log('Calling show_consent()…');
    const res = await window.sdkApi.show_consent();
    if (res.ok) log('show_consent() called', 'ok');
    else        log(`show_consent() error: ${res.error}`, 'err');
});

const COLOR_FIELDS = [
    { field: 'consent_txt_color',             input: 'input-txt-color',       hex: 'hex-txt-color',       api: 'set_consent_txt_color' },
    { field: 'consent_app_name_color',        input: 'input-app-name-color',  hex: 'hex-app-name-color',  api: 'set_consent_app_name_color' },
    { field: 'consent_bg_color',              input: 'input-bg-color',        hex: 'hex-bg-color',        api: 'set_consent_bg_color' },
    { field: 'consent_btn_color',             input: 'input-btn-color',       hex: 'hex-btn-color',       api: 'set_consent_btn_color' },
];

COLOR_FIELDS.forEach(({ input, hex }) => {
    document.getElementById(input).addEventListener('input', function() {
        document.getElementById(hex).textContent = rgb_to_argb(this.value);
    });
});

document.querySelectorAll('.customizer-apply').forEach(btn => {
    btn.addEventListener('click', async function() {
        const field = this.dataset.field;

        if (field === 'benefit_txt') {
            const val = document.getElementById('input-benefit-txt').value.trim();
            if (!val) { log('Benefit text is empty', 'err'); return; }
            const res = await window.sdkApi.set_benefit_txt(val);
            if (res.ok) log(`set_benefit_txt() → "${val}"`, 'ok');
            else        log(`set_benefit_txt() error: ${res.error}`, 'err');
            return;
        }

        if (field === 'lang') {
            const val = document.getElementById('select-lang').value;
            const res = await window.sdkApi.set_lang(val);
            if (res.ok) log(`set_lang() → "${val}"`, 'ok');
            else        log(`set_lang() error: ${res.error}`, 'err');
            return;
        }

        const cf = COLOR_FIELDS.find(f => f.field === field);
        if (!cf) return;
        const argb = rgb_to_argb(document.getElementById(cf.input).value);
        const res  = await window.sdkApi[cf.api](argb);
        if (res.ok) log(`${cf.api}() → ${argb}`, 'ok');
        else        log(`${cf.api}() error: ${res.error}`, 'err');
    });
});

