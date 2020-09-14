
import Modal from './modal';
import Client from './client';
import Selection from './selection';
import RowEvent from './event/row';
import Apps from './apps';
import FileClipboard from './clipboard';

export default class WebExplorer {

    data =  {};
    settings = {};
    path = '/';
    rowListener = {};

    constructor(id, server) {

        this.server = server;

        // Dependencies
        this.modal = new Modal();
        this.client = new Client(server);
        this.apps = new Apps(this);
        this.clipboard = new FileClipboard(this);
        this.selection = new Selection(this);

        // DOM
        this.e = document.getElementById(id);
        this.e.classList.add('we');
        
        // Initialization
        this.apps.set('back', () => this.openDir(this.getParent()));
        this.addRowListener('dblclick', rowEvent => {
            if(rowEvent.file) {
                return this.apps.call('open', rowEvent.file, rowEvent.event);
            }

            if(rowEvent.target.dataset.app) {
                return this.apps.call(rowEvent.target.dataset.app, null, rowEvent.event);
            }
        });
    };

    open() {
        this.openDir('/');
    }

    refresh() {
        this.openDir(this.path);
    }

    getParent() {
        let split = we.path.split('/');
        split.pop();

        return split.join('/');
    }

    addRowListener(event, callback) {
        
        if(!Array.isArray(this.rowListener[event])) {
            this.rowListener[event] = [];
        }

        this.rowListener[event].push(callback);
    }

    setSettings(settings) {
        this.settings = settings;
    }

    openDir(path) {

        const we = this;

        path = path === '' ? '/' : path;

        return this.client.request('list', path)
            .then(response => {

                this.path = path;
                we.data = response.data;

                document.querySelectorAll("[data-content='we-current']").forEach(function(e) {
                    e.innerHTML = path;
                });

                let html = '';
                let before = 0;

                if (path !== '/') {
                    html += '<tr data-app="back" class="we-row">';
                    this.settings.rows.every(value => {
                        if(value === 'name') {
                            return false;
                        }

                        before++;

                        return true;
                    });

                    let after = this.settings.rows.length - before - 1;
                    if(before > 0) {
                        html += '<td colspan="' + before + '"></td>'
                    }

                    html += '<td>..</td>';

                    if(after > 0) {
                        html += '<td colspan="' + after + '"></td>'
                    }

                    html += '</tr>';
                }

                response.data.forEach((file, index) => html += this.renderRow(file, index));
                we.e.innerHTML = html;
            })

            .then(() =>
                we.e.querySelectorAll('tr').forEach(e =>
                    Object.keys(this.rowListener).forEach(event => 
                        this.rowListener[event].forEach(listener => 
                            e.addEventListener(event, rowEvent => listener(new RowEvent(this, e, rowEvent)))
                        )
                    )
                )
            );
    }

    renderRow(file, index) {

        let row = '<tr class="we-row" draggable="true" data-app="we-open" data-index="' + index + '">';

        this.settings.rows.forEach(rowName => {

            row += (() => {
                if (we.settings.renderRow[rowName] instanceof Function) {
                    return we.settings.renderRow[rowName](file, rowName, this);
                }

                if (typeof file[rowName] === 'undefined') {
                    return '<td></td>';
                }

                return '<td>' + file[rowName] + '</td>';
            })();

        });

        return row + '</tr>';      
    }
}

1