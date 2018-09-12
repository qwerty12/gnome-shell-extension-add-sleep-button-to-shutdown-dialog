/*
  Credits:
  * https://github.com/laserb/gnome-shell-extension-suspend-button
  * https://github.com/patriziobruno/grubreboot-gnome-shell-extension
  * http://frippery.org/extensions/ 's Shut Down Menu extension
*/

const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const EndSessionDialog = imports.ui.endSessionDialog;
const Main = imports.ui.main;

let _origupdateButtons;

function init() {
}

function enable() {
    let systemMenu = Main.panel.statusArea['aggregateMenu']._system;
    if (!systemMenu || !systemMenu._systemActions._canHaveSuspend)
        return;

    _origupdateButtons = EndSessionDialog.EndSessionDialog.prototype._updateButtons;

    EndSessionDialog.EndSessionDialog.prototype._custSleep = function() {
        this.cancel();

        let systemMenu = Main.panel.statusArea['aggregateMenu']._system;
        systemMenu._systemActions.activateSuspend();
    };

    EndSessionDialog.EndSessionDialog.prototype._updateButtons = function() {
        let dialogContent = EndSessionDialog.DialogContent[this._type];
        let buttons = [{ action: Lang.bind(this, this.cancel),
                       label:  _("Cancel"),
                       key:    Clutter.Escape }];
        const isShutdown = this._type == EndSessionDialog.DialogType.SHUTDOWN;
        let setDefault = false;

        if (isShutdown) {
            buttons.push({ action: Lang.bind(this, this._custSleep),
                           label:  _("Suspend")});
        }

        for (let i = 0; i < dialogContent.confirmButtons.length; ++i) {
            let signal = dialogContent.confirmButtons[i].signal;
            let label = dialogContent.confirmButtons[i].label;
            let button = { action: Lang.bind(this, function () {
                           this.close(true);
                           let signalId = this.connect('closed',
                             Lang.bind(this, function () {
                               this.disconnect(signalId);
                               this._confirm(signal);
                             }));
                           }),
                           label: label };
            if (isShutdown && !setDefault && signal == 'ConfirmedShutdown')
                button['default'] = setDefault = true;
            buttons.push(button);
        }

        this.setButtons(buttons);
    };
}

function disable() {
    EndSessionDialog.EndSessionDialog.prototype._updateButtons = _origupdateButtons;
    delete EndSessionDialog.EndSessionDialog.prototype._custSleep;
}
