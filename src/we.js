
import Modal from './modal';
import Client from './client';
import { settings } from './settings/settings';
import Selection from './selection';
import RowEvent from './event/row';
import Apps from './settings/apps';
import FileClipboard from './clipboard';

export default class WebExplorer {

    data =  {};
    path = '/';
    rowListener = {};

    constructor(id, server) {
        
        this.settings = settings;
        this.modal = new Modal();
        this.client = new Client(server);
        this.apps = new Apps(this);
        this.clipboard = new FileClipboard(this);
        this.selection = new Selection(this);

        this.e = document.getElementById(id);
        this.e.classList.add('we');
        this.server = server;

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
                    // Render Back Row at first tr
                    html += (() => {
                        let before = 0;
                        let tr = '<tr data-app="back" class="we-row">';
                        
                        this.settings.rows.every(function(value) {
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

                        tr += '<td>..</td>';

                        if(after > 0) {
                            html += '<td colspan="' + after + '"></td>'
                        }

                        return tr + '</tr>';
                    })();
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

                if (this.settings.renderRow[rowName] instanceof Function) {
                    return this.settings.renderRow[rowName](file, rowName, this);
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

window.WebExplorer = WebExplorer;